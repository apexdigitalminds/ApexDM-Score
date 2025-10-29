import { supabase } from './supabase';
import type { User, Action, Badge, RewardsConfig, BadgeConfig, Community, Quest, UserQuestProgress, QuestTask, AnalyticsData, StoreItem, UserInventoryItem, ActiveEffect } from '../types';

// MOCK WHOP/COMMUNITY DATA (for simulation)
const MOCK_WHOP_MEMBERS = [
    { whop_user_id: 'whop_alex_123', username: 'Alex' },
    { whop_user_id: 'whop_zara_789', username: 'Zara' },
    { whop_user_id: 'whop_leo_101', username: 'Leo' },
];

export interface SignInCredentials {
    email: string;
    password: string;
}

export interface SignUpCredentials extends SignInCredentials {
    username: string;
    avatarUrl: string;
}

// --- DATA TRANSFORMATION HELPERS ---
const profileFromSupabase = (data: any): User => {
    const badges: Badge[] = (data.user_badges || [])
        .map((join: any) => (join.badges ? badgeFromSupabase(join.badges) : null))
        .filter((b): b is Badge => b !== null);
    
    return {
        id: data.id,
        communityId: data.community_id,
        username: data.username,
        avatarUrl: data.avatar_url,
        xp: data.xp,
        streak: data.streak,
        streakFreezes: data.streak_freezes,
        lastActionDate: data.last_action_date,
        role: data.role,
        whop_user_id: data.whop_user_id,
        bannedUntil: data.banned_until,
        badges,
    };
};

const actionFromSupabase = (data: any): Action => ({
    id: data.id,
    userId: data.user_id,
    communityId: data.community_id,
    actionType: data.action_type,
    xpGained: data.xp_gained ?? 0,
    timestamp: data.created_at,
    source: data.source,
});

const badgeFromSupabase = (data: any): Badge => ({
    id: data.id,
    name: data.name,
    description: data.description,
    icon: data.icon,
    color: data.color,
});

const questFromSupabase = (data: any): Quest => ({
    id: data.id,
    title: data.title,
    description: data.description,
    tasks: (data.quest_tasks || []).map((task: any): QuestTask => ({
        actionType: task.action_type,
        targetCount: task.target_count,
        description: task.description,
    })),
    xpReward: data.xp_reward,
    badgeReward: data.badges ? data.badges.name : null,
    isActive: data.is_active,
});

const userQuestProgressFromSupabase = (data: any): UserQuestProgress => ({
    questId: data.quest_id,
    progress: data.progress,
    completed: data.is_completed,
    claimed: data.is_claimed,
});

const storeItemFromSupabase = (data: any): StoreItem => ({
    id: data.id,
    name: data.name,
    description: data.description,
    cost: data.cost_xp,
    icon: data.icon,
    isActive: data.is_available,
    itemType: data.item_type,
    durationHours: data.duration_hours,
    modifier: data.modifier,
});

const inventoryItemFromSupabase = (data: any): UserInventoryItem => ({
    id: data.id,
    userId: data.user_id,
    itemId: data.item_id,
    purchasedAt: data.purchased_at,
    itemDetails: data.store_items ? storeItemFromSupabase(data.store_items) : {} as StoreItem,
});

const activeEffectFromSupabase = (data: any): ActiveEffect => ({
    id: data.id,
    userId: data.user_id,
    effectType: data.effect_type,
    modifier: data.modifier,
    expiresAt: data.expires_at,
});


let COMMUNITY_ID: string | null = null;
const getCommunityId = async () => {
    if (COMMUNITY_ID) return COMMUNITY_ID;
    const { data, error } = await supabase.from('communities').select('id').limit(1).single();
    if (error || !data) {
        console.error("Could not fetch community ID", error.message);
        throw new Error("A community must be configured in the database.");
    }
    COMMUNITY_ID = data.id;
    return COMMUNITY_ID;
};

