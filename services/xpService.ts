import type { User, ActionType, RewardsConfig, BadgeConfig } from '../types';

interface MockDb {
    users: {
        getById: (id: string) => User | null;
        update: (id: string, updates: Partial<User>) => void;
        addBadge: (id: string, badge: { name: string } & BadgeConfig) => void;
    };
    actions: {
        create: (actionData: { userId: string; actionType: ActionType; xpGained: number; source: 'manual' | 'whop' | 'discord' }) => void;
    };
}

export const recordAction = (
    db: MockDb,
    userId: string,
    actionType: ActionType,
    rewardsConfig: RewardsConfig,
    badgesConfig: { [key: string]: BadgeConfig },
    source: 'manual' | 'whop' | 'discord' = 'manual'
) => {
    console.log(`Recording action: ${actionType} for user: ${userId}`);
    const user = db.users.getById(userId);
    const reward = rewardsConfig[actionType];

    if (!user || !reward) {
        console.error('User or reward not found for action:', actionType);
        return null;
    }

    const now = new Date();
    const lastAction = user.lastActionDate ? new Date(user.lastActionDate) : null;
    
    let newStreak = user.streak;

    if (lastAction) {
        const hoursSinceLastAction = (now.getTime() - lastAction.getTime()) / (1000 * 3600);
        
        if (hoursSinceLastAction > 48) {
            newStreak = 1; // Reset streak
        } else if (now.toDateString() !== lastAction.toDateString()) {
            newStreak += 1; // Increment streak if action is on a new day
        }
    } else {
        newStreak = 1; // First action
    }

    const newXp = user.xp + reward.xp;

    db.users.update(userId, {
        xp: newXp,
        streak: newStreak,
        lastActionDate: now.toISOString(),
    });

    db.actions.create({
        userId,
        actionType,
        xpGained: reward.xp,
        source
    });
    
    // Check for badges
    if (reward.badge && !user.badges.some(b => b.name === reward.badge)) {
        const badgeInfo = badgesConfig[reward.badge];
        if (badgeInfo) {
            db.users.addBadge(userId, { name: reward.badge, ...badgeInfo });
        }
    }
    if (newStreak === 3 && !user.badges.some(b => b.name === 'Streak Starter')) {
        const badgeInfo = badgesConfig['Streak Starter'];
        if(badgeInfo) db.users.addBadge(userId, { name: 'Streak Starter', ...badgeInfo });
    }
    if (user.xp < 100 && newXp >= 100 && !user.badges.some(b => b.name === 'XP Novice')) {
        const badgeInfo = badgesConfig['XP Novice'];
        if(badgeInfo) db.users.addBadge(userId, { name: 'XP Novice', ...badgeInfo });
    }
    if (user.xp < 500 && newXp >= 500 && !user.badges.some(b => b.name === 'XP Adept')) {
        const badgeInfo = badgesConfig['XP Adept'];
        if(badgeInfo) db.users.addBadge(userId, { name: 'XP Adept', ...badgeInfo });
    }
    if (user.xp < 1000 && newXp >= 1000 && !user.badges.some(b => b.name === 'XP Veteran')) {
        const badgeInfo = badgesConfig['XP Veteran'];
        if(badgeInfo) db.users.addBadge(userId, { name: 'XP Veteran', ...badgeInfo });
    }
    if (user.xp < 1500 && newXp >= 1500 && !user.badges.some(b => b.name === 'XP Master')) {
        const badgeInfo = badgesConfig['XP Master'];
        if(badgeInfo) db.users.addBadge(userId, { name: 'XP Master', ...badgeInfo });
    }

    return { xpGained: reward.xp, newXp, newStreak };
};