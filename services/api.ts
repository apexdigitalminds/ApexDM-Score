import { supabase } from './supabase';
import type { User, Action, Badge, RewardsConfig, BadgeConfig, Community, Quest, UserQuestProgress, QuestTask, AnalyticsData, StoreItem } from '../types';
import { initialRewardsConfig, initialBadgesConfig } from '../config/rewards';

// --- MOCK WHOP/COMMUNITY DATA (for simulation) ---
// In a real app, this would be fetched or configured elsewhere.
const MOCK_WHOP_MEMBERS = [
    { whop_user_id: 'whop_alex_123', username: 'Alex' }, // Should match an existing user for demo
    { whop_user_id: 'whop_zara_789', username: 'Zara' }, // New user
    { whop_user_id: 'whop_leo_101', username: 'Leo' },   // New user
];
const STREAK_FREEZE_COST = 500;

// FIX: Export SignInCredentials and SignUpCredentials types for use in App.tsx.
export interface SignInCredentials {
    email: string;
    password: string;
}

export interface SignUpCredentials extends SignInCredentials {
    username: string;
    avatarUrl: string;
}

// --- DATA TRANSFORMATION HELPERS ---
// These helpers convert data between Supabase's snake_case and our app's camelCase.

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
        badges,
    };
};

const actionFromSupabase = (data: any): Action => ({
    id: data.id,
    userId: data.user_id,
    communityId: data.community_id,
    actionType: data.action_type,
    xpGained: data.xp_gained,
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
    badgeReward: data.badge_reward_name, // Use the joined name
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
});


// Assume a single community for this app version
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

const PROFILE_COLUMNS = 'id, community_id, username, avatar_url, xp, streak, streak_freezes, last_action_date, role, whop_user_id';

