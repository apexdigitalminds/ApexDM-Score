import { supabase } from './supabase';
import type {
    User,
    Action,
    Badge,
    RewardsConfig,
    BadgeConfig,
    BadgesConfig,
    Community,
    Quest,
    UserQuestProgress,
    QuestTask,
    AnalyticsData,
    StoreItem,
    UserInventoryItem,
    ActiveEffect,
    ActionType
} from '@/types';

// --- DATA TRANSFORMATION HELPERS ---
const profileFromSupabase = (data: any): User => {
    const badges: Badge[] = (data.user_badges || [])
        .map((join: any) => (join.badges ? badgeFromSupabase(join.badges) : null))
        .filter((b: Badge | null): b is Badge => b !== null);

    return {
        id: data.id,
        communityId: data.community_id,
        username: data.username,
        avatarUrl: data.avatar_url,
        xp: data.xp,
        streak: data.streak,
        streakFreezes: data.streak_freezes,
        last_action_date: data.last_action_date,
        role: data.role,
        whopUser: data.whop_user_id ? {
            id: data.whop_user_id,
            username: data.username 
        } : undefined,
        bannedUntil: data.banned_until,
        badges,
        level: Math.floor((data.xp ?? 0) / 100), 
    };
};

const actionFromSupabase = (data: any): Action => ({
    id: data.id,
    userId: data.user_id,
    communityId: data.community_id,
    actionType: data.action_type,
    xpGained: data.xp_gained ?? 0,
    createdAt: data.created_at,
    source: data.source,
});

const badgeFromSupabase = (data: any): Badge => ({
  id: data.id,
  name: data.name,
  description: data.description,
  icon: data.icon,
  color: data.color,
  communityId: data.community_id ?? "",
  isActive: !data.is_archived,
  isArchived: data.is_archived
});

const questFromSupabase = (data: any): Quest => ({
    id: data.id,
    communityId: data.community_id ?? "",
    title: data.title,
    description: data.description,
    tasks: (data.quest_tasks || []).map((task: any): QuestTask => ({
        id: task.id ?? "",
        questId: task.quest_id ?? "",
        actionType: task.action_type,
        targetCount: task.target_count,
        description: task.description,
    })),
    xpReward: data.xp_reward,
    badgeReward: data.badges ? data.badges.name : null,
    badgeRewardId: data.badge_reward_id,
    isActive: data.is_active,
    isArchived: data.is_archived,
});

const userQuestProgressFromSupabase = (data: any): UserQuestProgress => ({
    id: data.id,
    userId: data.user_id ?? "",
    questId: data.quest_id,
    progress: data.progress,
    completed: data.is_completed,
    isClaimed: data.is_claimed,
});

const storeItemFromSupabase = (data: any): StoreItem => ({
    id: data.id,
    communityId: data.community_id ?? "",
    name: data.name,
    description: data.description,
    cost: data.cost_xp,
    icon: data.icon,
    isActive: data.is_available,
    isArchived: data.is_archived,
    itemType: data.item_type,
    durationHours: data.duration_hours,
    modifier: data.modifier,
});

const inventoryItemFromSupabase = (data: any): UserInventoryItem => ({
    id: data.id,
    userId: data.user_id,
    itemId: data.item_id,
    purchasedAt: data.purchased_at,
    itemDetails: data.store_items ? storeItemFromSupabase(data.store_items) : undefined,
    isActive: data.is_active ?? false,
});

const activeEffectFromSupabase = (data: any): ActiveEffect => ({
    id: data.id,
    userId: data.user_id,
    itemId: data.item_id ?? "",
    effectType: data.effect_type,
    modifier: data.modifier,
    expiresAt: data.expires_at,
});

let COMMUNITY_ID: string | null = null;
const getCommunityId = async () => {
    if (COMMUNITY_ID) return COMMUNITY_ID;
    const { data, error } = await supabase.from('communities').select('id').limit(1).single();
    if (error || !data) {
        console.error("Could not fetch community ID", error?.message);
        throw new Error("A community must be configured in the database.");
    }
    COMMUNITY_ID = data.id;
    return COMMUNITY_ID;
};

const PROFILE_COLUMNS = 'id, community_id, username, avatar_url, xp, streak, streak_freezes, last_action_date, role, whop_user_id, banned_until';

