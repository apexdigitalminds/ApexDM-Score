import { supabase } from './supabase';
import type { User, Action, Badge, RewardsConfig, BadgeConfig, Community, Quest, UserQuestProgress, QuestTask } from '../types';

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
    badgeReward: data.badge_reward_id, // Note: This is just the ID now. We'd need to join to get the name.
});

const userQuestProgressFromSupabase = (data: any): UserQuestProgress => ({
    questId: data.quest_id,
    progress: data.progress,
    completed: data.is_completed,
    claimed: data.is_claimed,
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
        // Step 1: Fetch the user profile without .single() to avoid coercion errors
        // that can be caused by RLS policies with joins.
        const { data: profileDataArray, error: profileError } = await supabase
            .from('profiles')
            .select(PROFILE_COLUMNS)
            .eq('id', userId);

        if (profileError) {
            console.error(`Error fetching user ${userId}:`, profileError.message);
            return null;
        }

        if (!profileDataArray || profileDataArray.length === 0) {
            return null; // User not found, not necessarily an error.
        }

        // If RLS returns multiple rows for a single ID, log it as a potential issue
        // but proceed with the first result to keep the app functional.
        if (profileDataArray.length > 1) {
            console.warn(`Data integrity warning: Multiple profiles returned for user ID ${userId}. Using the first result.`);
        }

        const profileData = profileDataArray[0];

        // Step 2: Fetch the user's badges
        const { data: badgesData, error: badgesError } = await supabase
            .from('user_badges')
            .select('badges(id, name, description, icon, color)')
            .eq('user_id', userId);

        if (badgesError) {
            console.error(`Error fetching badges for user ${userId}:`, badgesError.message);
            // Continue without badges if this query fails
        }

        // Step 3: Combine the profile and badge data
        const enrichedProfile = {
            ...profileData,
            user_badges: badgesData || [],
        };

        return profileFromSupabase(enrichedProfile);
    },
    // FIX: Add getCurrentUserProfile method to fetch the profile for the currently authenticated user.
    getCurrentUserProfile: async (): Promise<User | null> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return null;
        }
        return api.getUserById(user.id);
    },
    getUserActions: async (userId: string): Promise<Action[]> => {
        const { data, error } = await supabase
            .from('actions_log')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching user actions:', error.message);
            return [];
        }
        return data.map(actionFromSupabase);
    },
    getRewardsConfig: async (): Promise<RewardsConfig> => {
        const { data, error } = await supabase.from('reward_actions').select('*');
        if (error) {
            console.error('Error fetching rewards config:', error.message);
            return {};
        }
        return data.reduce((acc, action) => {
            acc[action.action_type] = { xp: action.xp_gained, badge: null }; // Note: Badge linking logic is separate now
            return acc;
        }, {} as RewardsConfig);
    },
    getBadgesConfig: async (): Promise<{ [key: string]: BadgeConfig }> => {
        const { data, error } = await supabase.from('badges').select('*');
         if (error) {
            console.error('Error fetching badges config:', error.message);
            return {};
        }
        return data.reduce((acc, badge) => {
            acc[badge.name] = { description: badge.description, icon: badge.icon, color: badge.color };
            return acc;
        }, {} as { [key: string]: BadgeConfig });
    },
    getCommunityInfo: async (): Promise<Community | null> => {
        const { data, error } = await supabase.from('communities').select('*').limit(1).single();
        if (error) {
            console.error('Error fetching community info:', error.message);
            return null;
        }
        // Basic mapping, assuming schema matches type well enough
        return {
            id: data.id,
            name: data.name,
            logoUrl: data.logo_url,
            themeColor: data.theme_color,
            whop_store_id: data.whop_store_id,
            subscriptionTier: data.subscription_tier
        };
    },
    getQuests: async (): Promise<Quest[]> => {
        const { data, error } = await supabase.from('quests').select('*, quest_tasks(*)').eq('is_active', true);
        if (error) {
            console.error('Error fetching quests:', error.message);
            return [];
        }
        return data.map(questFromSupabase);
    },
    getUserQuestProgress: async (userId: string): Promise<UserQuestProgress[]> => {
        const { data, error } = await supabase.from('user_quest_progress').select('*').eq('user_id', userId);
        if (error) {
            console.error('Error fetching user quest progress:', error.message);
            return [];
        }
        return data.map(userQuestProgressFromSupabase);
    },

    // WRITE operations
    recordAction: async (userId: string, actionType: string, source: 'manual' | 'whop' | 'discord' = 'manual') => {
        // IMPORTANT: This is a simplified version. The complex logic for streaks, auto-badging,
        // and quests should be moved to a Supabase Database Function (RPC) to ensure it's
        // secure, atomic, and reliable. Doing this on the client is not production-safe.
        const communityId = await getCommunityId();

        const { data: rewardAction } = await supabase
            .from('reward_actions')
            .select('xp_gained')
            .eq('action_type', actionType)
            .eq('community_id', communityId)
            .single();

        if (!rewardAction) {
            console.error(`Reward action type "${actionType}" not found.`);
            return null;
        }
        
        // Use an RPC call to a database function to handle the logic atomically
        const { data, error } = await supabase.rpc('increment_user_xp', {
            p_user_id: userId,
            p_xp_to_add: rewardAction.xp_gained
        });

        if (error) {
            console.error("Error updating user XP:", error.message);
            return null;
        }

        // 3. Log the action
        const { error: logError } = await supabase.from('actions_log').insert({
            user_id: userId,
            community_id: communityId,
            action_type: actionType,
            xp_gained: rewardAction.xp_gained,
            source: source,
        });
        
        if (logError) console.error("Error logging action:", logError.message);

        // We can't easily get the username back from this simplified flow, so we return a subset.
        // A full RPC function would handle and return all necessary data.
        return { xpGained: rewardAction.xp_gained, username: '' };
    },

    awardBadge: async (userId: string, badgeName: string): Promise<boolean> => {
        const communityId = await getCommunityId();
        const { data: badge } = await supabase.from('badges').select('id').eq('name', badgeName).eq('community_id', communityId).single();
        if(!badge) return false;

        const { error } = await supabase.from('user_badges').insert({
            user_id: userId,
            badge_id: badge.id,
            community_id: communityId,
        });
        return !error;
    },

    createReward: async (actionName: string, xp: number): Promise<boolean> => {
       const communityId = await getCommunityId();
       const { error } = await supabase.from('reward_actions').insert({
           community_id: communityId,
           action_type: actionName,
           xp_gained: xp,
       });
       return !error;
    },

    createBadge: async (badgeName: string, config: BadgeConfig): Promise<boolean> => {
        const communityId = await getCommunityId();
        const { error } = await supabase.from('badges').insert({
            community_id: communityId,
            name: badgeName,
            ...config
        });
        return !error;
    },
    
    syncWhopMembers: async (): Promise<string> => {
        // This is a MOCK implementation. A real version would require backend logic to securely
        // call the Whop API, as API keys should not be exposed on the client.
        const communityId = await getCommunityId();
        let newUsersCount = 0;
        let existingUsersCount = 0;

        for (const member of MOCK_WHOP_MEMBERS) {
            const { data: existingUser } = await supabase.from('profiles').select('id').eq('whop_user_id', member.whop_user_id).single();
            if (!existingUser) {
                // In a real app, user creation would be handled by Supabase Auth.
                // This is a placeholder for the demo.
                console.log(`(Simulation) Would create new user: ${member.username}`);
                newUsersCount++;
            } else {
                existingUsersCount++;
            }
        }
        return `Sync simulation complete. Found ${existingUsersCount} existing members and would add ${newUsersCount} new members.`;
    },

    triggerWebhook: async (userId: string, actionType: string): Promise<string | null> => {
        // This simulates a webhook call by directly calling recordAction
        const result = await api.recordAction(userId, actionType, 'whop');
        if (result) {
            const { data: user } = await supabase.from('profiles').select('username').eq('id', userId).single();
            return `Webhook success: Awarded ${result.xpGained} XP to ${user?.username} for subscription renewal.`;
        }
        return 'Webhook failed: User or action not found.';
    },
    
    buyStreakFreeze: async (userId: string): Promise<{ success: boolean; message: string; }> => {
        // WARNING: This is NOT transaction-safe and is vulnerable to race conditions.
        // This logic MUST be moved to a database function (RPC) for production.
        const { data: user } = await supabase.from('profiles').select('xp, streak_freezes').eq('id', userId).single();
        if (!user) return { success: false, message: 'User not found.' };
        if (user.xp < STREAK_FREEZE_COST) return { success: false, message: 'Not enough XP!' };

        const { error } = await supabase.from('profiles').update({
            xp: user.xp - STREAK_FREEZE_COST,
            streak_freezes: user.streak_freezes + 1,
        }).eq('id', userId);
        
        if (error) return { success: false, message: 'Purchase failed.' };
        return { success: true, message: 'Streak Freeze purchased!' };
    },

    claimQuestReward: async (userId: string, questId: string): Promise<{ success: boolean; message: string }> => {
        // WARNING: This logic MUST be moved to a database function (RPC) for production to prevent cheating.
        // It's implemented here to keep the demo functional for now.
        const { data: progress } = await supabase.from('user_quest_progress').select('*').eq('user_id', userId).eq('quest_id', questId).single();
        if (!progress || !progress.is_completed || progress.is_claimed) {
            return { success: false, message: 'Reward cannot be claimed.' };
        }

        const { data: quest } = await supabase.from('quests').select('*').eq('id', questId).single();
        if (!quest) return { success: false, message: 'Quest not found.' };

        // Mark as claimed
        await supabase.from('user_quest_progress').update({ is_claimed: true, claimed_at: new Date().toISOString() }).match({ id: progress.id });

        // Award XP
        await supabase.rpc('increment_user_xp', { p_user_id: userId, p_xp_to_add: quest.xp_reward });
        
        // Award Badge
        if(quest.badge_reward_id) {
             const communityId = await getCommunityId();
             await supabase.from('user_badges').insert({ user_id: userId, badge_id: quest.badge_reward_id, community_id: communityId });
        }
        
        return { success: true, message: `Quest complete! +${quest.xp_reward} XP`};
    },
    
    resetData: async (): Promise<void> => {
        console.warn("API Reset is disabled. Please manage data in the Supabase dashboard.");
    },

    // --- AUTH ---
    // FIX: Implement missing authentication methods.
    signInWithPassword: async (credentials: SignInCredentials) => {
        return supabase.auth.signInWithPassword(credentials);
    },
    signUpNewUser: async ({ email, password, username }: SignUpCredentials) => {
        const communityId = await getCommunityId();
        return supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username,
                    avatar_url: `https://api.dicebear.com/8.x/lorelei/svg?seed=${encodeURIComponent(username)}`,
                    community_id: communityId,
                },
            },
        });
    },
    // FIX: Changed signOut to return Promise<void> to match the type in AppContextType.
    signOut: async (): Promise<void> => {
        await supabase.auth.signOut();
    },
};