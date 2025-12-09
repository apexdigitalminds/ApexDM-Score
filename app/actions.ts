"use server";

import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";
import { 
    StoreItem, 
    ActionType, 
    AnalyticsData, 
    Profile, 
    User, 
    Badge, 
    Quest 
} from "@/types";

// --- HELPER: Verify User & Resolve UUID ---
async function verifyUser() {
  try {
    const payload = await whopsdk.verifyUserToken(await headers());
    const token = payload as any;
    const whopUserId = token.userId;
    // Whop tokens usually provide the company/store ID in these fields
    const tokenCompanyId = token.companyId || token.scope_id; 
    const roles = token.roles || [];
    
    if (!whopUserId) throw new Error("Unauthorized: No User ID");

    // 1. Check if User is Whop Admin
    const isWhopAdmin = roles && (roles.includes("owner") || roles.includes("admin") || roles.includes("staff") || roles.includes("moderator"));

    // 2. SELF-HEALING: Link DB to Real Company ID (Lazy Link)
    if (isWhopAdmin && tokenCompanyId) {
        // Check if our DB is still using a placeholder or needs linking
        const { data: currentComm } = await supabaseAdmin
            .from('communities')
            .select('id, whop_store_id')
            .limit(1)
            .single();

        // If DB has no Store ID, or it doesn't match the Admin's real ID -> UPDATE IT
        if (currentComm && currentComm.whop_store_id !== tokenCompanyId) {
            console.log(`🔗 Lazy Linking: Updating DB from ${currentComm.whop_store_id} to ${tokenCompanyId}`);
            
            await supabaseAdmin
                .from('communities')
                .update({ 
                    whop_store_id: tokenCompanyId,
                    whop_company_id: tokenCompanyId, // Keep both in sync
                    whop_connected_at: new Date().toISOString()
                })
                .eq('id', currentComm.id);
        }
    }

    // 3. Standard User Lookup
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, role, community_id')
        .eq('whop_user_id', whopUserId)
        .maybeSingle();

    const isDbAdmin = profile?.role === 'admin';
    const isAdmin = isWhopAdmin || isDbAdmin;

    if (!profile) {
        // Allow Admins to pass even if profile isn't made yet (to fix initial setups)
        if (isAdmin) {
             return { userId: null, whopUserId, isAdmin: true, communityId: tokenCompanyId };
        }
        throw new Error("Profile not initialized. Please refresh.");
    }

    // Auto-promote Whop Admins in DB
    if (isWhopAdmin && !isDbAdmin) {
        await supabaseAdmin.from('profiles').update({ role: 'admin' }).eq('id', profile.id);
    }

    return { 
        userId: profile.id, 
        whopUserId, 
        isAdmin,
        communityId: tokenCompanyId || profile.community_id 
    };

  } catch (error: any) {
    console.error("Verify User Error:", error.message);
    throw new Error(error.message || "Unauthorized");
  }
}

async function ensureAdmin() {
    const { isAdmin } = await verifyUser();
    if (!isAdmin) throw new Error("Forbidden: Admin access required");
}

async function getCommunityId(overrideId?: string) {
    if (overrideId) return overrideId;
    const { data: community } = await supabaseAdmin.from('communities').select('id').limit(1).single();
    if (!community) throw new Error("Community not found");
    return community.id;
}

// --- AUTH & SYNC ---
export async function syncUserAction(whopId: string, whopRole: "admin" | "member"): Promise<Profile | null> {
    const { data: existingUser } = await supabaseAdmin.from('profiles').select('*').eq('whop_user_id', whopId).maybeSingle();

    if (existingUser) {
        if (whopRole === 'admin' && existingUser.role !== 'admin') {
            await supabaseAdmin.from('profiles').update({ role: 'admin' }).eq('id', existingUser.id);
            existingUser.role = 'admin';
        }
        return existingUser;
    }

    try {
        const communityId = await getCommunityId();
        const placeholderUsername = `User_${whopId.substring(0, 6)}`; 
        
        const { data: newUser, error } = await supabaseAdmin.from('profiles').insert({
            whop_user_id: whopId,
            community_id: communityId,
            username: placeholderUsername,
            role: whopRole,
            xp: 0,
            streak: 0
        }).select('*').single();

        if (error) return null;
        return newUser;
    } catch (err) {
        return null;
    }
}