export const api = {
    // READ operations
    getUsers: async (): Promise<User[]> => {
        const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select(PROFILE_COLUMNS)
            .order('xp', { ascending: false });

        if (profilesError) {
            console.error('Error fetching users:', profilesError.message);
            return [];
        }

        const { data: allUserBadges, error: allUserBadgesError } = await supabase
            .from('user_badges')
            .select('user_id, badge_id!inner(id, name, description, icon, color, is_archived)');
        
        if (allUserBadgesError) {
            console.error('Error fetching all user badges:', allUserBadgesError.message);
        }
        
        const badgesByUserId = new Map<string, any[]>();
        if (allUserBadges) {
            for (const userBadge of allUserBadges) {
                if (userBadge.user_id) {
                    if (!badgesByUserId.has(userBadge.user_id)) {
                        badgesByUserId.set(userBadge.user_id, []);
                    }
                    if (userBadge.badge_id) {
                         badgesByUserId.get(userBadge.user_id)!.push({ badges: userBadge.badge_id });
                    }
                }
            }
        }

        return profilesData.map(profile => {
            const enrichedProfile = {
                ...profile,
                user_badges: badgesByUserId.get(profile.id) || [],
            };
            return profileFromSupabase(enrichedProfile);
        });
    },

    getUserById: async (userId: string): Promise<User | null> => {
        const { data, error } = await supabase
            .from('profiles')
            .select(PROFILE_COLUMNS)
            .eq('id', userId)
            .limit(1)
            .maybeSingle();

        if (error) {
            console.warn(`Profile fetch warning for ${userId}:`, error.message);
            return null;
        }
        
        if (!data) return null;
        
        const { data: userBadges, error: badgesError } = await supabase
            .from('user_badges')
            .select('badge_id!inner(id, name, description, icon, color, is_archived)')
            .eq('user_id', userId);

        if (badgesError) {
             console.error(`Error fetching badges for user ${userId}:`, badgesError.message);
        }

        const enrichedProfile = {
            ...data,
            user_badges: (userBadges || []).map(b => ({ badges: b.badge_id })),
        };
        
        return profileFromSupabase(enrichedProfile);
    },

    // 泙 UPDATED: Auto-creates user if not found
    getUserByWhopId: async (whopId: string): Promise<User | null> => {
        // 1. Try to get existing user
        const { data: existingUser, error: fetchError } = await supabase
            .from('profiles')
            .select(PROFILE_COLUMNS)
            .eq('whop_user_id', whopId)
            .maybeSingle();

        if (!fetchError && existingUser) {
            // User exists, fetch badges and return
            const { data: userBadges } = await supabase
                .from('user_badges')
                .select('badge_id!inner(id, name, description, icon, color, is_archived)')
                .eq('user_id', existingUser.id);

            const enrichedProfile = {
                ...existingUser,
                user_badges: (userBadges || []).map(b => ({ badges: b.badge_id })),
            };
            return profileFromSupabase(enrichedProfile);
        }

        // 2. User does not exist, create them
        console.log("User not found in DB, creating new profile for Whop ID:", whopId);
        
        try {
            const communityId = await getCommunityId();
            // Generate a placeholder username since we don't have Whop metadata yet
            // In a real app, you might fetch this from Whop API using the token
            const placeholderUsername = `User_${whopId.substring(0, 6)}`; 
            
            const { data: newUser, error: createError } = await supabase
                .from('profiles')
                .insert({
                    whop_user_id: whopId,
                    community_id: communityId,
                    username: placeholderUsername,
                    role: 'member',
                    xp: 0,
                    streak: 0
                })
                .select(PROFILE_COLUMNS)
                .single();

            if (createError || !newUser) {
                console.error("Failed to auto-create user:", createError?.message);
                return null;
            }

            // Return the newly created user
            return profileFromSupabase({ ...newUser, user_badges: [] });

        } catch (err) {
            console.error("Error during user auto-creation:", err);
            return null;
        }
    },

     getCurrentUserProfile: async (): Promise<User | null> => {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return null;
        }
        const profile = await api.getUserById(user.id);

        if (profile) {
            (profile as any).created_at = user.created_at;
        }
        return profile;
    },
    getUserActions: async (userId: string): Promise<Action[]> => {
        const { data, error } = await supabase
            .from('actions_log')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            console.error(`Error fetching actions for user ${userId}:`, error.message);
            return [];
        }
        return data.map(actionFromSupabase);
    },
