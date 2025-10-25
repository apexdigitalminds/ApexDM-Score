import type { User, Action, Badge, RewardsConfig, BadgeConfig, Community, Quest, UserQuestProgress } from '../types';
import { initialRewardsConfig, initialBadgesConfig } from '../config/rewards';

// --- MOCK DATABASE ---
// This section simulates a persistent backend database.

const STREAK_FREEZE_COST = 500;

const initialUsers: User[] = [
  { id: 'user_1', username: 'Alex', avatarUrl: 'https://picsum.photos/seed/alex/100', xp: 480, streak: 5, streakFreezes: 1, lastActionDate: new Date(Date.now() - 20 * 3600 * 1000).toISOString(), badges: [{id: 'b1', name: 'Analyst Bronze', ...initialBadgesConfig['Analyst Bronze']}, {id: 'b3', name: 'Streak Starter', ...initialBadgesConfig['Streak Starter']}], role: 'admin', whop_user_id: 'whop_alex_123' },
  { id: 'user_2', username: 'Ben', avatarUrl: 'https://picsum.photos/seed/ben/100', xp: 1250, streak: 12, streakFreezes: 2, lastActionDate: new Date().toISOString(), badges: [
      {id: 'b4', name: 'XP Novice', ...initialBadgesConfig['XP Novice']},
      {id: 'b5', name: 'XP Adept', ...initialBadgesConfig['XP Adept']},
      {id: 'b6', name: 'XP Veteran', ...initialBadgesConfig['XP Veteran']},
  ], role: 'member', whop_user_id: 'whop_ben_456' },
  { id: 'user_3', username: 'Carla', avatarUrl: 'https://picsum.photos/seed/carla/100', xp: 950, streak: 2, streakFreezes: 0, lastActionDate: new Date(Date.now() - 40 * 3600 * 1000).toISOString(), badges: [], role: 'member' },
  { id: 'user_4', username: 'Diana', avatarUrl: 'https://picsum.photos/seed/diana/100', xp: 720, streak: 0, streakFreezes: 1, lastActionDate: new Date(Date.now() - 72 * 3600 * 1000).toISOString(), badges: [], role: 'member' },
  { id: 'user_5', username: 'Ethan', avatarUrl: 'https://picsum.photos/seed/ethan/100', xp: 680, streak: 1, streakFreezes: 0, lastActionDate: new Date(Date.now() - 30 * 3600 * 1000).toISOString(), badges: [], role: 'member' },
  { id: 'user_6', username: 'Fiona', avatarUrl: 'https://picsum.photos/seed/fiona/100', xp: 450, streak: 4, streakFreezes: 0, lastActionDate: new Date().toISOString(), badges: [], role: 'member' },
  { id: 'user_7', username: 'George', avatarUrl: 'https://picsum.photos/seed/george/100', xp: 320, streak: 3, streakFreezes: 0, lastActionDate: new Date().toISOString(), badges: [], role: 'member' },
  { id: 'user_8', username: 'Hannah', avatarUrl: 'https://picsum.photos/seed/hannah/100', xp: 210, streak: 0, streakFreezes: 0, lastActionDate: null, badges: [], role: 'member' },
  { id: 'user_9', username: 'Ian', avatarUrl: 'https://picsum.photos/seed/ian/100', xp: 150, streak: 1, streakFreezes: 0, lastActionDate: new Date().toISOString(), badges: [], role: 'member' },
  { id: 'user_10', username: 'Jane', avatarUrl: 'https://picsum.photos/seed/jane/100', xp: 80, streak: 1, streakFreezes: 0, lastActionDate: new Date().toISOString(), badges: [], role: 'member' },
  { id: 'user_11', username: 'Kevin', avatarUrl: 'https://picsum.photos/seed/kevin/100', xp: 50, streak: 0, streakFreezes: 0, lastActionDate: null, badges: [], role: 'member' },
];

const initialActions: Action[] = [
    { id: 'action_1', userId: 'user_1', actionType: 'complete_module', xpGained: 25, timestamp: new Date().toISOString(), source: 'manual' },
    { id: 'action_2', userId: 'user_1', actionType: 'log_trade', xpGained: 15, timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString(), source: 'manual' },
];

const initialQuests: Quest[] = [
    { 
        id: 'q1', 
        title: 'Novice Trader', 
        description: 'Get started with the basics of trading by logging your first few trades.',
        tasks: [{ actionType: 'log_trade', targetCount: 3, description: 'Log 3 trades' }],
        xpReward: 100,
        badgeReward: 'Trader Novice',
    },
    { 
        id: 'q2', 
        title: 'Community Contributor', 
        description: 'Become an active member of the community by sharing your insights.',
        tasks: [
            { actionType: 'ask_good_question', targetCount: 2, description: 'Ask 2 good questions' },
            { actionType: 'share_alpha', targetCount: 1, description: 'Share 1 piece of alpha' },
        ],
        xpReward: 150,
        badgeReward: 'Community Helper',
    },
     { 
        id: 'q3', 
        title: 'Learning Spree', 
        description: 'Deepen your knowledge by completing several learning modules.',
        tasks: [{ actionType: 'complete_module', targetCount: 3, description: 'Complete 3 modules' }],
        xpReward: 200,
        badgeReward: null,
    },
];