export const api = {
    // READ operations
    getUsers: async (): Promise<User[]> => {
        // Step 1: Fetch all user profiles
        const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select(PROFILE_COLUMNS)
            .order('xp', { ascending: false });

        if (profilesError) {
            console.error('Error fetching users:', profilesError.message);
            return [];
        }

        // Step 2: Fetch all user_badges and their corresponding badges
        const { data: allUserBadges, error: allUserBadgesError } = await supabase
            .from('user_badges')
            .select('user_id, badges(id, name, description, icon, color)');
        
        if (allUserBadgesError) {
            console.error('Error fetching all user badges:', allUserBadgesError.message);
            // Proceed without badges if this fails
        }
        
        // Step 3: Create a map for efficient lookup of badges by user_id
        const badgesByUserId = new Map<string, any[]>();
        if (allUserBadges) {
            for (const userBadge of allUserBadges) {
                if (userBadge.user_id) {
                    if (!badgesByUserId.has(userBadge.user_id)) {
                        badgesByUserId.set(userBadge.user_id, []);
                    }
                    // Only add if the nested badge data exists
                    if (userBadge.badges) {
                         badgesByUserId.get(userBadge.user_id)!.push({ badges: userBadge.badges });
                    }
                }
            }
        }

        // Step 4: Combine profiles with their badges
        return profilesData.map(profile => {
            const enrichedProfile = {
                ...profile,
                user_badges: badgesByUserId.get(profile.id) || [],
            };
            return profileFromSupabase(enrichedProfile);
        });
    },
    getUserById: async (userId: string): Promise<User | null> => {
        // Step 1: Fetch the user profile without badges
        const { data, error } = await supabase
            .from('profiles')
            .select(PROFILE_COLUMNS)
            .eq('id', userId)
            .single();

        if (error || !data) {
            console.error(`Error fetching profile for user ${userId}:`, error?.message);
            return null;
        }
        
        // Step 2: Fetch the user's badges
        const { data: userBadges, error: badgesError } = await supabase
            .from('user_badges')
            .select('badges(id, name, description, icon, color)')
            .eq('user_id', userId);

        if (badgesError) {
             console.error(`Error fetching badges for user ${userId}:`, badgesError.message);
             // Return profile data even if badges fail
        }

        // Step 3: Combine them
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
            .from('user_actions')
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
        // Bypassing database call due to repeated schema/permission errors from user's environment.
        // Using a stable, file-based config ensures the app can run while DB issues are sorted out.
        console.log("Using initial rewards config from file to bypass database issues.");
        return Promise.resolve(initialRewardsConfig);
    },
    getBadgesConfig: async (): Promise<{ [key: string]: BadgeConfig }> => {
        // Bypassing database call due to potential schema/permission errors from user's environment.
        // Using a stable, file-based config ensures the app can run while DB issues are sorted out.
        console.log("Using initial badges config from file to bypass database issues.");
        return Promise.resolve(initialBadgesConfig);
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
        // This function now calls a Supabase RPC function to handle the logic securely on the server.
        const { data, error } = await supabase.rpc('handle_action', {
            p_user_id: userId,
            p_action_type: actionType,
            p_source: source,
        });

        if (error) {
            console.error('Error recording action:', error.message);
            return null;
        }
        return data;
    },
     awardBadge: async (userId: string, badgeName: string) => {
        const { error } = await supabase.rpc('award_badge_to_user', {
            p_user_id: userId,
            p_badge_name: badgeName,
        });

        if (error) {
            console.error(`Error awarding badge "${badgeName}" to user ${userId}:`, error.message);
        }
    },
    createReward: async (actionType: string, xp: number) => {
        const communityId = await getCommunityId();
        const { error } = await supabase.from('rewards_actions').insert({
            community_id: communityId,
            action_type: actionType,
            xp_gained: xp,
            description: `XP for performing action: ${actionType.replace(/_/g, ' ')}`,
            is_active: true,
        });
        if (error) console.error(`Error creating reward "${actionType}":`, error.message);
    },
    updateReward: async (actionType: string, xp: number) => {
        const { error } = await supabase
            .from('rewards_actions')
            .update({ xp_gained: xp })
            .eq('action_type', actionType);
        if (error) console.error(`Error updating reward "${actionType}":`, error.message);
    },
    deleteReward: async (actionType: string) => {
        const { error } = await supabase
            .from('rewards_actions')
            .delete()
            .eq('action_type', actionType);
        if (error) console.error(`Error deleting reward "${actionType}":`, error.message);
    },
    createBadge: async (name: string, config: BadgeConfig) => {
        const communityId = await getCommunityId();
        const { error } = await supabase.from('badges').insert({
            community_id: communityId,
            name,
            ...config,
        });
        if (error) console.error(`Error creating badge "${name}":`, error.message);
    },
    updateBadge: async (name: string, config: BadgeConfig) => {
        const { error } = await supabase
            .from('badges')
            .update(config)
            .eq('name', name);
        if (error) console.error(`Error updating badge "${name}":`, error.message);
    },
    deleteBadge: async (name: string) => {
        const { error } = await supabase.from('badges').delete().eq('name', name);
        if (error) console.error(`Error deleting badge "${name}":`, error.message);
    },
    
    // AUTH operations
    signInWithPassword: (credentials: SignInCredentials) => {
        return supabase.auth.signInWithPassword(credentials);
    },
    signUpNewUser: async (credentials: SignUpCredentials) => {
        // First, sign up the user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: credentials.email,
            password: credentials.password,
        });

        if (authError || !authData.user) {
            return { data: authData, error: authError };
        }
        
        // If auth signup is successful, create a corresponding public profile
        const communityId = await getCommunityId();
        const { error: profileError } = await supabase.from('profiles').insert({
            id: authData.user.id,
            community_id: communityId,
            username: credentials.username,
            avatar_url: credentials.avatarUrl,
        });

        if (profileError) {
            console.error("Error creating user profile:", profileError.message);
            // This is a tricky state. The auth user exists but the profile failed.
            // For now, we'll return the profile error to the UI.
            // A more robust solution might involve cleaning up the auth user or retrying.
            return { data: authData, error: profileError };
        }

        return { data: authData, error: null };
    },
    signOut: () => {
        return supabase.auth.signOut();
    },
    
    // --- WHOP SIMULATION ---
    syncWhopMembers: async () => {
        const { data, error } = await supabase.rpc('sync_whop_members_mock', {
            members: MOCK_WHOP_MEMBERS
        });

        if (error) {
            console.error('Error syncing Whop members:', error.message);
            return 'Sync failed. See console for details.';
        }
        return `Sync complete. ${data.new_users} new users added, ${data.updated_users} users updated.`;
    },
    triggerWebhook: async (userId: string, actionType: string) => {
         const result = await api.recordAction(userId, actionType, 'whop');
         if(result) {
            const user = await api.getUserById(userId);
            return `Webhook for '${actionType.replace(/_/g, ' ')}' triggered for ${user?.username}. They gained ${result.xpGained} XP.`;
         }
         return null;
    },
    // Quest Management
    createQuest: async (questData: Omit<Quest, 'id' | 'isActive'>): Promise<boolean> => {
        const { error } = await supabase.rpc('create_quest_with_tasks', {
            p_title: questData.title,
            p_description: questData.description,
            p_xp_reward: questData.xpReward,
            p_badge_reward_name: questData.badgeReward,
            p_tasks: questData.tasks,
        });
        if (error) {
            console.error('Error creating quest:', error.message);
            return false;
        }
        return true;
    },
    updateQuest: async (questId: string, questData: Omit<Quest, 'id' | 'isActive'>): Promise<boolean> => {
        const { error } = await supabase.rpc('update_quest_with_tasks', {
            p_quest_id: questId,
            p_title: questData.title,
            p_description: questData.description,
            p_xp_reward: questData.xpReward,
            p_badge_reward_name: questData.badgeReward,
            p_tasks: questData.tasks,
        });
        if (error) {
            console.error('Error updating quest:', error.message);
            return false;
        }
        return true;
    },
    deleteQuest: async (questId: string): Promise<boolean> => {
        const { error } = await supabase.from('quests').delete().eq('id', questId);
        if (error) {
            console.error('Error deleting quest:', error.message);
            return false;
        }
        return true;
    },
    updateQuestActiveStatus: async (questId: string, isActive: boolean) => {
        const { error } = await supabase.from('quests').update({ is_active: isActive }).eq('id', questId);
        if (error) console.error(`Error updating quest status:`, error.message);
    },
    // Store Item Management
    createStoreItem: async (itemData: Omit<StoreItem, 'id' | 'isActive'> & { isActive?: boolean }): Promise<boolean> => {
        const communityId = await getCommunityId();
        const { error } = await supabase.from('store_items').insert({
            community_id: communityId,
            name: itemData.name,
            description: itemData.description,
            cost_xp: itemData.cost,
            icon: itemData.icon,
            is_available: itemData.isActive ?? true,
        });
        if (error) {
            console.error('Error creating store item:', error.message);
            return false;
        }
        return true;
    },
    updateStoreItem: async (itemId: string, itemData: Omit<StoreItem, 'id' | 'isActive'>): Promise<boolean> => {
        const { error } = await supabase
            .from('store_items')
            .update({
                name: itemData.name,
                description: itemData.description,
                cost_xp: itemData.cost,
                icon: itemData.icon,
            })
            .eq('id', itemId);

        if (error) {
            console.error('Error updating store item:', error.message);
            return false;
        }
        return true;
    },
    deleteStoreItem: async (itemId: string): Promise<boolean> => {
        const { error } = await supabase.from('store_items').delete().eq('id', itemId);
        if (error) {
            console.error('Error deleting store item:', error.message);
            return false;
        }
        return true;
    },
    updateStoreItemActiveStatus: async (itemId: string, isActive: boolean) => {
        const { error } = await supabase.from('store_items').update({ is_available: isActive }).eq('id', itemId);
        if (error) console.error(`Error updating store item status:`, error.message);
    },
     buyStoreItem: async (userId: string, itemId: string): Promise<{ success: boolean; message: string; }> => {
        try {
            // Step 1: Verify user can afford the item
            const { data: userData, error: userError } = await supabase
                .from('profiles')
                .select('xp')
                .eq('id', userId)
                .single();

            const { data: itemData, error: itemError } = await supabase
                .from('store_items')
                .select('id, name, cost_xp')
                .eq('id', itemId)
                .single();

            if (userError || itemError || !userData || !itemData) {
                throw new Error(userError?.message || itemError?.message || 'Could not find user or item.');
            }

            if (userData.xp < itemData.cost_xp) {
                return { success: false, message: 'Not enough XP!' };
            }

            // This is a placeholder for a more robust transaction.
            // In a real scenario, you'd use a database function (RPC) to ensure atomicity.

            // 1. Deduct XP
            const { error: xpError } = await supabase
                .from('profiles')
                .update({ xp: userData.xp - itemData.cost_xp })
                .eq('id', userId);
            
            if (xpError) throw new Error(xpError.message);

            // 2. Grant item effect
            // As per the provided schema, item type is not available.
            // Assume all purchasable items are currently Streak Freezes.
            const { error: updateError } = await supabase.rpc('increment_streak_freezes', {
                user_id: userId,
                amount: 1,
            });

            if (updateError) {
                // Ideally, you'd have a mechanism to revert the XP deduction here.
                // For now, we'll log the error and return a failure message.
                console.error("Failed to grant item effect after deducting XP:", updateError.message);
                throw new Error(updateError.message);
            }
            
            return { success: true, message: `Successfully purchased ${itemData.name}!` };

        } catch (error: any) {
            console.error('Error purchasing store item:', error.message);
            return { success: false, message: `Purchase failed: ${error.message}` };
        }
    },
    claimQuestReward: async (userId: string, questId: string) => {
        const { data, error } = await supabase.rpc('claim_quest_reward', {
            p_user_id: userId,
            p_quest_id: questId,
        });

        if (error) {
            console.error('Error claiming quest reward:', error.message);
            return { success: false, message: `Error: ${error.message}` };
        }

        return { success: true, message: data };
    },
    // Profile Management
    uploadAvatar: async (file: File): Promise<string | null> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, { upsert: true });

        if (error) {
            console.error('Error uploading avatar:', error.message);
            return null;
        }

        return filePath; // Return the path, not the full URL
    },
    updateUserProfile: async (updates: { avatarUrl?: string }): Promise<boolean> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { error } = await supabase
            .from('profiles')
            .update({ avatar_url: updates.avatarUrl })
            .eq('id', user.id);
        
        if (error) {
            console.error('Error updating user profile:', error.message);
            return false;
        }
        return true;
    },
    // Analytics
    getAnalyticsData: async (dateRange: '7d' | '30d'): Promise<AnalyticsData | null> => {
        const { data, error } = await supabase.rpc('get_analytics_data', {
            date_range: dateRange
        });
        if (error) {
            console.error('Error fetching analytics data:', error.message);
            return null;
        }
        
        // The RPC returns snake_case, but we can just cast it as the frontend expects camelCase
        // because the names are so similar. A more robust solution would map each field.
        return data as AnalyticsData;
    }
};