getRewardsConfig: async (): Promise<RewardsConfig> => {
        const { data, error } = await supabase
            .from('reward_actions')
            .select('action_type, xp_gained, is_archived, is_active'); 
        
        if (error) {
            console.error('Error fetching rewards config:', error.message);
            return {};
        }

        return data.reduce((acc, reward) => {
            acc[reward.action_type] = { 
                xpGained: reward.xp_gained,
                isArchived: reward.is_archived,
                isActive: reward.is_active 
            };
            return acc;
        }, {} as any);
    },
    getBadgesConfig: async (): Promise<BadgesConfig> => {
        const communityId = await getCommunityId();
        const { data, error } = await supabase
            .from('badges')
            .select('name, description, icon, color, is_archived')
            .eq('community_id', communityId);

        if (error || !data) {
            console.error('Error fetching badges config:', error?.message);
            return {};
        }

        return data.reduce((acc, badge) => {
            acc[badge.name] = {
                name: badge.name,
                description: badge.description,
                icon: badge.icon,
                color: badge.color,
                isArchived: badge.is_archived
            };
            return acc;
        }, {} as any);
    },
    getCommunityInfo: async (): Promise<Community | null> => {
        try {
            const id = await getCommunityId();
            const { data, error } = await supabase
                .from('communities')
                .select('*')
                .eq('id', id)
                .single();

            if (error) return null;

            return {
                id: data.id,
                name: data.name,
                description: data.description,
                logoUrl: data.logo_url,
                tier: data.subscription_tier ?? "Free",
                trialEndsAt: data.trial_ends_at,
                whiteLabelEnabled: data.white_label_enabled ?? false, 
            };
        } catch (e) {
            console.error(e);
            return null;
        }
    },
    updateCommunityBranding: async (enabled: boolean) => { 
        const communityId = await getCommunityId();
        const { error } = await supabase
            .from('communities')
            .update({ white_label_enabled: enabled })
            .eq('id', communityId);
            
        if (error) {
            console.error("Error updating branding:", error.message);
            return false;
        }
        return true;
    },
     getQuests: async (): Promise<Quest[]> => {
        const { data, error } = await supabase
            .from('quests')
            .select('id, title, description, xp_reward, is_active, is_archived, quest_tasks(*), badges!left(name)')
            .eq('is_active', true)
            .eq('is_archived', false)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching active quests:', error.message);
            return [];
        }
        return data.map(questFromSupabase);
    },
    getQuestsAdmin: async (): Promise<Quest[]> => {
        const { data, error } = await supabase
            .from('quests')
            .select('id, title, description, xp_reward, is_active, is_archived, badge_reward_id, quest_tasks(*), badges!left(name)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching admin quests:', error.message);
            return [];
        }
        return data.map(questFromSupabase);
    },
    getUserQuestProgress: async (userId: string): Promise<UserQuestProgress[]> => {
        const { data, error } = await supabase
            .from('user_quest_progress')
            .select('*')
            .eq('user_id', userId);

        if (error) {
            console.error('Error fetching user quest progress:', error.message);
            return [];
        }
        return data.map(userQuestProgressFromSupabase);
    },
getStoreItems: async (): Promise<StoreItem[]> => {
        const { data, error } = await supabase
            .from('store_items')
            .select('*')
            .order('cost_xp', { ascending: true })
            .order('name', { ascending: true }); 

        if (error) {
            console.error('Error fetching store items:', error.message);
            return [];
        }
        return data.map(storeItemFromSupabase);
    },
