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
    // FIX: Ensure xpGained is always a number to prevent type errors in arithmetic operations.
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
    badgeReward: data.badge_reward,
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
        return await api.getUserById(user.id);
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
            .select('*, quest_tasks(*)')
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
            .select('*, quest_tasks(*)')
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
            // Apply the first found modifier (assuming only one boost can be active)
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
            // Return specific error codes to be handled by the UI
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
        // Check 1: Is the reward used in any action logs?
        const { count: logCount, error: logCountError } = await supabase.from('actions_log').select('action_type', { count: 'exact' }).eq('action_type', actionType);
        if (logCountError) return { success: false, message: `Could not check reward usage: ${logCountError.message}` };
        if ((logCount ?? 0) > 0) {
            return { success: false, message: `Cannot delete: in use in ${logCount} log entries.` };
        }
    
        // Check 2: Is the reward used in any quest tasks?
        const { count: questTaskCount, error: questTaskError } = await supabase.from('quest_tasks').select('action_type', { count: 'exact' }).eq('action_type', actionType);
        if (questTaskError) return { success: false, message: `Could not check quest task usage: ${questTaskError.message}` };
        if ((questTaskCount ?? 0) > 0) {
            return { success: false, message: `Cannot delete: used in ${questTaskCount} quest task(s).` };
        }
    
        // If all checks pass, proceed with deletion
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
        // Step 1: Find the badge to get its ID
        const { data: badge, error: badgeError } = await supabase.from('badges').select('id').eq('name', name).eq('community_id', communityId).single();
        if (badgeError || !badge) return { success: false, message: "Badge not found or permission denied." };
    
        // Check 1: Has the badge been awarded to any user?
        const { count, error: countError } = await supabase.from('user_badges').select('badge_id', { count: 'exact' }).eq('badge_id', badge.id);
        if (countError) return { success: false, message: `Could not check badge usage: ${countError.message}` };
        if ((count ?? 0) > 0) {
            return { success: false, message: `Cannot delete: awarded ${count} times.` };
        }
        
        // Check 2: Is the badge used as a reward in any quests? (checks by name)
        const { count: questCount, error: questCountError } = await supabase.from('quests').select('badge_reward', { count: 'exact' }).eq('badge_reward', name);
        if (questCountError) return { success: false, message: `Could not check quest usage: ${questCountError.message}` };
        if ((questCount ?? 0) > 0) {
            return { success: false, message: `Cannot delete: used as a reward in ${questCount} quest(s).` };
        }
    
        // If all checks pass, proceed with deletion
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
        redirectTo: window.location.origin, // Redirect back to the app after reset
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
        const { data: newQuest, error: questError } = await supabase.from('quests').insert({
            community_id: communityId,
            title: questData.title,
            description: questData.description,
            xp_reward: questData.xpReward,
            badge_reward: questData.badgeReward || null, // Ensure null instead of empty string
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
            // Attempt to clean up the orphaned quest
            await supabase.from('quests').delete().eq('id', newQuest.id);
            return false;
        }
        return true;
    },
    updateQuest: async (questId: string, questData: Omit<Quest, 'id' | 'isActive'>): Promise<boolean> => {
        const { error: questError } = await supabase.from('quests').update({
            title: questData.title,
            description: questData.description,
            xp_reward: questData.xpReward,
            badge_reward: questData.badgeReward || null, // Ensure null instead of empty string
        }).eq('id', questId);
        if (questError) {
            console.error("Error updating quest:", questError.message);
            return false;
        }

        // Easiest way to update tasks is to delete and re-insert
        const { error: deleteError } = await supabase.from('quest_tasks').delete().eq('quest_id', questId);
        if (deleteError) {
            console.error("Error clearing old tasks for update:", deleteError.message);
            return false; // Don't proceed to insert new ones
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
        // Assuming cascade delete is set up in the database for quest_tasks and user_quest_progress
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
        const { count, error: countError } = await supabase.from('user_purchases').select('item_id', { count: 'exact' }).eq('item_id', itemId);
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
                supabase.from('profiles').select('*').eq('community_id', communityId),
                supabase.from('actions_log').select('*').eq('community_id', communityId).gte('created_at', dateLimit30d),
                supabase.from('user_badges').select('badges!inner(name, icon, color)').eq('community_id', communityId),
                supabase.from('quests').select('*').eq('community_id', communityId),
                supabase.from('user_quest_progress').select('*'),
                supabase.from('user_purchases').select('cost_xp, store_items!inner(name)').eq('community_id', communityId),
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
            // FIX: Explicitly type the accumulator as a number to prevent type errors in arithmetic operations.
            const xpEarnedToday = actionsToday.reduce((sum: number, a) => sum + a.xpGained, 0);
    
            const newMembers7d = allProfiles.filter(p => p.created_at && new Date(p.created_at) >= new Date(dateLimit7d)).length;
            const churnedMembers14d = allProfiles.filter(p => !p.last_action_date || new Date(p.last_action_date) < new Date(dateLimit14d)).length;
    
            const minimalUser = (p: any): User => ({
                id: p.id, username: p.username, avatarUrl: p.avatar_url, xp: p.xp, streak: p.streak,
                communityId: p.community_id, streakFreezes: p.streak_freezes, lastActionDate: p.last_action_date, badges: [], role: p.role
            });
    
            const topPerformers = {
                byXp: [...allProfiles].sort((a, b) => b.xp - a.xp).slice(0, 10).map(minimalUser),
                byStreak: [...allProfiles].sort((a, b) => b.streak - a.streak).slice(0, 10).map(minimalUser)
            };
    
            const actionsInDateRange = allActions.filter(a => new Date(a.timestamp) >= new Date(relevantDateLimit));
    
            // FIX: Explicitly type the accumulator for `reduce` to ensure correct type inference.
            const activityCounts = actionsInDateRange.reduce((acc: { [key: string]: number }, action) => {
                acc[action.actionType] = (acc[action.actionType] || 0) + 1;
                return acc;
            }, {});
    
            const activityBreakdown = Object.entries(activityCounts).map(([actionType, count]) => ({ actionType, count }));
    
            const generateChartColors = (count: number): string[] => {
                const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f97316', '#ef4444', '#ec4899'];
                return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
            };
            const breakdownColors = generateChartColors(activityBreakdown.length);
            activityBreakdown.forEach((item, index) => { (item as any).color = breakdownColors[index]; });
    
            // FIX: Explicitly type the accumulator as a number to handle arithmetic operations safely.
            const totalStreakLength = allProfiles.reduce((sum: number, p: any) => sum + (p.streak || 0), 0);
            const avgStreakLength = totalUsers > 0 ? Math.round(totalStreakLength / totalUsers) : 0;
            const membersWithActiveStreak = allProfiles.filter(p => p.streak > 0).length;
            const percentWithActiveStreak = totalUsers > 0 ? Math.round((membersWithActiveStreak / totalUsers) * 100) : 0;
    
            // FIX: Explicitly type the accumulator to ensure `totalXp` is a number for correct mapping.
            const topXpActionsMap = actionsInDateRange.reduce((acc: { [key: string]: number }, action) => {
                acc[action.actionType] = (acc[action.actionType] || 0) + action.xpGained;
                return acc;
            }, {});
            const topXpActions = Object.entries(topXpActionsMap)
                .map(([actionType, totalXp]) => ({ actionType, totalXp }))
                .sort((a, b) => b.totalXp - a.totalXp).slice(0, 5);
    
            // FIX: Explicitly type the accumulator to ensure correct type inference for badge properties.
            const topBadgesMap = allUserBadges.reduce((acc: {[key: string]: { count: number; icon: string; color: string }}, userBadge: any) => {
                const badge = userBadge.badges; 
                if (badge && badge.name) {
                    if (!acc[badge.name]) {
                        acc[badge.name] = { count: 0, icon: badge.icon, color: badge.color };
                    }
                    acc[badge.name].count++;
                }
                return acc;
            }, {});
            const topBadges = Object.entries(topBadgesMap)
                .map(([name, data]) => ({ name, count: data.count, icon: data.icon, color: data.color }))
                .sort((a, b) => b.count - a.count).slice(0, 6);
    
            const questAnalytics = allQuests.map(quest => {
                const participants = allUserQuestProgress.filter(p => p.quest_id === quest.id);
                const completions = participants.filter(p => p.is_completed);
                const participationRate = (participants.length / totalUsers) * 100;
                const completionRate = participants.length > 0 ? (completions.length / participants.length) * 100 : 0;
                return { questId: quest.id, title: quest.title, participationRate, completionRate };
            });
    
            // FIX: Explicitly type the accumulator to ensure arithmetic operations are safe.
            const totalSpent = allUserPurchases.reduce((sum: number, p) => sum + Number(p.cost_xp || 0), 0);
            // FIX: Explicitly type the accumulator to ensure purchase `count` is a number for correct mapping.
            const itemPurchaseCounts = allUserPurchases.reduce((acc: { [key: string]: number }, purchase: any) => {
                const name = (purchase.store_items as any)?.name; 
                if (name) {
                    acc[name] = (acc[name] || 0) + 1;
                }
                return acc;
            }, {});
    
            const storeItemsAnalytics = Object.entries(itemPurchaseCounts)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count);
    
            return {
                engagement: { activeMembers7d, activeMembers30d, avgDailyActions: actionsToday.length, xpEarnedToday },
                growth: { newMembers7d, churnedMembers14d },
                topPerformers,
                activityBreakdown,
                streakHealth: { avgStreakLength, percentWithActiveStreak },
                topXpActions,
                topBadges,
                questAnalytics,
                storeAnalytics: { totalSpent, items: storeItemsAnalytics },
            };
    
        } catch (error) {
            console.error("Error fetching analytics data:", (error as Error).message);
            return null;
        }
    },

    // Profile Management
    uploadAvatar: async (file: File): Promise<string | null> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}.${fileExt}`;

        const { error } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
        if (error) {
            console.error('Error uploading avatar:', error.message);
            return null;
        }
        return filePath;
    },
    updateUserProfile: async (updates: { avatarUrl?: string }): Promise<boolean> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { error } = await supabase.from('profiles').update({ avatar_url: updates.avatarUrl }).eq('id', user.id);
        if (error) {
            console.error('Error updating user profile:', error.message);
            return false;
        }
        return true;
    },
    
    // Inventory
    getUserInventory: async (userId: string): Promise<UserInventoryItem[]> => {
        const { data, error } = await supabase
            .from('user_inventory')
            .select('*, store_items(*)')
            .eq('user_id', userId)
            .order('purchased_at', { ascending: true });
        if (error) {
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
        if (error) {
            console.error("Error fetching active effects:", error.message);
            return [];
        }
        return data.map(activeEffectFromSupabase);
    },
    activateInventoryItem: async (inventoryId: string) => {
        const { data, error } = await supabase.rpc('activate_inventory_item', { p_inventory_id: inventoryId });
        if (error) {
            console.error("Error activating item:", error.message);
            return { success: false, message: "Failed to activate item." };
        }
        return data as { success: boolean; message: string; };
    },
    
    // Admin Actions
    adminUpdateUserStats: async (userId: string, xp: number, streak: number, streakFreezes: number) => {
        const { error } = await supabase.rpc('admin_update_user_stats', { p_user_id: userId, p_xp: xp, p_streak: streak, p_streak_freezes: streakFreezes });
        if (error) {
            console.error("Admin stat update failed:", error.message);
            return { success: false, message: error.message };
        }
        return { success: true, message: "User stats updated." };
    },
    adminUpdateUserRole: async (userId: string, newRole: 'admin' | 'member') => {
        const { error } = await supabase.rpc('admin_update_user_role', { p_user_id: userId, p_new_role: newRole });
         if (error) {
            console.error("Admin role update failed:", error.message);
            return { success: false, message: error.message };
        }
        return { success: true, message: "User role updated." };
    },
    adminBanUser: async (userId: string, durationHours: number | null) => {
        // This function would typically be a secure RPC.
        // For this context, we perform a direct update, assuming admin RLS is in place.
        let bannedUntil = null;
        if (durationHours === 0) { // Unban
            bannedUntil = new Date(0).toISOString();
        } else if (durationHours) { // Timed ban
            const banEndDate = new Date();
            banEndDate.setHours(banEndDate.getHours() + durationHours);
            bannedUntil = banEndDate.toISOString();
        } else { // Permanent ban
             bannedUntil = new Date('9999-12-31T23:59:59Z').toISOString();
        }

        const { error } = await supabase.from('profiles').update({ banned_until: bannedUntil }).eq('id', userId);
        if (error) {
            console.error("Admin ban failed:", error.message);
            return { success: false, message: "Failed to update ban status." };
        }
        const message = durationHours === 0 ? "User unbanned." : "User has been banned.";
        return { success: true, message };
    },
    adminGetUserEmail: async (userId: string): Promise<string | null> => {
        // This is a sensitive operation and should be a SECURITY DEFINER RPC on Supabase.
        // The RPC 'admin_get_user_email' is assumed to exist for this to work.
        const { data, error } = await supabase.rpc('admin_get_user_email', { p_user_id: userId });
        if (error) {
            console.error("Admin get email failed:", error.message);
            return null;
        }
        return data;
    },
    getAllUserActions: async (userId: string): Promise<Action[]> => {
        const { data, error } = await supabase
            .from('actions_log')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) {
            console.error(`Error fetching all actions for user ${userId}:`, error.message);
            return [];
        }
        return data.map(actionFromSupabase);
    },
    adminUpdateCommunityTier: async (tier: 'starter' | 'core' | 'pro'): Promise<boolean> => {
        const communityId = await getCommunityId();
        const { error } = await supabase.from('communities').update({ subscription_tier: tier }).eq('id', communityId);
        if (error) {
            console.error("Error updating community tier:", error.message);
            return false;
        }
        return true;
    },
};