// --- 泙 NEW: Robust Branding Sync (With Dev Fallback) ---
export async function syncCommunityBrandingAction() {
    try {
        const { isAdmin, communityId: realWhopId } = await verifyUser();
        
        if (!isAdmin || !realWhopId) throw new Error("Unauthorized or No Company ID found");

        console.log(`Syncing branding for Whop Company ID: ${realWhopId}`);

        let companyName = "ApexDM Community";
        let logoUrl = ""; // Default empty

        // 2. Fetch Info from Whop API
        if (process.env.WHOP_API_KEY) {
            const response = await fetch(`https://api.whop.com/api/v2/companies/${realWhopId}`, {
                headers: {
                    'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                companyName = data.title || data.name;
                logoUrl = data.image_url || data.logo_url;
            } else {
                console.warn(`Whop API Error (${response.status}). Using Fallback.`);
                // 泙 DEV FALLBACK: If 401 in Dev, mock success
                if (process.env.NODE_ENV === 'development') {
                    companyName = "Simulated Community";
                    logoUrl = "https://ui-avatars.com/api/?name=Simulated+Community&background=random"; 
                } else {
                    return { success: false, message: `Whop API Error: ${response.status}` };
                }
            }
        } else if (process.env.NODE_ENV === 'development') {
             // 泙 DEV FALLBACK: No API Key present
             console.warn("No WHOP_API_KEY found. Using Dev Mock.");
             companyName = "Dev Mode Community";
             logoUrl = "https://ui-avatars.com/api/?name=Dev+Mode&background=0D8ABC&color=fff";
        }

        // 3. Update Database 
        const { data: currentDbComm } = await supabaseAdmin.from('communities').select('id').limit(1).single();
        
        if (currentDbComm) {
             const { error } = await supabaseAdmin
            .from('communities')
            .update({ 
                // Only update ID if we are NOT in dev fallback (to avoid breaking FKs with fake IDs)
                // If it's a real sync, we adopt the real ID.
                ...(process.env.WHOP_API_KEY ? { id: realWhopId } : {}),
                name: companyName,
                logo_url: logoUrl
            })
            .eq('id', currentDbComm.id);

            if (error) throw error;
        }

        revalidatePath('/'); 
        return { success: true, message: `Synced as: ${companyName}` };

    } catch (e: any) {
        console.error("Sync Branding Error:", e);
        return { success: false, message: e.message };
    }
}

export async function awardBadgeAction(userId: string, badgeName: string) {
    const { data: badge, error: badgeError } = await supabaseAdmin
        .from('badges')
        .select('id, community_id')
        .eq('name', badgeName)
        .single();

    if (badgeError || !badge) {
        console.error(`Server: Badge '${badgeName}' not found.`);
        return { success: false, message: `Badge '${badgeName}' not found in DB` };
    }

    const { data: existing } = await supabaseAdmin
        .from('user_badges')
        .select('id')
        .eq('user_id', userId)
        .eq('badge_id', badge.id)
        .maybeSingle();

    if (existing) {
        return { success: true, message: `User already has ${badgeName}` };
    }

    let finalCommunityId = badge.community_id;
    if (!finalCommunityId) {
        finalCommunityId = await getCommunityId();
    }

    const payload = {
        user_id: userId,
        badge_id: badge.id,
        community_id: finalCommunityId,
        earned_at: new Date().toISOString()
    };

    const { error: insertError } = await supabaseAdmin
        .from('user_badges')
        .insert(payload);

    if (insertError) {
        console.error("Server: Insert failed", insertError);
        return { success: false, message: `DB Error: ${insertError.message}` };
    }

    revalidatePath('/dashboard');
    revalidatePath('/profile/[userId]');
    return { success: true, message: `Successfully awarded: ${badgeName}` };
}

// --- USER ACTIONS ---

export async function updateUserProfile(updates: any, targetId?: string) {
  const { userId, isAdmin } = await verifyUser();
  if (!userId) throw new Error("User not found");
  const idToUpdate = targetId || userId;
  if (idToUpdate !== userId && !isAdmin) throw new Error("Forbidden");

  const safeUpdates: any = {};
  if (updates.avatarUrl) safeUpdates.avatar_url = updates.avatarUrl;
  if (updates.username) safeUpdates.username = updates.username;
  if (updates.metadata) safeUpdates.metadata = updates.metadata;

  const { error } = await supabaseAdmin.from('profiles').update(safeUpdates).eq('id', idToUpdate);
  return !error;
}

export async function equipCosmeticAction(item: StoreItem) {
  const { userId } = await verifyUser();
  if (!userId) throw new Error("User not found");
  
  const { data: ownership } = await supabaseAdmin.from('user_inventory').select('id').eq('user_id', userId).eq('item_id', item.id).single();
  if (!ownership) return { success: false, message: "You do not own this item." };

  const { data: profile } = await supabaseAdmin.from('profiles').select('metadata').eq('id', userId).single();
  const currentMeta = profile?.metadata || {};

  if (item.itemType === 'NAME_COLOR') currentMeta.nameColor = item.metadata?.color;
  if (item.itemType === 'TITLE') {
      currentMeta.title = item.metadata?.text;
      currentMeta.titlePosition = item.metadata?.titlePosition || 'prefix';
  }
  if (item.itemType === 'BANNER') currentMeta.bannerUrl = item.metadata?.imageUrl;
  if (item.itemType === 'FRAME') currentMeta.frameUrl = item.metadata?.imageUrl;
  if (item.itemType === 'AVATAR_PULSE') currentMeta.avatarPulseColor = item.metadata?.color;

  const { error } = await supabaseAdmin.from('profiles').update({ metadata: currentMeta }).eq('id', userId);
  if (error) return { success: false, message: error.message };
  return { success: true, message: "Equipped successfully!" };
}

export async function unequipCosmeticAction(type: string) {
  const { userId } = await verifyUser();
  if (!userId) throw new Error("User not found");

  const { data: profile } = await supabaseAdmin.from('profiles').select('metadata').eq('id', userId).single();
  const currentMeta = profile?.metadata || {};

  if (type === 'NAME_COLOR') delete currentMeta.nameColor;
  if (type === 'TITLE') { delete currentMeta.title; delete currentMeta.titlePosition; }
  if (type === 'BANNER') delete currentMeta.bannerUrl;
  if (type === 'FRAME') delete currentMeta.frameUrl;
  if (type === 'AVATAR_PULSE') delete currentMeta.avatarPulseColor;

  const { error } = await supabaseAdmin.from('profiles').update({ metadata: currentMeta }).eq('id', userId);
  if (error) return { success: false, message: error.message };
  return { success: true, message: "Unequipped successfully!" };
}

export async function buyStoreItemAction(itemId: string) {
    const { userId } = await verifyUser();
    if (!userId) throw new Error("User not found");
    const { data, error } = await supabaseAdmin.rpc('buy_store_item', { p_user_id: userId, p_item_id: itemId });
    if (error) return { success: false, message: error.message };
    return data;
}

export async function activateInventoryItemAction(inventoryId: string) {
    await verifyUser(); 
    const { data, error } = await supabaseAdmin.rpc('activate_inventory_item', { p_inventory_id: inventoryId });
    if (error) return { success: false, message: error.message };
    return data;
}

export async function claimQuestRewardAction(progressId: number) {
    const { userId } = await verifyUser();
    if (!userId) throw new Error("User not found");
    
    const { data: updatedProgress, error } = await supabaseAdmin
        .from('user_quest_progress')
        .update({ is_claimed: true })
        .eq('id', progressId)
        .eq('user_id', userId)
        .eq('is_completed', true)
        .eq('is_claimed', false)
        .select()
        .single();

    if (error || !updatedProgress) return { success: false, message: 'Error claiming reward.' };

    const { quest_id: questId } = updatedProgress;
    const { data: questData } = await supabaseAdmin.from('quests').select('xp_reward, badge_reward_id').eq('id', questId).single();

    if (!questData) return { success: false, message: "Quest data missing." };

    await supabaseAdmin.rpc('increment_user_xp', { p_user_id: userId, p_xp_to_add: questData.xp_reward });

    if (questData.badge_reward_id) {
        const { count } = await supabaseAdmin.from('user_badges').select('id', { count: 'exact' }).eq('user_id', userId).eq('badge_id', questData.badge_reward_id);
        
        if (count === 0) {
             const { data: community } = await supabaseAdmin.from('communities').select('id').single();
             if (community) {
                  await supabaseAdmin.from('user_badges').insert({ 
                      user_id: userId, 
                      badge_id: questData.badge_reward_id, 
                      community_id: community.id,
                      earned_at: new Date().toISOString()
                  });
             }
        }
    }
    return { success: true, message: `+${questData.xp_reward} XP!` };
}

// --- ADMIN ACTIONS ---

export async function adminUpdateUserStatsAction(targetUserId: string, xp: number, streak: number, freezes: number) {
    await ensureAdmin();
    const { error } = await supabaseAdmin.from('profiles').update({ xp, streak, streak_freezes: freezes }).eq('id', targetUserId);
    return { success: !error };
}

export async function adminUpdateUserRoleAction(targetUserId: string, role: string) {
    const { userId, isAdmin } = await verifyUser();
    if (!isAdmin && userId !== targetUserId) throw new Error("Forbidden");
    const { error } = await supabaseAdmin.from('profiles').update({ role }).eq('id', targetUserId);
    return { success: !error };
}

export async function adminBanUserAction(targetUserId: string, durationHours: number | null) {
    await ensureAdmin();
    let banned_until: string | null = null;
    if (durationHours === 0) banned_until = new Date().toISOString();
    else if (durationHours) {
        const date = new Date();
        date.setHours(date.getHours() + durationHours);
        banned_until = date.toISOString();
    }
    const { error } = await supabaseAdmin.from('profiles').update({ banned_until }).eq('id', targetUserId);
    return { success: !error };
}

export async function adminUpdateCommunityTierAction(tier: any) {
    await ensureAdmin();
    const communityId = await getCommunityId();
    const { error } = await supabaseAdmin.from('communities').update({ subscription_tier: tier }).eq('id', communityId);
    return !error;
}

export async function adminCreateStoreItemAction(itemData: any) {
    await ensureAdmin();
    const communityId = await getCommunityId();
    
    const dbPayload = {
        community_id: communityId,
        name: itemData.name,
        description: itemData.description,
        cost_xp: itemData.cost, 
        icon: itemData.icon,
        item_type: itemData.itemType, 
        is_available: itemData.isActive, 
        duration_hours: itemData.durationHours, 
        modifier: itemData.modifier,
        metadata: itemData.metadata
    };

    const { error } = await supabaseAdmin.from('store_items').insert(dbPayload);
    return !error;
}

export async function adminUpdateStoreItemAction(itemId: string, itemData: any) {
    await ensureAdmin();
    
    const updates: any = {};
    if (itemData.name) updates.name = itemData.name;
    if (itemData.description) updates.description = itemData.description;
    if (itemData.cost) updates.cost_xp = itemData.cost; 
    if (itemData.icon) updates.icon = itemData.icon;
    if (itemData.itemType) updates.item_type = itemData.itemType; 
    if (itemData.isActive !== undefined) updates.is_available = itemData.isActive; 
    if (itemData.durationHours !== undefined) updates.duration_hours = itemData.durationHours; 
    if (itemData.modifier !== undefined) updates.modifier = itemData.modifier;
    if (itemData.metadata) updates.metadata = itemData.metadata;

    const { error } = await supabaseAdmin.from('store_items').update(updates).eq('id', itemId);
    return !error;
}

export async function adminDeleteStoreItemAction(itemId: string) {
    await ensureAdmin();
    const { error } = await supabaseAdmin.from('store_items').update({ is_archived: true, is_available: false }).eq('id', itemId);
    return { success: !error, message: error ? error.message : "Archived" };
}
export async function adminRestoreStoreItemAction(itemId: string) {
    await ensureAdmin();
    const { error } = await supabaseAdmin.from('store_items').update({ is_archived: false }).eq('id', itemId);
    return { success: !error, message: error ? error.message : "Restored" };
}
export async function adminToggleStoreItemAction(itemId: string, isActive: boolean) {
    await ensureAdmin();
    const { error } = await supabaseAdmin.from('store_items').update({ is_available: isActive }).eq('id', itemId);
    return !error;
}

// REWARDS
export async function adminAddRewardAction(actionType: string, xp: number, description?: string) {
    await ensureAdmin();
    const communityId = await getCommunityId();
    const payload: any = { 
        community_id: communityId, 
        action_type: actionType, 
        xp_gained: xp 
    };
    if (description) payload.description = description;

    const { error } = await supabaseAdmin.from('reward_actions').insert(payload);
    return !error;
}

export async function adminUpdateRewardAction(currentActionType: string, data: any) {
    await ensureAdmin();
    const updates: any = {};
    
    // Standard Fields
    if (data.xpGained !== undefined) updates.xp_gained = data.xpGained;
    if (data.isActive !== undefined) updates.is_active = data.isActive; 
    
    // 🟢 FIX: Allow updating Description
    if (data.description !== undefined) updates.description = data.description;

    // 🟢 FIX: Allow Renaming the Action (Action Type)
    // If the new name is different from the current name, update the key.
    if (data.actionType && data.actionType !== currentActionType) {
        updates.action_type = data.actionType;
    }

    // Update the record identified by the OLD action type
    const { error } = await supabaseAdmin
        .from('reward_actions')
        .update(updates)
        .eq('action_type', currentActionType);

    if (!error) revalidatePath('/admin');
    return !error;
}

export async function adminDeleteRewardAction(actionType: string, isArchive: boolean) {
    await ensureAdmin();
    if (isArchive) {
        const { error } = await supabaseAdmin.from('reward_actions').update({ is_archived: true }).eq('action_type', actionType);
        return { success: !error, message: error ? error.message : "Archived" };
    } else {
        const { error } = await supabaseAdmin.from('reward_actions').delete().eq('action_type', actionType);
        return { success: !error, message: error ? error.message : "Deleted" };
    }
}

export async function adminRestoreRewardAction(actionType: string) {
    await ensureAdmin();
    const { error } = await supabaseAdmin.from('reward_actions').update({ is_archived: false }).eq('action_type', actionType);
    return { success: !error, message: error ? error.message : "Restored" };
}

// BADGES
export async function adminAddBadgeAction(name: string, config: any) {
    await ensureAdmin();
    const communityId = await getCommunityId();
    const { error } = await supabaseAdmin.from('badges').insert({ community_id: communityId, name, ...config });
    return !error;
}
export async function adminUpdateBadgeAction(currentName: string, config: any) {
    await ensureAdmin();
    const communityId = await getCommunityId();
    const updates: any = {};

    // Standard Fields
    if (config.description !== undefined) updates.description = config.description;
    if (config.icon !== undefined) updates.icon = config.icon;
    if (config.color !== undefined) updates.color = config.color;
    if (config.isActive !== undefined) updates.is_active = config.isActive; 
    
    // 🟢 FIX: Allow Renaming the Badge
    // If a new name is provided and it's different from the current one, update it.
    if (config.name && config.name !== currentName) {
        updates.name = config.name;
    }
    
    const { error } = await supabaseAdmin
        .from('badges')
        .update(updates)
        .eq('name', currentName) // Find record by the OLD name
        .eq('community_id', communityId);

    return !error;
}
export async function adminDeleteBadgeAction(name: string, isArchive: boolean) {
    await ensureAdmin();
    const communityId = await getCommunityId();
    const { data: badge } = await supabaseAdmin.from('badges').select('id').eq('name', name).eq('community_id', communityId).single();
    if (!badge) return { success: false, message: "Badge not found" };

    if (isArchive) {
        const { error } = await supabaseAdmin.from('badges').update({ is_archived: true }).eq('id', badge.id);
        return { success: !error, message: error ? error.message : "Archived" };
    } else {
        const { error } = await supabaseAdmin.from('badges').delete().eq('id', badge.id);
        return { success: !error, message: error ? error.message : "Deleted" };
    }
}
export async function adminRestoreBadgeAction(name: string) {
    await ensureAdmin();
    const communityId = await getCommunityId();
    const { error } = await supabaseAdmin.from('badges').update({ is_archived: false }).eq('name', name).eq('community_id', communityId);
    return { success: !error, message: error ? error.message : "Restored" };
}

// QUESTS
export async function adminCreateQuestAction(questData: any) {
    await ensureAdmin();
    const communityId = await getCommunityId();
    let badgeId = questData.badgeRewardId;
    
    if (!badgeId && questData.badgeReward) {
            const { data: badge } = await supabaseAdmin.from('badges').select('id').eq('name', questData.badgeReward).eq('community_id', communityId).single();
            if (badge) badgeId = badge.id;
    }
    
    const { data: newQuest, error } = await supabaseAdmin.from('quests').insert({
        community_id: communityId, 
        title: questData.title, 
        description: questData.description, 
        xp_reward: questData.xpReward, 
        badge_reward_id: badgeId, 
        is_active: true, 
    }).select().single();
    
    if (error || !newQuest) return false;

    const tasksToInsert = (questData.tasks ?? []).map((task: any) => ({
        quest_id: newQuest.id, 
        action_type: task.actionType, 
        target_count: task.targetCount, 
        description: task.description || "", 
    }));
    
    await supabaseAdmin.from('quest_tasks').insert(tasksToInsert);
    return true;
}

// 🟢 FIX: Updated Quest Logic (Wipe & Replace Tasks)
export async function adminUpdateQuestAction(questId: string, questData: any) {
    await ensureAdmin();

    // 1. Update the Main Quest Details (Title, Description, XP)
    const { error: questError } = await supabaseAdmin.from('quests').update({
        title: questData.title, 
        description: questData.description, 
        xp_reward: questData.xpReward
    }).eq('id', questId);

    if (questError) {
        console.error("Error updating quest details:", questError);
        return false;
    }

    // 2. Handle Tasks (If provided)
    if (questData.tasks && Array.isArray(questData.tasks)) {
        
        // A. Delete ALL existing tasks for this quest (Wipe)
        const { error: deleteError } = await supabaseAdmin
            .from('quest_tasks')
            .delete()
            .eq('quest_id', questId);

        if (deleteError) {
            console.error("Error clearing old tasks:", deleteError);
            return false;
        }

        // B. Format the new tasks for insertion
        const tasksToInsert = questData.tasks.map((task: any) => ({
            quest_id: questId,
            action_type: task.actionType,
            target_count: task.targetCount,
            description: task.description || ""
        }));

        // C. Insert the new tasks (Replace)
        if (tasksToInsert.length > 0) {
            const { error: insertError } = await supabaseAdmin
                .from('quest_tasks')
                .insert(tasksToInsert);

            if (insertError) {
                console.error("Error inserting new tasks:", insertError);
                return false;
            }
        }
    }

    // 3. Revalidate to show changes immediately
    revalidatePath('/admin');
    revalidatePath('/quests');
    
    return true; 
}

export async function adminDeleteQuestAction(questId: string) {
    await ensureAdmin();
    const { error } = await supabaseAdmin.from('quests').update({ is_archived: true, is_active: false }).eq('id', questId);
    return { success: !error, message: error ? error.message : "Archived" };
}
export async function adminRestoreQuestAction(questId: string) {
    await ensureAdmin();
    const { error } = await supabaseAdmin.from('quests').update({ is_archived: false }).eq('id', questId);
    return { success: !error, message: error ? error.message : "Restored" };
}
export async function adminToggleQuestAction(questId: string, isActive: boolean) {
    await ensureAdmin();
    const { error } = await supabaseAdmin.from('quests').update({ is_active: isActive }).eq('id', questId);
    return !error;
}

// SERVER-SIDE ACTION RECORDING
export async function recordActionServer(userId: string, actionType: ActionType, source: string) {
    const { data: rewardData } = await supabaseAdmin.from('reward_actions').select('xp_gained').eq('action_type', actionType).single();
    if (!rewardData) return null;
    let xp_to_add = rewardData.xp_gained;

    const { data: activeEffects } = await supabaseAdmin.from('user_active_effects').select('modifier').eq('user_id', userId).eq('effect_type', 'XP_BOOST').gt('expires_at', new Date().toISOString());
    if (activeEffects && activeEffects.length > 0) xp_to_add = Math.round(xp_to_add * (activeEffects[0].modifier || 1));

    await supabaseAdmin.rpc('increment_user_xp', { p_user_id: userId, p_xp_to_add: xp_to_add });
    const { data: community } = await supabaseAdmin.from('communities').select('id').single();
    
    if (community) {
        await supabaseAdmin.from('actions_log').insert({ user_id: userId, community_id: community.id, action_type: actionType, xp_gained: xp_to_add, source: source });
    }
    
    return { xpGained: xp_to_add };
}

// ANALYTICS (Server Side)
export async function getAnalyticsDataServer(dateRange: '7d' | '30d'): Promise<AnalyticsData | null> {
    try {
        const { isAdmin, communityId: tokenCommunityId } = await verifyUser();
        if (!isAdmin) return null;

        const communityId = await getCommunityId(tokenCommunityId);

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const dateLimit7d = new Date(new Date().setDate(now.getDate() - 7)).toISOString();
        const dateLimit14d = new Date(new Date().setDate(now.getDate() - 14)).toISOString();
        const dateLimit30d = new Date(new Date().setDate(now.getDate() - 30)).toISOString();
        
        const [
            profilesResult,
            actionsResult,
            userBadgesResult,
            questsResult,
            userQuestProgressResult,
            userPurchasesResult,
        ] = await Promise.all([
            supabaseAdmin.from('profiles').select('*').eq('community_id', communityId),
            supabaseAdmin.from('actions_log').select('*').eq('community_id', communityId).gte('created_at', dateLimit30d),
            supabaseAdmin.from('user_badges').select('badges!inner(name, icon, color)').eq('community_id', communityId),
            supabaseAdmin.from('quests').select('*').eq('community_id', communityId),
            supabaseAdmin.from('user_quest_progress').select('*'),
            supabaseAdmin.from('user_inventory').select('store_items!inner(name, cost_xp)').eq('community_id', communityId),
        ]);
        
        const allProfiles = profilesResult.data || [];
        const allActions = actionsResult.data || [];
        const allQuests = questsResult.data || [];
        const allUserPurchases = userPurchasesResult.data || [];
        const allUserQuestProgress = userQuestProgressResult.data || [];

        const totalUsers = allProfiles.length;
        if (totalUsers === 0) return null;

        const activeMembers7d = allProfiles.filter((p: any) => p.last_action_date && new Date(p.last_action_date).toISOString() >= dateLimit7d).length;
        const activeMembers30d = allProfiles.filter((p: any) => p.last_action_date && new Date(p.last_action_date).toISOString() >= dateLimit30d).length;
        
        const actionsToday = allActions.filter((a: any) => a.created_at && a.created_at >= todayStart);
        const xpEarnedToday = actionsToday.reduce((sum: number, a: any) => sum + (a.xp_gained || 0), 0);

        const newMembers7d = allProfiles.filter((p: any) => p.created_at && new Date(p.created_at).toISOString() >= dateLimit7d).length;
        const churnedMembers14d = allProfiles.filter((p: any) => !p.last_action_date || new Date(p.last_action_date).toISOString() < dateLimit14d).length;

        const mapUser = (p: any): Profile => ({
            id: p.id, username: p.username, avatarUrl: p.avatar_url, xp: p.xp, streak: p.streak,
            communityId: p.community_id, streakFreezes: p.streak_freezes, last_action_date: p.last_action_date, badges: [], role: p.role, level: 0, metadata: p.metadata
        });

        const topPerformers = {
            byXp: [...allProfiles].sort((a: any, b: any) => (Number(b.xp) || 0) - (Number(a.xp) || 0)).slice(0, 10).map(mapUser),
            byStreak: [...allProfiles].sort((a: any, b: any) => (Number(b.streak) || 0) - (Number(a.streak) || 0)).slice(0, 10).map(mapUser),
        };

        const actionCounts: Record<string, number> = {};
        for (const action of allActions) {
             const type = (action.action_type || 'unknown');
             actionCounts[type] = (actionCounts[type] || 0) + 1;
        }
        const activityBreakdown = Object.entries(actionCounts).map(([label, value]) => ({ label: label.replace(/_/g, ' '), value }));
        
        const totalStreaks = allProfiles.reduce((sum: number, p: any) => sum + (Number(p.streak) || 0), 0);
        const membersWithActiveStreak = allProfiles.filter((p: any) => p.streak > 0).length;
        
        const streakHealth = {
            avgStreakLength: membersWithActiveStreak > 0 ? Math.round(totalStreaks / membersWithActiveStreak) : 0,
            percentWithActiveStreak: Math.round((membersWithActiveStreak / totalUsers) * 100),
        };

        const xpByAction: Record<string, number> = {};
        for (const action of allActions) {
            const type = (action.action_type || 'unknown').replace(/_/g, ' ');
            xpByAction[type] = (xpByAction[type] || 0) + (action.xp_gained || 0);
        }
        const topXpActions = Object.entries(xpByAction).sort((a, b) => b[1] - a[1]).slice(0, 5)
            .map(([actionType, totalXp]) => ({ actionType: actionType as ActionType, totalXp }));
        
        const badgeCounts: Record<string, { name: string; icon: string; color: string; count: number }> = {};
        for (const userBadge of userBadgesResult.data || []) {
            const badge = userBadge.badges;
            const bData = Array.isArray(badge) ? badge[0] : badge;
            if(bData && bData.name) {
                if (!badgeCounts[bData.name]) badgeCounts[bData.name] = { name: bData.name, icon: bData.icon, color: bData.color, count: 0 };
                badgeCounts[bData.name].count += 1;
            }
        }
        const topBadges = Object.values(badgeCounts).sort((a,b) => b.count - a.count).slice(0, 6);

        const questAnalytics: any = allQuests.map((quest: any) => {
            const participants = allUserQuestProgress.filter((p: any) => p.quest_id === quest.id);
            const completers = participants.filter((p: any) => p.is_completed);
            return {
                questId: quest.id,
                title: quest.title,
                participationRate: totalUsers > 0 ? (participants.length / totalUsers) * 100 : 0,
                completionRate: participants.length > 0 ? (completers.length / participants.length) * 100 : 0,
            };
        }).sort((a: any, b: any) => b.participationRate - a.participationRate);
        
        const itemsCounter: Record<string, number> = {};
        for (const p of allUserPurchases) {
            const itemData = Array.isArray(p.store_items) ? p.store_items[0] : p.store_items;
            const iName = itemData?.name;
            if (iName) itemsCounter[iName] = (itemsCounter[iName] || 0) + 1;
        }

        const totalItems = Object.values(itemsCounter).reduce((sum, c) => sum + c, 0);
        const xpSpent = allUserPurchases.reduce((sum: number, p: any) => {
            const itemData = Array.isArray(p.store_items) ? p.store_items[0] : p.store_items;
            return sum + (Number(itemData?.cost_xp) || 0);
        }, 0);
        const mostPopularItem = Object.entries(itemsCounter).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "None";

        return {
            engagement: { 
                activeMembers7d, 
                activeMembers30d, 
                avgDailyActions: actionsToday.length, 
                xpEarnedToday 
            },
            growth: { newMembers7d, churnedMembers14d },
            topPerformers, activityBreakdown, streakHealth, topXpActions, topBadges, questAnalytics,
            storeAnalytics: { totalItems, xpSpent, mostPopularItem, totalSpent: xpSpent, items: Object.entries(itemsCounter).map(([name, count]) => ({ name, count })) },
        };
    } catch (error: any) { 
        console.error("Server Analytics Error:", error);
        return null; 
    }
}