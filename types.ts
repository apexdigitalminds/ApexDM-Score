// FIX: Removed circular dependency import.
// import type { BadgeConfig as OriginalBadgeConfig } from './config/rewards';

export interface User {
  id: string; // This is the UUID from auth.users
  communityId: string;
  username: string;
  avatarUrl: string;
  xp: number;
  streak: number;
  streakFreezes: number;
  lastActionDate: string | null;
  badges: Badge[];
  role: 'admin' | 'member';
  whop_user_id?: string;
  bannedUntil?: string | null;
  created_at?: string; // For "Member since" display
}

export interface Action {
  id: number; // Changed from string to number for BIGSERIAL
  userId: string;
  communityId: string;
  actionType: ActionType;
  xpGained: number;
  timestamp: string;
  source: 'manual' | 'whop' | 'discord';
}

export type ActionType = string;

export interface Badge {
  id:string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

// FIX: This type had been removed, but is still used in BadgeShowcase.tsx. Re-adding it.
// FIX: Redefined BadgeConfig here to break a circular dependency and fix type errors.
export interface BadgeConfig {
  description: string;
  icon: string;
  color: string;
}


export interface Reward {
  xp: number;
  badge: string | null;
}

export interface RewardsConfig {
  [key: string]: Reward;
}

export interface Community {
  id: string;
  name: string;
  logoUrl: string;
  themeColor: 'blue' | 'purple' | 'green';
  whop_store_id?: string;
  subscriptionTier: 'starter' | 'core' | 'pro';
}

// --- New Quest Types ---

export interface QuestTask {
  actionType: ActionType;
  targetCount: number;
  description: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  tasks: QuestTask[];
  xpReward: number;
  badgeReward: string | null;
  isActive: boolean;
}

export interface UserQuestProgress {
  id: number;
  questId: string;
  progress: { [actionType: string]: number }; // e.g., { "log_trade": 3 }
  completed: boolean;
  claimed: boolean;
}

// --- New Store & Inventory Types ---
export interface StoreItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  isActive: boolean;
  itemType: 'INSTANT' | 'TIMED_EFFECT';
  durationHours?: number | null;
  modifier?: number | null;
}

export interface UserInventoryItem {
  id: string; // The unique ID of this inventory instance
  userId: string;
  itemId: string;
  purchasedAt: string;
  itemDetails: StoreItem; // Nested details of the store item
}

export interface ActiveEffect {
    id: string;
    userId: string;
    effectType: string; // e.g., 'XP_BOOST'
    modifier: number;
    expiresAt: string;
}


// --- New Analytics Types ---
export interface AnalyticsData {
  engagement: {
    activeMembers7d: number;
    activeMembers30d: number;
    avgDailyActions: number; // Simplified to Actions Today
    xpEarnedToday: number;
  };
  growth: {
    newMembers7d: number;
    churnedMembers14d: number; // Inactive for > 14 days
  };
  topPerformers: {
    byXp: User[];
    byStreak: User[];
  };
  activityBreakdown: {
    actionType: string;
    count: number;
    color?: string; // Color added for chart
  }[];
  streakHealth: {
    avgStreakLength: number;
    percentWithActiveStreak: number;
  };
  topXpActions: {
    actionType: string;
    totalXp: number;
  }[];
  topBadges: {
    name: string;
    count: number;
    icon: string;
    color: string;
  }[];
  questAnalytics: {
    questId: string;
    title: string;
    participationRate: number;
    completionRate: number;
  }[];
  storeAnalytics: {
    totalSpent: number;
    items: {
        name: string;
        count: number;
    }[];
  };
}