// FIX: Removed `created_at` because the column does not exist on the `profiles` table. This avoids query errors.
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
            .select('user_id, badges(id, name, description, icon, color)');
        
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
                    if (userBadge.badges) {
                         badgesByUserId.get(userBadge.user_id)!.push({ badges: userBadge.badges });
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
            .single();

        if (error || !data) {
            console.error(`Error fetching profile for user ${userId}:`, error?.message);
            return null;
        }
        
        const { data: userBadges, error: badgesError } = await supabase
            .from('user_badges')
            .select('badges(id, name, description, icon, color)')
            .eq('user_id', userId);

        if (badgesError) {
             console.error(`Error fetching badges for user ${userId}:`, badgesError.message);
        }

        const enrichedProfile = {
            ...data,
            user_badges: userBadges || [],
        };
        
        return profileFromSupabase(enrichedProfile);
    },
     getCurrentUserProfile: async (): Promise<User | null> => {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return null;
        }
        // Fetch profile data which lacks `created_at`.
        const profile = await api.getUserById(user.id);

        if (profile) {
            // Augment the profile with `created_at` from the auth user object.
            // This is a workaround because the `profiles` table is missing this column.
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
            .select('action_type, xp_gained');
        
        if (error) {
            console.error('Error fetching rewards config:', error.message);
            return {};
        }

        return data.reduce((acc, reward) => {
            acc[reward.action_type] = { xp: reward.xp_gained, badge: null };
            return acc;
        }, {} as RewardsConfig);
    },
    getBadgesConfig: async (): Promise<{ [key: string]: BadgeConfig }> => {
        const communityId = await getCommunityId();
        const { data, error } = await supabase
            .from('badges')
            .select('name, description, icon, color')
            .eq('community_id', communityId);

        if (error) {
            console.error('Error fetching badges config:', error.message);
            return {};
        }
        
        return data.reduce((acc, badge) => {
            acc[badge.name] = {
                description: badge.description,
                icon: badge.icon,
                color: badge.color
            };
            return acc;
        }, {} as { [key: string]: BadgeConfig });
    },
    getCommunityInfo: async (): Promise<Community | null> => {
        try {
            const id = await getCommunityId();
            const { data, error } = await supabase
                .from('communities')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error fetching community info:', error.message);
                return null;
            }

            return {
                id: data.id,
                name: data.name,
                logoUrl: data.logo_url,
                themeColor: data.theme_color,
                whop_store_id: data.whop_store_id,
                subscriptionTier: data.subscription_tier,
            };
        } catch (e) {
            console.error(e);
            return null;
        }
    },
     getQuests: async (): Promise<Quest[]> => {
        const { data, error } = await supabase
            .from('quests')
            .select('id, title, description, xp_reward, is_active, quest_tasks(*), badges!left(name)')
            .eq('is_active', true)
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
            .select('id, title, description, xp_reward, is_active, quest_tasks(*), badges!left(name)')
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
            .order('cost_xp', { ascending: true });

        if (error) {
            console.error('Error fetching store items:', error.message);
            return [];
        }
        return data.map(storeItemFromSupabase);
    },

    // WRITE operations
    recordAction: async (userId: string, actionType: string, source: 'manual' | 'whop' | 'discord') => {
        const { data: rewardData, error: rewardError } = await supabase
            .from('reward_actions').select('xp_gained').eq('action_type', actionType).single();

        if (rewardError || !rewardData) {
            console.error(`No reward configured for action: ${actionType}`);
            return null;
        }
        let xp_to_add = rewardData.xp_gained;

        // Check for active XP Boost effects
        const { data: activeEffects, error: effectsError } = await supabase
            .from('user_active_effects')
            .select('modifier')
            .eq('user_id', userId)
            .eq('effect_type', 'XP_BOOST')
            .gt('expires_at', new Date().toISOString());
        
        if (effectsError) console.error("Error checking for active effects:", effectsError.message);
        
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

        let new_streak = profile.streak;
        let freezes_used = 0;
        const today = new Date().toISOString().split('T')[0];
        const lastActionDate = profile.last_action_date;

        if (lastActionDate !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            if (lastActionDate === yesterdayStr) {
                new_streak += 1;
            } else if (lastActionDate < yesterdayStr && profile.streak_freezes > 0) {
                freezes_used = 1;
            } else {
                new_streak = 1;
            }
        }
        
        const { error: xpError } = await supabase.rpc('increment_user_xp', {
            p_user_id: userId, p_xp_to_add: xp_to_add
        });
        if (xpError) {
            console.error("Error incrementing user XP:", xpError.message);
            return null;
        }

        await supabase.from('profiles').update({
            streak: new_streak,
            last_action_date: today,
            streak_freezes: profile.streak_freezes - freezes_used
        }).eq('id', userId);
        
        const communityId = await getCommunityId();
        await supabase.from('actions_log').insert({
            user_id: userId, community_id: communityId, action_type: actionType,
            xp_gained: xp_to_add, source: source
        });

        // --- START QUEST PROGRESS UPDATE ---
        const { data: activeQuests, error: questsError } = await supabase
            .from('quests')
            .select('id, quest_tasks(*)')
            .eq('is_active', true);

        if (questsError) {
            console.error('Could not fetch quests for progress update:', questsError.message);
        } else if (activeQuests) {
            const { data: userProgress, error: progressError } = await supabase
                .from('user_quest_progress')
                .select('*')
                .eq('user_id', userId);

            if (progressError) {
                console.error('Could not fetch user progress:', progressError.message);
            } else {
                const progressMap = new Map(userProgress.map(p => [p.quest_id, p]));

                for (const quest of activeQuests) {
                    const hasRelevantTask = quest.quest_tasks.some(t => t.action_type === actionType);
                    const userQuestStatus: any = progressMap.get(quest.id);

                    if (hasRelevantTask && (!userQuestStatus || !userQuestStatus.is_completed)) {
                        let currentProgress = userQuestStatus ? userQuestStatus.progress || {} : {};
                        currentProgress[actionType] = (currentProgress[actionType] || 0) + 1;

                        const isNowComplete = quest.quest_tasks.every(task =>
                            (currentProgress[task.action_type] || 0) >= task.target_count
                        );

                        if (userQuestStatus) {
                            await supabase
                                .from('user_quest_progress')
                                .update({ progress: currentProgress, is_completed: isNowComplete })
                                .eq('id', userQuestStatus.id);
                        } else {
                            await supabase.from('user_quest_progress').insert({
                                user_id: userId,
                                quest_id: quest.id,
                                progress: currentProgress,
                                is_completed: isNowComplete,
                                is_claimed: false,
                            });
                        }
                    }
                }
            }
        }
        // --- END QUEST PROGRESS UPDATE ---

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
    updateReward: async (actionType: string, xp: number) => {
        const { error } = await supabase.from('reward_actions').update({ xp_gained: xp }).eq('action_type', actionType);
        if (error) console.error(`Error updating reward "${actionType}":`, error.message);
    },
    deleteReward: async (actionType: string) => {
        const { count: logCount, error: logCountError } = await supabase.from('actions_log').select('action_type', { count: 'exact' }).eq('action_type', actionType);
        if (logCountError) return { success: false, message: `Could not check reward usage: ${logCountError.message}` };
        if ((logCount ?? 0) > 0) {
            return { success: false, message: `Cannot delete: in use in ${logCount} log entries.` };
        }
    
        const { count: questTaskCount, error: questTaskError } = await supabase.from('quest_tasks').select('action_type', { count: 'exact' }).eq('action_type', actionType);
        if (questTaskError) return { success: false, message: `Could not check quest task usage: ${questTaskError.message}` };
        if ((questTaskCount ?? 0) > 0) {
            return { success: false, message: `Cannot delete: used in ${questTaskCount} quest task(s).` };
        }
    
        const { error } = await supabase.from('reward_actions').delete().eq('action_type', actionType);
        if (error) {
            return { success: false, message: `Failed to delete reward: ${error.message}` };
        }
        return { success: true, message: `Reward "${actionType}" deleted.` };
    },
    createBadge: async (name: string, config: BadgeConfig) => {
        const communityId = await getCommunityId();
        const { error } = await supabase.from('badges').insert({ community_id: communityId, name, ...config });
        if (error) {
            console.error(`Error creating badge "${name}":`, error.message);
            return error;
        }
        return null;
    },
    updateBadge: async (name: string, config: BadgeConfig) => {
        const communityId = await getCommunityId();
        const { error } = await supabase.from('badges').update(config).eq('name', name).eq('community_id', communityId);
        if (error) console.error(`Error updating badge "${name}":`, error.message);
    },
    deleteBadge: async (name: string) => {
        const communityId = await getCommunityId();
        const { data: badge, error: badgeError } = await supabase.from('badges').select('id').eq('name', name).eq('community_id', communityId).single();
        if (badgeError || !badge) return { success: false, message: "Badge not found or permission denied." };
    
        const { count, error: countError } = await supabase.from('user_badges').select('badge_id', { count: 'exact' }).eq('badge_id', badge.id);
        if (countError) return { success: false, message: `Could not check badge usage: ${countError.message}` };
        if ((count ?? 0) > 0) {
            return { success: false, message: `Cannot delete: awarded ${count} times.` };
        }
        
        const { count: questCount, error: questCountError } = await supabase.from('quests').select('badge_reward_id', { count: 'exact' }).eq('badge_reward_id', badge.id);
        if (questCountError) return { success: false, message: `Could not check quest usage: ${questCountError.message}` };
        if ((questCount ?? 0) > 0) {
            return { success: false, message: `Cannot delete: used as a reward in ${questCount} quest(s).` };
        }
    
        const { error: deleteError } = await supabase.from('badges').delete().eq('id', badge.id);
        if (deleteError) {
            return { success: false, message: `Failed to delete badge: ${deleteError.message}` };
        }
        return { success: true, message: `Badge "${name}" deleted.` };
    },
    
    signInWithPassword: (credentials: SignInCredentials) => supabase.auth.signInWithPassword(credentials),
    signUpNewUser: (credentials: SignUpCredentials) => supabase.auth.signUp({
        email: credentials.email, password: credentials.password,
        options: { data: { username: credentials.username, avatar_url: credentials.avatarUrl } }
    }),
    signOut: () => supabase.auth.signOut(),
    sendPasswordResetEmail: (email: string) => supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
    }),
    
    syncWhopMembers: async () => {
        console.warn("syncWhopMembers functionality is disabled. Required database function is missing.");
        return "Sync failed: Not implemented.";
    },
    triggerWebhook: async (userId: string, actionType: string) => {
         return api.recordAction(userId, actionType, 'whop').then(result =>
            result ? `Webhook simulated for ${actionType}. Gained ${result.xpGained} XP.` : "Webhook simulation failed."
         );
    },
    createQuest: async (questData: Omit<Quest, 'id' | 'isActive'>): Promise<boolean> => {
        const communityId = await getCommunityId();
        
        let badgeId: string | null = null;
        if (questData.badgeReward) {
            const { data: badgeData, error: badgeError } = await supabase
                .from('badges')
                .select('id')
                .eq('name', questData.badgeReward)
                .eq('community_id', communityId)
                .single();

            if (badgeError || !badgeData) {
                console.error(`Could not find badge with name: ${questData.badgeReward}`, badgeError?.message);
                return false;
            }
            badgeId = badgeData.id;
        }

        const { data: newQuest, error: questError } = await supabase.from('quests').insert({
            community_id: communityId,
            title: questData.title,
            description: questData.description,
            xp_reward: questData.xpReward,
            badge_reward_id: badgeId,
            is_active: false,
        }).select().single();

        if (questError || !newQuest) {
            console.error("Error creating quest:", questError?.message);
            return false;
        }

        const tasksToInsert = questData.tasks.map(task => ({
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
        let badgeId: string | null = null;
        if (questData.badgeReward) {
            const communityId = await getCommunityId();
            const { data: badgeData, error: badgeError } = await supabase
                .from('badges')
                .select('id')
                .eq('name', questData.badgeReward)
                .eq('community_id', communityId)
                .single();

            if (badgeError) {
                console.error(`Could not find badge with name: ${questData.badgeReward}`, badgeError.message);
                return false;
            }
            badgeId = badgeData ? badgeData.id : null;
        }

        const { error: questError } = await supabase.from('quests').update({
            title: questData.title,
            description: questData.description,
            xp_reward: questData.xpReward,
            badge_reward_id: badgeId,
        }).eq('id', questId);
        if (questError) {
            console.error("Error updating quest:", questError.message);
            return false;
        }

        const { error: deleteError } = await supabase.from('quest_tasks').delete().eq('quest_id', questId);
        if (deleteError) {
            console.error("Error clearing old tasks for update:", deleteError.message);
            return false;
        }

        const tasksToInsert = questData.tasks.map(task => ({
            quest_id: questId,
            action_type: task.actionType,
            target_count: task.targetCount,
            description: task.description,
        }));
        
        const { error: insertError } = await supabase.from('quest_tasks').insert(tasksToInsert);
        if (insertError) {
            console.error("Error inserting updated tasks:", insertError.message);
            return false;
        }

        return true;
    },
    deleteQuest: async (questId: string): Promise<boolean> => {
        const { error } = await supabase.from('quests').delete().eq('id', questId);
        if (error) {
            console.error("Error deleting quest:", error.message);
            return false;
        }
        return true;
    },
    updateQuestActiveStatus: async (questId: string, isActive: boolean) => {
        const { error } = await supabase.from('quests').update({ is_active: isActive }).eq('id', questId);
        if (error) console.error("Error updating quest active status:", error.message);
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
         if (error) {
            console.error('Error updating store item:', error.message);
            return false;
        }
        return true;
    },
    deleteStoreItem: async (itemId: string): Promise<{success: boolean; message: string;}> => {
        const { count, error: countError } = await supabase.from('user_inventory').select('item_id', { count: 'exact' }).eq('item_id', itemId);
        if(countError) return { success: false, message: `Could not check item purchases: ${countError.message}` };
        if ((count ?? 0) > 0) {
             return { success: false, message: `Cannot delete: purchased ${count} times.` };
        }
        const { error } = await supabase.from('store_items').delete().eq('id', itemId);
        if (error) {
            return { success: false, message: `Failed to delete item: ${error.message}` };
        }
        return { success: true, message: 'Store item deleted.' };
    },
    updateStoreItemActiveStatus: async (itemId: string, isActive: boolean) => {
        const { error } = await supabase.from('store_items').update({ is_available: isActive }).eq('id', itemId);
        if (error) console.error('Error updating store item status:', error.message);
    },
    buyStoreItem: async (userId: string, itemId: string) => {
        const { data, error } = await supabase.rpc('buy_store_item', {
            p_user_id: userId,
            p_item_id: itemId,
        });

        if (error) {
            console.error("Error purchasing item:", error.message);
            return { success: false, message: "An error occurred during purchase." };
        }
        
        return data as { success: boolean; message: string; };
    },

    claimQuestReward: async (userId: string, questId: string): Promise<{ success: boolean; message: string; }> => {
        const { data, error } = await supabase.rpc('claim_quest_reward', {
            p_user_id: userId,
            p_quest_id: questId
        });

        if (error) {
            console.error("Error claiming quest reward:", error.message);
            return { success: false, message: "Error claiming quest reward." };
        }

        return data as { success: boolean; message: string; };
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
            
            const relevantDateLimit = dateRange === '7d' ? dateLimit7d : dateLimit30d;
    
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
            
            if (profilesResult.error) throw profilesResult.error;
            if (actionsResult.error) throw actionsResult.error;
            if (userBadgesResult.error) throw userBadgesResult.error;
            if (questsResult.error) throw questsResult.error;
            if (userQuestProgressResult.error) throw userQuestProgressResult.error;
            if (userPurchasesResult.error) throw userPurchasesResult.error;
    
            const allProfiles = profilesResult.data;
            const allActions = actionsResult.data.map(actionFromSupabase);
            const allUserBadges = userBadgesResult.data;
            const allQuests = questsResult.data;
            const allUserPurchases = userPurchasesResult.data;

            const communityUserIds = new Set(allProfiles.map(p => p.id));
            const allUserQuestProgress = userQuestProgressResult.data.filter(p => communityUserIds.has(p.user_id));
    
            const totalUsers = allProfiles.length;
            if (totalUsers === 0) return null;
    
            const activeMembers7d = allProfiles.filter(p => p.last_action_date && new Date(p.last_action_date) >= new Date(dateLimit7d)).length;
            const activeMembers30d = allProfiles.filter(p => p.last_action_date && new Date(p.last_action_date) >= new Date(dateLimit30d)).length;
            const actionsToday = allActions.filter(a => new Date(a.timestamp) >= new Date(todayStart));
            const xpEarnedToday = actionsToday.reduce((sum: number, a) => sum + a.xpGained, 0);
    
            // FIX: Cannot calculate new members as `created_at` is not available on the `profiles` table.
            const newMembers7d = 0;
            const churnedMembers14d = allProfiles.filter(p => !p.last_action_date || new Date(p.last_action_date) < new Date(dateLimit14d)).length;
    
            const minimalUser = (p: any): User => ({
                id: p.id, username: p.username, avatarUrl: p.avatar_url, xp: p.xp, streak: p.streak,
                communityId: p.community_id, streakFreezes: p.streak_freezes, lastActionDate: p.last_action_date, badges: [], role: p.role
            });
            const topPerformers = {
                // FIX: Ensure sort operations are performed on numbers to prevent type errors.
                byXp: [...allProfiles].sort((a,b) => (Number(b.xp) || 0) - (Number(a.xp) || 0)).slice(0, 10).map(minimalUser),
                byStreak: [...allProfiles].sort((a,b) => (Number(b.streak) || 0) - (Number(a.streak) || 0)).slice(0, 10).map(minimalUser),
            };
    
            // FIX: Replaced reduce with a for loop for more reliable type inference.
            const actionCounts: Record<string, number> = {};
            for (const action of allActions) {
                actionCounts[action.actionType] = (actionCounts[action.actionType] || 0) + 1;
            }
            const activityBreakdown = Object.entries(actionCounts).map(([actionType, count], i) => ({
                actionType: actionType.replace(/_/g, ' '),
                count,
                color: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'][i % 6],
            }));
            
            // FIX: Ensure arithmetic operations are on numbers by casting and providing a fallback.
            const totalStreaks = allProfiles.reduce((sum: number, p: any) => sum + (Number(p.streak) || 0), 0);
            const membersWithActiveStreak = allProfiles.filter(p => p.streak > 0).length;
            const streakHealth = {
                avgStreakLength: membersWithActiveStreak > 0 ? Math.round(totalStreaks / membersWithActiveStreak) : 0,
                percentWithActiveStreak: Math.round((membersWithActiveStreak / totalUsers) * 100),
            };

            // FIX: Replaced reduce with a for loop for more reliable type inference.
            const xpByAction: Record<string, number> = {};
            for (const action of allActions) {
                const type = action.actionType.replace(/_/g, ' ');
                xpByAction[type] = (xpByAction[type] || 0) + action.xpGained;
            }
            const topXpActions = Object.entries(xpByAction).sort((a,b) => b[1] - a[1]).slice(0, 5).map(([actionType, totalXp]) => ({actionType, totalXp}));
            
            const badgeCounts: Record<string, { name: string; icon: string; color: string; count: number }> = {};
            for (const userBadge of allUserBadges as any[]) {
                const badge = userBadge.badges;
                if(badge && badge.name) {
                    if (!badgeCounts[badge.name]) {
                        badgeCounts[badge.name] = { name: badge.name, icon: badge.icon, color: badge.color, count: 0 };
                    }
                    badgeCounts[badge.name].count += 1;
                }
            }
            const topBadges = Object.values(badgeCounts).sort((a,b) => b.count - a.count).slice(0, 6);

            const questAnalytics = allQuests.map(quest => {
                const participants = allUserQuestProgress.filter(p => p.quest_id === quest.id);
                const completers = participants.filter(p => p.is_completed);
                return {
                    questId: quest.id,
                    title: quest.title,
                    participationRate: totalUsers > 0 ? (participants.length / totalUsers) * 100 : 0,
                    completionRate: participants.length > 0 ? (completers.length / participants.length) * 100 : 0,
                };
            }).sort((a,b) => b.participationRate - a.completionRate);
            
            const itemsCounter: Record<string, number> = {};
            for (const p of allUserPurchases as any[]) {
                const name = p.store_items?.name;
                if (name) {
                    itemsCounter[name] = (itemsCounter[name] || 0) + 1;
                }
            }

            const storeAnalytics = {
                // FIX: Ensure arithmetic operations are on numbers by casting and providing a fallback.
                totalSpent: allUserPurchases.reduce((sum: number, p: any) => sum + (Number(p.store_items.cost_xp) || 0), 0),
                // FIX: Replaced reduce with for loop and moved logic outside the object definition.
                items: Object.entries(itemsCounter).map(([name, count]) => ({name, count})).sort((a,b) => b.count - a.count),
            };

            return {
                engagement: { activeMembers7d, activeMembers30d, avgDailyActions: actionsToday.length, xpEarnedToday },
                growth: { newMembers7d, churnedMembers14d },
                topPerformers,
                activityBreakdown,
                streakHealth,
                topXpActions,
                topBadges,
                questAnalytics,
                storeAnalytics,
            };
        } catch (error: any) {
            console.error("Error fetching analytics data:", error.message);
            return null;
        }
    },
    updateUserProfile: async (updates: { avatarUrl?: string }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { error } = await supabase.from('profiles').update({ avatar_url: updates.avatarUrl }).eq('id', user.id);
        if (error) {
            console.error('Error updating profile:', error.message);
            return false;
        }
        return true;
    },
    uploadAvatar: async (file: File) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        
        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/${Math.random()}.${fileExt}`;
        
        const { error } = await supabase.storage.from('avatars').upload(filePath, file);
        if (error) {
            console.error('Error uploading avatar:', error.message);
            return null;
        }
        
        return filePath;
    },
    getUserInventory: async (userId: string): Promise<UserInventoryItem[]> => {
        const { data, error } = await supabase
            .from('user_inventory')
            .select('*, store_items(*)')
            .eq('user_id', userId)
            .order('purchased_at', { ascending: true });
        if(error) {
            console.error("Error fetching user inventory:", error.message);
            return [];
        }
        return data.map(inventoryItemFromSupabase);
    },
    getActiveEffects: async (userId: string): Promise<ActiveEffect[]> => {
        const { data, error } = await supabase
            .from('user_active_effects')
            .select('*')
            .eq('user_id', userId)
            .gt('expires_at', new Date().toISOString());
        if(error) {
            console.error("Error fetching active effects:", error.message);
            return [];
        }
        return data.map(activeEffectFromSupabase);
    },
    activateInventoryItem: async (inventoryId: string): Promise<{ success: boolean; message: string; }> => {
        const { data, error } = await supabase.rpc('activate_inventory_item', {
            p_inventory_id: inventoryId
        });
        if (error) {
            console.error("Error activating item:", error.message);
            return { success: false, message: "An error occurred." };
        }
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
        if (durationHours === 0) {
            banned_until = new Date().toISOString();
        } else if (durationHours) {
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
         const { data, error } = await supabase
            .from('actions_log')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) {
            console.error("Error getting all user actions:", error.message);
            return [];
        }
        return data.map(actionFromSupabase);
    },
    adminUpdateCommunityTier: async (tier: 'starter' | 'core' | 'pro') => {
        const communityId = await getCommunityId();
        const { error } = await supabase.from('communities').update({ subscription_tier: tier }).eq('id', communityId);
        if(error) {
            console.error("Error updating tier:", error.message);
            return false;
        }
        return true;
    }
};