// Add new badge configs for quest rewards
initialBadgesConfig['Trader Novice'] = { description: 'Completed the Novice Trader quest.', icon: 'ChartBar', color: '#60a5fa' };
initialBadgesConfig['Community Helper'] = { description: 'Completed the Community Contributor quest.', icon: 'UserGroup', color: '#34d399' };


const initialUserQuestProgress: { [userId: string]: UserQuestProgress[] } = {
    'user_2': [{ questId: 'q1', progress: { 'log_trade': 1 }, completed: false, claimed: false }],
};

interface WhopMember {
    whop_user_id: string;
    username: string;
}

const mockWhopMembers: WhopMember[] = [
    { whop_user_id: 'whop_alex_123', username: 'Alex' }, // Existing user
    { whop_user_id: 'whop_zara_789', username: 'Zara' }, // New user
    { whop_user_id: 'whop_leo_101', username: 'Leo' },   // New user
];

const mockCommunityData: Community = {
    id: 'comm_123',
    name: 'Apex Traders',
    logoUrl: 'https://picsum.photos/seed/community/100',
    themeColor: 'purple',
    whop_store_id: 'store_aBcDeFg12345',
    subscriptionTier: 'silver',
};

let nextUserId = 12;
let nextActionId = 3;

const mockDatabase = {
    users: initialUsers,
    actions: initialActions,
    rewards: initialRewardsConfig,
    badges: initialBadgesConfig,
    quests: initialQuests,
    userQuestProgress: initialUserQuestProgress,
};