getUserItemUsage: async (userId: string) => {
        const { data, error } = await supabase
            .from('item_usage_logs')
            .select('*')
            .eq('user_id', userId)
            .order('used_at', { ascending: false })
            .limit(5); 
            
        if (error) return [];
        return data;
    },
    recordAction: async (userId: string, actionType: string, source: 'manual' | 'whop' | 'discord') => {
        const { data: rewardData, error: rewardError } = await supabase
            .from('reward_actions').select('xp_gained').eq('action_type', actionType).single();

        if (rewardError || !rewardData) {
            console.error(`No reward configured for action: ${actionType}`);
            return null;
        }
        let xp_to_add = rewardData.xp_gained;

        const { data: activeEffects, error: effectsError } = await supabase
            .from('user_active_effects')
            .select('modifier')
            .eq('user_id', userId)
            .eq('effect_type', 'XP_BOOST')
            .gt('expires_at', new Date().toISOString());
        
        if (activeEffects && activeEffects.length > 0) {
            const modifier = activeEffects[0].modifier || 1;
            xp_to_add = Math.round(xp_to_add * modifier);
        }

        const { data: profile, error: profileError } = await supabase
            .from('profiles').select('streak, last_action_date, streak_freezes').eq('id', userId).single();

        if (profileError || !profile) {
            console.error("Could not find user profile to update.", profileError?.message);
            return null;
        }

        const today = new Date();
        const lastAction = profile.last_action_date ? new Date(profile.last_action_date) : new Date(0); 

        const utcToday = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
        const utcLast = Date.UTC(lastAction.getUTCFullYear(), lastAction.getUTCMonth(), lastAction.getUTCDate());

        const msPerDay = 1000 * 60 * 60 * 24;
        const diffDays = Math.floor((utcToday - utcLast) / msPerDay);

        let new_streak = profile.streak;
        let freezes_used = 0;
        let shouldUpdateDate = false;

        if (diffDays === 0) {
            shouldUpdateDate = false; 
        } 
        else if (diffDays === 1) {
            new_streak += 1;
            shouldUpdateDate = true;
        } 
        else if (diffDays > 1) {
            if (profile.streak_freezes > 0) {
                freezes_used = 1;
                shouldUpdateDate = true;
            } else {
                new_streak = 1;
                shouldUpdateDate = true;
            }
        } else {
            shouldUpdateDate = true;
        }
        
        const { error: xpError } = await supabase.rpc('increment_user_xp', {
            p_user_id: userId, p_xp_to_add: xp_to_add
        });
        
        if (xpError) {
            console.error("Error incrementing user XP:", xpError.message);
            return null;
        }

        if (shouldUpdateDate) {
            await supabase.from('profiles').update({
                streak: new_streak,
                last_action_date: new Date().toISOString(), 
                streak_freezes: profile.streak_freezes - freezes_used
            }).eq('id', userId);
        }
        
        const communityId = await getCommunityId();
        await supabase.from('actions_log').insert({
            user_id: userId, community_id: communityId, action_type: actionType,
            xp_gained: xp_to_add, source: source
        });

        const { data: activeQuests } = await supabase.from('quests').select('id, quest_tasks(*)').eq('is_active', true).eq('is_archived', false);
        
        if (activeQuests) {
            const { data: userProgress } = await supabase.from('user_quest_progress').select('*').eq('user_id', userId);
            const progressMap = new Map((userProgress || []).map(p => [p.quest_id, p]));

            for (const quest of activeQuests) {
                if (!quest.quest_tasks) continue;
                const hasRelevantTask = quest.quest_tasks.some((t: any) => t.action_type === actionType);
                
                if (hasRelevantTask) {
                    const existing = progressMap.get(quest.id);
                    if (existing && existing.is_completed) continue;

                    let currentProgress: Record<string, number> = existing ? (existing.progress as any || {}) : {};
                    currentProgress[actionType] = (currentProgress[actionType] || 0) + 1;

                    const isNowComplete = quest.quest_tasks.every((task: any) => 
                        (currentProgress[task.action_type] || 0) >= task.target_count
                    );

                    if (existing) {
                        await supabase.from('user_quest_progress').update({ progress: currentProgress, is_completed: isNowComplete }).eq('id', existing.id);
                    } else {
                        await supabase.from('user_quest_progress').insert({ user_id: userId, quest_id: quest.id, progress: currentProgress, is_completed: isNowComplete, is_claimed: false });
                    }
                }
            }
        }

        return { xpGained: xp_to_add };
    },
    awardBadge: async (userId: string, badgeName: string) => {
        const communityId = await getCommunityId();
        const { data: badgeData, error: badgeError } = await supabase
            .from('badges').select('id').eq('name', badgeName).eq('community_id', communityId).single();
        if (badgeError || !badgeData) return console.error(`Badge "${badgeName}" not found.`);
        
        const { error: insertError } = await supabase.from('user_badges')
            .insert({ user_id: userId, badge_id: badgeData.id, community_id: communityId });
        
        if (insertError) {
            console.error(`Error awarding badge: ${insertError.message}`);
            return insertError;
        }
        return null;
    },
    createReward: async (actionType: string, xp: number) => {
        const communityId = await getCommunityId();
        const { error } = await supabase.from('reward_actions').insert({
            community_id: communityId, action_type: actionType, xp_gained: xp
        });
        if (error) console.error(`Error creating reward "${actionType}":`, error.message);
    },
