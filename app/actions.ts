"use server";

import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { StoreItem, ActionType } from "@/types";
import { revalidatePath } from "next/cache"; // 🟢 NEW: For refreshing data

// --- HELPER: Verify User & Resolve UUID ---
async function verifyUser() {
  try {
    const payload = await whopsdk.verifyUserToken(await headers());
    const token = payload as any;
    const whopUserId = token.userId;
    const roles = token.roles || [];
    
    if (!whopUserId) throw new Error("Unauthorized: No User ID");

    // 🟢 CRITICAL FIX: Resolve Whop ID (String) -> Internal ID (UUID)
    const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('id, role')
        .eq('whop_user_id', whopUserId)
        .maybeSingle();

    if (!profile) {
        // If profile doesn't exist yet, we can't perform actions.
        // The Client Side 'api.getUserByWhopId' usually handles creation, 
        // but to be safe, we throw specific error here.
        throw new Error("Profile not initialized. Please refresh the page.");
    }
    
    // Check Whop Roles
    const isAdmin = roles && (
        roles.includes("owner") || 
        roles.includes("admin") || 
        roles.includes("staff") || 
        roles.includes("moderator")
    );

    return { 
        userId: profile.id, // 🟢 This is now the UUID
        whopUserId, 
        isAdmin 
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

async function getCommunityId() {
    const { data: community } = await supabaseAdmin.from('communities').select('id').single();
    if (!community) throw new Error("Community not found");
    return community.id;
}

// --- USER ACTIONS ---

export async function updateUserProfile(updates: any, targetId?: string) {
  const { userId, isAdmin } = await verifyUser();
  const idToUpdate = targetId || userId;

  // Security Check: Users can only update themselves
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
  
  // 1. Verify Ownership using UUID
  const { data: ownership } = await supabaseAdmin.from('user_inventory').select('id').eq('user_id', userId).eq('item_id', item.id).single();
  if (!ownership) return { success: false, message: "You do not own this item." };

  // 2. Fetch Metadata
  const { data: profile } = await supabaseAdmin.from('profiles').select('metadata').eq('id', userId).single();
  const currentMeta = profile?.metadata || {};

  // 3. Apply Cosmetic
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
  const { userId } = await verifyUser(); // UUID
  const { data: profile } = await supabaseAdmin.from('profiles').select('metadata').eq('id', userId).single();
  const currentMeta = profile?.metadata || {};

  // Delete keys
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
    const { userId } = await verifyUser(); // UUID
    // Now passing UUID to RPC function
    const { data, error } = await supabaseAdmin.rpc('buy_store_item', { p_user_id: userId, p_item_id: itemId });
    if (error) return { success: false, message: error.message };
    return data;
}

export async function activateInventoryItemAction(inventoryId: string) {
    await verifyUser(); // Just auth check
    // RPC handles logic
    const { data, error } = await supabaseAdmin.rpc('activate_inventory_item', { p_inventory_id: inventoryId });
    if (error) return { success: false, message: error.message };
    return data;
}

export async function claimQuestRewardAction(progressId: number) {
    const { userId } = await verifyUser(); // UUID
    
    const { data: updatedProgress, error } = await supabaseAdmin
        .from('user_quest_progress')
        .update({ is_claimed: true })
        .eq('id', progressId)
        .eq('user_id', userId)
        .eq('is_completed', true)
        .eq('is_claimed', false)
        .select()
        .single();

    if (error || !updatedProgress) return { success: false, message: 'Error claiming reward or already claimed.' };

    const { quest_id: questId } = updatedProgress;
    const { data: questData } = await supabaseAdmin.from('quests').select('xp_reward, badge_reward_id').eq('id', questId).single();

    if (!questData) return { success: false, message: "Quest data missing." };

    await supabaseAdmin.rpc('increment_user_xp', { p_user_id: userId, p_xp_to_add: questData.xp_reward });

    if (questData.badge_reward_id) {
        const { data: community } = await supabaseAdmin.from('communities').select('id').single();
        if (community) {
             await supabaseAdmin.from('user_badges').insert({ user_id: userId, badge_id: questData.badge_reward_id, community_id: community.id });
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
    // Allow self-update for sync
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

// STORE ITEMS
export async function adminCreateStoreItemAction(itemData: any) {
    await ensureAdmin();
    const communityId = await getCommunityId();
    const { error } = await supabaseAdmin.from('store_items').insert({ ...itemData, community_id: communityId });
    return !error;
}
export async function adminUpdateStoreItemAction(itemId: string, itemData: any) {
    await ensureAdmin();
    const { error } = await supabaseAdmin.from('store_items').update(itemData).eq('id', itemId);
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
export async function adminAddRewardAction(actionType: string, xp: number) {
    await ensureAdmin();
    const communityId = await getCommunityId();
    const { error } = await supabaseAdmin.from('reward_actions').insert({ community_id: communityId, action_type: actionType, xp_gained: xp });
    return !error;
}
// 🟢 FIX: Reward Update
export async function adminUpdateRewardAction(actionType: string, data: any) {
    await ensureAdmin();
    const updates: any = {};
    if (data.xpGained !== undefined) updates.xp_gained = data.xpGained;
    if (data.isActive !== undefined) updates.is_active = data.isActive;
    
    const { error } = await supabaseAdmin.from('reward_actions').update(updates).eq('action_type', actionType);
    
    if (!error) {
        revalidatePath('/admin'); // Force UI refresh
    }
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
export async function adminUpdateBadgeAction(name: string, config: any) {
    await ensureAdmin();
    const communityId = await getCommunityId();
    const updates: any = {};
    if (config.description !== undefined) updates.description = config.description;
    if (config.icon !== undefined) updates.icon = config.icon;
    if (config.color !== undefined) updates.color = config.color;
    if (config.isActive !== undefined) updates.is_active = config.isActive;
    const { error } = await supabaseAdmin.from('badges').update(updates).eq('name', name).eq('community_id', communityId);
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
        community_id: communityId, title: questData.title, description: questData.description, xp_reward: questData.xpReward, badge_reward_id: badgeId, is_active: true, 
    }).select().single();
    if (error || !newQuest) return false;

    const tasksToInsert = (questData.tasks ?? []).map((task: any) => ({
        quest_id: newQuest.id, action_type: task.actionType, target_count: task.targetCount, description: task.description,
    }));
    await supabaseAdmin.from('quest_tasks').insert(tasksToInsert);
    return true;
}
export async function adminUpdateQuestAction(questId: string, questData: any) {
    await ensureAdmin();
    const { error } = await supabaseAdmin.from('quests').update({
        title: questData.title, description: questData.description, xp_reward: questData.xpReward
    }).eq('id', questId);
    if (error) return false;
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