// --- API SERVICE ---
// This section exports functions that simulate async API calls.
// In a real app, these would make `fetch` requests to a backend server.

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
    // READ operations
    getUsers: async (): Promise<User[]> => {
        await delay(100);
        return [...mockDatabase.users].sort((a, b) => b.xp - a.xp);
    },
    getUserById: async (userId: string): Promise<User | null> => {
        await delay(150);
        const user = mockDatabase.users.find(u => u.id === userId);
        return user ? { ...user } : null; // Return a copy
    },
    getUserActions: async (userId: string): Promise<Action[]> => {
        await delay(50);
        return mockDatabase.actions.filter(a => a.userId === userId).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    },
    getRewardsConfig: async (): Promise<RewardsConfig> => {
        await delay(10);
        return { ...mockDatabase.rewards };
    },
    getBadgesConfig: async (): Promise<{ [key: string]: BadgeConfig }> => {
        await delay(10);
        return { ...mockDatabase.badges };
    },
    getCommunityInfo: async (): Promise<Community> => {
        await delay(500);
        return mockCommunityData;
    },
    getQuests: async (): Promise<Quest[]> => {
        await delay(200);
        return [...mockDatabase.quests];
    },
    getUserQuestProgress: async (userId: string): Promise<UserQuestProgress[]> => {
        await delay(50);
        return mockDatabase.userQuestProgress[userId] || [];
    },

    // WRITE operations
    recordAction: async (userId: string, actionType: string, source: 'manual' | 'whop' | 'discord' = 'manual') => {
        await delay(200);
        const user = mockDatabase.users.find(u => u.id === userId);
        const reward = mockDatabase.rewards[actionType];
        
        if (!user || !reward) return null;

        const now = new Date();
        const lastAction = user.lastActionDate ? new Date(user.lastActionDate) : null;
        let newStreak = user.streak;

        if (lastAction) {
            const hoursSinceLastAction = (now.getTime() - lastAction.getTime()) / (1000 * 3600);
            if (hoursSinceLastAction > 48) {
                if (user.streakFreezes > 0) {
                    user.streakFreezes -= 1;
                    // Streak is saved, but doesn't increment. We just update the date.
                } else {
                    newStreak = 1;
                }
            } else if (now.toDateString() !== lastAction.toDateString()) {
                 newStreak += 1;
            }
        } else {
            newStreak = 1;
        }

        const newXp = user.xp + reward.xp;

        // Update user
        user.xp = newXp;
        user.streak = newStreak;
        user.lastActionDate = now.toISOString();

        // Create action record
        mockDatabase.actions.unshift({
            id: `action_${nextActionId++}`,
            userId,
            actionType,
            xpGained: reward.xp,
            timestamp: now.toISOString(),
            source,
        });
        
        // --- Badge Logic ---
        const badgesConfig = mockDatabase.badges;
        const addBadge = (badgeName: string) => {
            if (!user.badges.some(b => b.name === badgeName) && badgesConfig[badgeName]) {
                user.badges.push({ id: `badge_${Date.now()}_${user.id}`, name: badgeName, ...badgesConfig[badgeName] });
            }
        };

        if (reward.badge) addBadge(reward.badge);
        if (user.streak < 3 && newStreak >= 3) addBadge('Streak Starter');
        if (user.xp < 100 && newXp >= 100) addBadge('XP Novice');
        if (user.xp < 500 && newXp >= 500) addBadge('XP Adept');
        if (user.xp < 1000 && newXp >= 1000) addBadge('XP Veteran');
        if (user.xp < 1500 && newXp >= 1500) addBadge('XP Master');
        
        // --- Quest Progress Logic ---
        const userProgress = mockDatabase.userQuestProgress[userId] || [];
        mockDatabase.quests.forEach(quest => {
            const relevantTask = quest.tasks.find(t => t.actionType === actionType);
            if (relevantTask) {
                let questData = userProgress.find(p => p.questId === quest.id);
                // If user has started this quest or it is new
                if (questData && !questData.completed) {
                    questData.progress[actionType] = (questData.progress[actionType] || 0) + 1;
                } else if (!questData) {
                    questData = { questId: quest.id, progress: { [actionType]: 1 }, completed: false, claimed: false };
                    userProgress.push(questData);
                }
                
                // Check for completion
                const isComplete = quest.tasks.every(task => (questData.progress[task.actionType] || 0) >= task.targetCount);
                if(isComplete) {
                    questData.completed = true;
                }
            }
        });
        mockDatabase.userQuestProgress[userId] = userProgress;

        return { xpGained: reward.xp, newXp, newStreak, username: user.username };
    },

    awardBadge: async (userId: string, badgeName: string): Promise<boolean> => {
        await delay(100);
        const user = mockDatabase.users.find(u => u.id === userId);
        const badgeInfo = mockDatabase.badges[badgeName];
        if (user && badgeInfo && !user.badges.some(b => b.name === badgeName)) {
            user.badges.push({ id: `badge_${Date.now()}`, name: badgeName, ...badgeInfo });
            return true;
        }
        return false;
    },

    createReward: async (actionName: string, xp: number): Promise<boolean> => {
        await delay(100);
        if (!mockDatabase.rewards[actionName]) {
            mockDatabase.rewards[actionName] = { xp, badge: null };
            return true;
        }
        return false;
    },

    createBadge: async (badgeName: string, config: BadgeConfig): Promise<boolean> => {
        await delay(100);
        if (!mockDatabase.badges[badgeName]) {
            mockDatabase.badges[badgeName] = config;
            return true;
        }
        return false;
    },
    
    syncWhopMembers: async (): Promise<string> => {
        await delay(1000);
        let newUsersCount = 0;
        let existingUsersCount = 0;

        for (const member of mockWhopMembers) {
            const existingUser = mockDatabase.users.find(u => u.whop_user_id === member.whop_user_id);
            if (!existingUser) {
                 const newUser: User = {
                    id: `user_${nextUserId++}`,
                    username: member.username,
                    avatarUrl: `https://picsum.photos/seed/${member.username}/100`,
                    xp: 0,
                    streak: 0,
                    streakFreezes: 0,
                    lastActionDate: null,
                    badges: [],
                    role: 'member', // New users default to 'member'
                    whop_user_id: member.whop_user_id,
                };
                mockDatabase.users.push(newUser);
                newUsersCount++;
            } else {
                existingUsersCount++;
            }
        }
        return `Sync complete. Found ${existingUsersCount} existing members and added ${newUsersCount} new members.`;
    },

    triggerWebhook: async (userId: string, actionType: string): Promise<string | null> => {
        const result = await api.recordAction(userId, actionType, 'whop');
        if (result) {
            return `Webhook success: Awarded ${result.xpGained} XP to ${result.username} for subscription renewal.`;
        }
        return 'Webhook failed: User or action not found.';
    },
    
    buyStreakFreeze: async (userId: string): Promise<{ success: boolean; message: string; }> => {
        await delay(500);
        const user = mockDatabase.users.find(u => u.id === userId);
        if (!user) {
            return { success: false, message: 'User not found.' };
        }
        if (user.xp < STREAK_FREEZE_COST) {
            return { success: false, message: 'Not enough XP!' };
        }

        user.xp -= STREAK_FREEZE_COST;
        user.streakFreezes += 1;
        
        return { success: true, message: 'Streak Freeze purchased!' };
    },

    claimQuestReward: async (userId: string, questId: string): Promise<{ success: boolean; message: string }> => {
        await delay(500);
        const user = mockDatabase.users.find(u => u.id === userId);
        const quest = mockDatabase.quests.find(q => q.id === questId);
        const progress = (mockDatabase.userQuestProgress[userId] || []).find(p => p.questId === questId);

        if (!user || !quest || !progress || !progress.completed || progress.claimed) {
            return { success: false, message: 'Reward cannot be claimed.' };
        }
        
        progress.claimed = true;
        user.xp += quest.xpReward;
        if (quest.badgeReward) {
            const badgeInfo = mockDatabase.badges[quest.badgeReward];
            if (badgeInfo && !user.badges.some(b => b.name === quest.badgeReward)) {
                 user.badges.push({ id: `badge_${Date.now()}`, name: quest.badgeReward, ...badgeInfo });
            }
        }
        
        return { success: true, message: `Quest complete! +${quest.xpReward} XP`};
    },
};