updateReward: async (actionType: string, data: { xpGained?: number, isActive?: boolean }) => {
        const updates: any = {};
        if (data.xpGained !== undefined) updates.xp_gained = data.xpGained;
        
        if (data.isActive !== undefined) updates.is_active = data.isActive;

        const { error } = await supabase.from('reward_actions').update(updates).eq('action_type', actionType);
        if (error) console.error(`Error updating reward "${actionType}":`, error.message);
    },
    deleteReward: async (actionType: string, isArchive: boolean) => {
        if (isArchive) {
            const { error } = await supabase.from('reward_actions').update({ is_archived: true }).eq('action_type', actionType);
            return error ? { success: false, message: error.message } : { success: true, message: "Archived." };
        }
        const { error } = await supabase.from('reward_actions').delete().eq('action_type', actionType);
        return error ? { success: false, message: error.message } : { success: true, message: "Deleted." };
    },
    restoreReward: async(actionType: string) => {
        const { error } = await supabase.from('reward_actions').update({ is_archived: false }).eq('action_type', actionType);
        return error ? { success: false, message: error.message } : { success: true, message: "Restored." };
    },
    createBadge: async (name: string, config: BadgeConfig) => {
        const communityId = await getCommunityId();
        const { error } = await supabase.from('badges').insert({
            community_id: communityId,
            name,
            description: config.description,
            icon: config.icon,
            color: config.color,
        });
        if (error) return error;
        return null;
    },
    updateBadge: async (name: string, config: BadgeConfig & { isActive?: boolean }) => {
        const communityId = await getCommunityId();
        const updates: any = {
            description: config.description,
            icon: config.icon,
            color: config.color,
        };
        if (config.isActive !== undefined) updates.is_archived = !config.isActive;

        const { error } = await supabase.from('badges').update(updates).eq('name', name).eq('community_id', communityId);
        if (error) console.error(`Error updating badge "${name}":`, error.message);
    },
    deleteBadge: async (name: string, isArchive: boolean) => {
        const communityId = await getCommunityId();
        const { data: badge } = await supabase.from('badges').select('id').eq('name', name).eq('community_id', communityId).single();
        if (!badge) return { success: false, message: "Badge not found." };

        if (isArchive) {
            const { error } = await supabase.from('badges').update({ is_archived: true }).eq('id', badge.id);
            return error ? { success: false, message: error.message } : { success: true, message: "Archived." };
        }
        const { error } = await supabase.from('badges').delete().eq('id', badge.id);
        return error ? { success: false, message: error.message } : { success: true, message: "Deleted." };
    },
    restoreBadge: async(name: string) => {
        const { error } = await supabase.from('badges').update({ is_archived: false }).eq('name', name);
        return error ? { success: false, message: error.message } : { success: true, message: "Restored." };
    },
    createQuest: async (questData: Omit<Quest, 'id' | 'isActive' | 'isArchived'>): Promise<boolean> => {
        const communityId = await getCommunityId();
        let badgeId = questData.badgeRewardId;
        
        if (!badgeId && questData.badgeReward) {
             const { data: badge } = await supabase.from('badges').select('id').eq('name', questData.badgeReward).eq('community_id', communityId).single();
             if (badge) badgeId = badge.id;
        }

        const { data: newQuest, error: questError } = await supabase.from('quests').insert({
            community_id: communityId,
            title: questData.title,
            description: questData.description,
            xp_reward: questData.xpReward,
            badge_reward_id: badgeId,
            is_active: true, 
        }).select().single();

        if (questError || !newQuest) {
            console.error("Error creating quest:", questError?.message);
            return false;
        }

        const tasksToInsert = (questData.tasks ?? []).map(task => ({
            quest_id: newQuest.id,
            action_type: task.actionType,
            target_count: task.targetCount,
            description: task.description,
        }));

        const { error: tasksError } = await supabase.from('quest_tasks').insert(tasksToInsert);
        if (tasksError) {
            console.error("Error creating quest tasks:", tasksError.message);
            await supabase.from('quests').delete().eq('id', newQuest.id);
            return false;
        }
        return true;
    },
    updateQuest: async (questId: string, questData: Omit<Quest, 'id' | 'isActive'>): Promise<boolean> => {
        let badgeId = questData.badgeRewardId;
        if (!badgeId && questData.badgeReward) {
             const communityId = await getCommunityId();
             const { data: badge } = await supabase.from('badges').select('id').eq('name', questData.badgeReward).eq('community_id', communityId).single();
             if (badge) badgeId = badge.id;
        }

        const { error: questError } = await supabase.from('quests').update({
            title: questData.title,
            description: questData.description,
            xp_reward: questData.xpReward,
            badge_reward_id: badgeId,
        }).eq('id', questId);
        if (questError) return false;

        await supabase.from('quest_tasks').delete().eq('quest_id', questId);
        const tasksToInsert = (questData.tasks ?? []).map(task => ({
            quest_id: questId,
            action_type: task.actionType,
            target_count: task.targetCount,
            description: task.description,
        }));
        await supabase.from('quest_tasks').insert(tasksToInsert);
        return true;
    },
    deleteQuest: async (questId: string): Promise<{success: boolean; message: string}> => {
        const { error } = await supabase.from('quests').update({ is_archived: true, is_active: false }).eq('id', questId);
        return error ? { success: false, message: error.message } : { success: true, message: "Archived." };
    },
    restoreQuest: async (questId: string): Promise<{success: boolean; message: string}> => {
        const { error } = await supabase.from('quests').update({ is_archived: false }).eq('id', questId);
        return error ? { success: false, message: error.message } : { success: true, message: "Restored." };
    },
    updateQuestActiveStatus: async (questId: string, isActive: boolean) => {
        await supabase.from('quests').update({ is_active: isActive }).eq('id', questId);
    },
    createStoreItem: async (itemData: Omit<StoreItem, 'id'>): Promise<boolean> => {
        const communityId = await getCommunityId();
        const { error } = await supabase.from('store_items').insert({
            community_id: communityId,
            name: itemData.name,
            description: itemData.description,
            cost_xp: itemData.cost,
            icon: itemData.icon,
            is_available: itemData.isActive,
            item_type: itemData.itemType,
            duration_hours: itemData.durationHours,
            modifier: itemData.modifier,
        });
        if (error) {
            console.error('Error creating store item:', error.message);
            return false;
        }
        return true;
    },
    updateStoreItem: async (itemId: string, itemData: Omit<StoreItem, 'id'>): Promise<boolean> => {
        const { error } = await supabase.from('store_items').update({
            name: itemData.name,
            description: itemData.description,
            cost_xp: itemData.cost,
            icon: itemData.icon,
            is_available: itemData.isActive,
            item_type: itemData.itemType,
            duration_hours: itemData.durationHours,
            modifier: itemData.modifier,
        }).eq('id', itemId);
         if (error) return false;
        return true;
    },
    deleteStoreItem: async (itemId: string): Promise<{success: boolean; message: string;}> => {
        const { error } = await supabase.from('store_items').update({ is_archived: true, is_available: false }).eq('id', itemId);
        return error ? { success: false, message: error.message } : { success: true, message: 'Archived.' };
    },
    restoreStoreItem: async (itemId: string): Promise<{success: boolean; message: string}> => {
        const { error } = await supabase.from('store_items').update({ is_archived: false }).eq('id', itemId);
        return error ? { success: false, message: error.message } : { success: true, message: "Restored." };
    },
    updateStoreItemActiveStatus: async (itemId: string, isActive: boolean) => {
        await supabase.from('store_items').update({ is_available: isActive }).eq('id', itemId);
    },
    buyStoreItem: async (userId: string, itemId: string) => {
        const { data, error } = await supabase.rpc('buy_store_item', {
            p_user_id: userId,
            p_item_id: itemId,
        });
        if (error) return { success: false, message: "An error occurred during purchase." };
        return data as { success: boolean; message: string; };
    },
    claimQuestReward: async (progressId: number): Promise<{ success: boolean; message: string; }> => {
        try {
            const { data: updatedProgress, error: updateError } = await supabase
                .from('user_quest_progress')
                .update({ is_claimed: true })
                .eq('id', progressId)
                .eq('is_completed', true)
                .eq('is_claimed', false)
                .select()
                .single();

            if (updateError || !updatedProgress) {
                return { success: false, message: 'Reward already claimed or quest not complete.' };
            }

            const { user_id: userId, quest_id: questId } = updatedProgress;
            const { data: questData } = await supabase.from('quests').select('xp_reward, badge_reward_id, badges(name)').eq('id', questId).single();

            if (!questData) return { success: false, message: 'Quest data not found.' };

            let messages = [`+${questData.xp_reward} XP!`];
            await supabase.rpc('increment_user_xp', { p_user_id: userId, p_xp_to_add: questData.xp_reward });

            if (questData.badge_reward_id) {
                const communityId = await getCommunityId();
                const { error: badgeError } = await supabase.from('user_badges').insert({ user_id: userId, badge_id: questData.badge_reward_id, community_id: communityId });
                
                if (!badgeError && questData.badges) {
                    const badgeList = Array.isArray(questData.badges) ? questData.badges : [questData.badges];
                    const badgeName = badgeList[0]?.name;
                    if (badgeName) messages.push(`Badge unlocked: ${badgeName}!`);
                }
            }
            return { success: true, message: messages.join(' ') };
        } catch (error: any) {
            return { success: false, message: 'An unexpected error occurred.' };
        }
    },
    getAnalyticsData: async (dateRange: '7d' | '30d'): Promise<AnalyticsData | null> => {
        try {
            const communityId = await getCommunityId();
            if (!communityId) throw new Error("Community not found");
    
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
                supabase.from('profiles').select(PROFILE_COLUMNS).eq('community_id', communityId),
                supabase.from('actions_log').select('*').eq('community_id', communityId).gte('created_at', dateLimit30d),
                supabase.from('user_badges').select('badges!inner(name, icon, color)').eq('community_id', communityId),
                supabase.from('quests').select('*').eq('community_id', communityId),
                supabase.from('user_quest_progress').select('*'),
                supabase.from('user_inventory').select('store_items!inner(name, cost_xp)').eq('community_id', communityId),
            ]);
            
            const allProfiles = profilesResult.data || [];
            const allActions = (actionsResult.data || []).map(actionFromSupabase);
            const allUserBadges = userBadgesResult.data || [];
            const allQuests = questsResult.data || [];
            const allUserPurchases = userPurchasesResult.data || [];
            const allUserQuestProgress = userQuestProgressResult.data || [];
    
            const totalUsers = allProfiles.length;
            if (totalUsers === 0) return null;
    
            const activeMembers7d = allProfiles.filter((p: any) => p.last_action_date && new Date(p.last_action_date).toISOString() >= dateLimit7d).length;
            const activeMembers30d = allProfiles.filter((p: any) => p.last_action_date && new Date(p.last_action_date).toISOString() >= dateLimit30d).length;
            
            const actionsToday = allActions.filter(a => a.createdAt && a.createdAt >= todayStart);
            const xpEarnedToday = actionsToday.reduce((sum: number, a) => sum + a.xpGained, 0);
    
            const newMembers7d = 0; 
            const churnedMembers14d = allProfiles.filter(p => !p.last_action_date || new Date(p.last_action_date).toISOString() < dateLimit14d).length;
    
            const minimalUser = (p: any): User => ({
                id: p.id, username: p.username, avatarUrl: p.avatar_url, xp: p.xp, streak: p.streak,
                communityId: p.community_id, streakFreezes: p.streak_freezes, last_action_date: p.last_action_date, badges: [], role: p.role,
                level: 0
            });
            const topPerformers = {
                byXp: [...allProfiles].sort((a: any, b: any) => (Number(b.xp) || 0) - (Number(a.xp) || 0)).slice(0, 10).map(minimalUser),
                byStreak: [...allProfiles].sort((a: any, b: any) => (Number(b.streak) || 0) - (Number(a.streak) || 0)).slice(0, 10).map(minimalUser),
            };
    
            const actionCounts: Record<string, number> = {};
            for (const action of allActions) actionCounts[action.actionType] = (actionCounts[action.actionType] || 0) + 1;
            
            const activityBreakdown = Object.entries(actionCounts).map(([actionType, count]) => ({
                    label: actionType.replace(/_/g, ' '), value: count,
            }));
            
            const totalStreaks = allProfiles.reduce((sum: number, p: any) => sum + (Number(p.streak) || 0), 0);
            const membersWithActiveStreak = allProfiles.filter(p => p.streak > 0).length;
            const streakHealth = {
                avgStreakLength: membersWithActiveStreak > 0 ? Math.round(totalStreaks / membersWithActiveStreak) : 0,
                percentWithActiveStreak: Math.round((membersWithActiveStreak / totalUsers) * 100),
            };

            const xpByAction: Record<string, number> = {};
            for (const action of allActions) {
                const type = action.actionType.replace(/_/g, ' ');
                xpByAction[type] = (xpByAction[type] || 0) + action.xpGained;
            }
            const topXpActions = Object.entries(xpByAction).sort((a, b) => b[1] - a[1]).slice(0, 5)
             .map(([actionType, totalXp]) => ({ actionType: actionType as ActionType, totalXp }));
            
            const badgeCounts: Record<string, { name: string; icon: string; color: string; count: number }> = {};
            for (const userBadge of allUserBadges as any[]) {
                const badge = userBadge.badges;
                if(badge && badge.name) {
                    if (!badgeCounts[badge.name]) badgeCounts[badge.name] = { name: badge.name, icon: badge.icon, color: badge.color, count: 0 };
                    badgeCounts[badge.name].count += 1;
                }
            }
            const topBadges = Object.values(badgeCounts).sort((a,b) => b.count - a.count).slice(0, 6);

            const questAnalytics: any = allQuests.map(quest => {
                const participants = allUserQuestProgress.filter(p => p.quest_id === quest.id);
                const completers = participants.filter(p => p.is_completed);
                return {
                    questId: quest.id,
                    title: quest.title,
                    participationRate: totalUsers > 0 ? (participants.length / totalUsers) * 100 : 0,
                    completionRate: participants.length > 0 ? (completers.length / participants.length) * 100 : 0,
                };
            }).sort((a,b) => b.participationRate - a.participationRate);
            
            const itemsCounter: Record<string, number> = {};
            for (const p of allUserPurchases as any[]) {
                if (p.store_items?.name) itemsCounter[p.store_items.name] = (itemsCounter[p.store_items.name] || 0) + 1;
            }

            const totalItems = Object.values(itemsCounter).reduce((sum, c) => sum + c, 0);
            const xpSpent = allUserPurchases.reduce((sum: number, p: any) => sum + (Number(p.store_items.cost_xp) || 0), 0);
            const mostPopularItem = Object.entries(itemsCounter).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "None";

            return {
                engagement: { activeMembers7d, activeMembers30d, avgDailyActions: actionsToday.length, xpEarnedToday },
                growth: { newMembers7d, churnedMembers14d },
                topPerformers, activityBreakdown, streakHealth, topXpActions, topBadges, questAnalytics,
                storeAnalytics: { totalItems, xpSpent, mostPopularItem, totalSpent: xpSpent, items: Object.entries(itemsCounter).map(([name, count]) => ({ name, count })) },
            };

        } catch (error: any) {
            console.error("Error fetching analytics data:", error.message);
            return null;
        }
    },
    updateUserProfile: async (updates: { avatarUrl?: string }, userId?: string) => {
        let targetId = userId;
        if (!targetId) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) targetId = user.id;
        }
        if (!targetId) return false;

        const { error } = await supabase.from('profiles').update({ avatar_url: updates.avatarUrl }).eq('id', targetId);
        if (error) return false;
        return true;
    },
    uploadAvatar: async (file: File) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        
        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/${Math.random()}.${fileExt}`;
        
        const { error } = await supabase.storage.from('avatars').upload(filePath, file);
        if (error) return null;
        return filePath;
    },
    getUserInventory: async (userId: string): Promise<UserInventoryItem[]> => {
        const { data, error } = await supabase.from('user_inventory').select('*, store_items(*)').eq('user_id', userId).order('purchased_at', { ascending: true });
        if(error) return [];
        return data.map(inventoryItemFromSupabase);
    },
    getActiveEffects: async (userId: string): Promise<ActiveEffect[]> => {
        const { data, error } = await supabase.from('user_active_effects').select('*').eq('user_id', userId).gt('expires_at', new Date().toISOString());
        if(error) return [];
        return data.map(activeEffectFromSupabase);
    },
    activateInventoryItem: async (inventoryId: string): Promise<{ success: boolean; message: string; }> => {
        const { data, error } = await supabase.rpc('activate_inventory_item', { p_inventory_id: inventoryId });
        if (error) return { success: false, message: "An error occurred." };
        return data;
    },
    adminUpdateUserStats: async (userId: string, xp: number, streak: number, freezes: number) => {
        const { error } = await supabase.from('profiles').update({ xp, streak, streak_freezes: freezes }).eq('id', userId);
        return error ? { success: false, message: error.message } : { success: true, message: "User stats updated." };
    },
    adminUpdateUserRole: async (userId: string, role: 'admin' | 'member') => {
        const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
        return error ? { success: false, message: error.message } : { success: true, message: "User role updated." };
    },
    adminBanUser: async (userId: string, durationHours: number | null) => {
        let banned_until: string | null = null;
        if (durationHours === 0) banned_until = new Date().toISOString();
        else if (durationHours) {
            const date = new Date();
            date.setHours(date.getHours() + durationHours);
            banned_until = date.toISOString();
        }
        const { error } = await supabase.from('profiles').update({ banned_until }).eq('id', userId);
        return error ? { success: false, message: error.message } : { success: true, message: "User ban status updated." };
    },
    adminGetUserEmail: async (userId: string) => {
        return null; 
    },
    getAllUserActions: async (userId: string): Promise<Action[]> => {
         const { data, error } = await supabase.from('actions_log').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        if (error) return [];
        return data.map(actionFromSupabase);
    },
    adminUpdateCommunityTier: async (tier: 'Core' | 'Pro' | 'Elite') => {
        const communityId = await getCommunityId();
        const { error } = await supabase.from('communities').update({ subscription_tier: tier }).eq('id', communityId);
        if(error) return false;
        return true;
    },
    signInWithPassword: (credentials: any) => supabase.auth.signInWithPassword(credentials),
    signUpNewUser: (credentials: any) => supabase.auth.signUp({
        email: credentials.email, password: credentials.password,
        options: { data: { username: credentials.username, avatar_url: credentials.avatarUrl } }
    }),
    signOut: () => supabase.auth.signOut(),
    sendPasswordResetEmail: (email: string) => supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin }),
    triggerWebhook: async (userId: string, actionType: string) => {
         return api.recordAction(userId, actionType, 'whop').then(result =>
            result ? `Webhook simulated for ${actionType}. Gained ${result.xpGained} XP.` : "Webhook simulation failed."
         );
    },
};