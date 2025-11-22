// ==========================================
// 📘 ApexDM Score - Global Types (Frontend)
// ==========================================

// ------------------------------------------------
// 🌐 Community ( Consolidated )
// ------------------------------------------------
export interface Community {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  tier: 'Free' | 'Core' | 'Pro' | 'Elite'; 
  trialEndsAt?: string | null; 
  createdAt?: string;
  whiteLabelEnabled?: boolean; // [NEW] Added for Elite White Labeling
}

// ------------------------------------------------
// 🪪 Whop Integration
// ------------------------------------------------
export interface WhopUser {
  id: string; // Whop user ID
  username: string;
  email?: string;
  membershipTier?: string;
  joinedAt?: string; // maps to Whop join date
}

// ------------------------------------------------
// 🧩 ActionType — defines valid action keys
// ------------------------------------------------
export type ActionType = 
  | 'login'
  | 'purchase'
  | 'quest_complete'
  | 'daily_checkin'
  | 'invite_friend'
  | 'post_message'
  | 'react_to_post'
  | 'watch_content'
  | 'other';

// ------------------------------------------------
// 🏆 RewardAction — represents earned rewards
// ------------------------------------------------
export interface RewardAction {
  id: string; // uuid
  communityId: string; // maps to communities.id
  userId: string; // maps to profiles.id
  actionType: ActionType;
  xpGained: number; // maps to xp_gained
  badgeId?: string | null;
  description?: string;
  createdAt?: string; // timestamp
}

// ------------------------------------------------
// 💎 Reward — base reward configuration
// ------------------------------------------------
export interface Reward {
  id: string;
  communityId: string;
  actionType: string;
  xpGained: number;
  description?: string;
  isActive: boolean;
  isArchived: boolean;
}

// ------------------------------------------------
// 🪶 Action — logged XP event (Supabase actions_log)
// ------------------------------------------------
export interface Action {
  id: number;
  userId: string;
  communityId: string;
  actionType: ActionType;
  xpGained: number;
  source: string;
  createdAt?: string;
}

// ------------------------------------------------
// 🧍 User / Profile
// ------------------------------------------------
export interface Profile {
  id: string;
  whopUser?: WhopUser; // optional Whop sync identity
  whop_user_id?: string | null;
  username: string;
  xp: number;
  streak: number;
  streakFreezes?: number;
  level: number;
  role: 'member' | 'moderator' | 'admin';
  communityId: string;
  joinedAt?: string;
  badges?: Badge[];
  activeEffects?: ActiveEffect[];
  last_action_date: string | null;
  avatarUrl?: string; // Moved from legacy module to main interface for safety
  bannedUntil?: string; // Moved from legacy module to main interface for safety
}

// ------------------------------------------------
// 🏅 Badge — unified model for database + UI
// ------------------------------------------------
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  communityId: string;
  isActive: boolean;   
  isArchived?: boolean; 
}

// ------------------------------------------------
// ⚙️ BadgeConfig
// ------------------------------------------------

export interface BadgeConfig {
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface BadgesConfig {
    [badgeName: string]: {
        name: string;
        description: string;
        icon: string;
        color: string;
    };
}

// ------------------------------------------------
// 🎯 Quest & Tasks
// ------------------------------------------------
export interface QuestTask {
  id: string;
  questId: string;
  actionType?: ActionType;
  targetCount?: number;
  description?: string;
}

export interface Quest {
  id: string;
  communityId: string;
  title: string;
  description?: string;
  xpReward: number;
  badgeRewardId?: string | null;
  tasks?: QuestTask[];
  isActive: boolean;
  isArchived?: boolean;
  createdAt?: string;
  badgeReward?: string | null; // Moved from legacy for easier access
}

// ------------------------------------------------
// 🧭 UserQuestProgress
// ------------------------------------------------
export interface UserQuestProgress {
  id: string;
  userId: string;
  questId: string;
  progress: Record<string, number>; // { actionType: count }
  isClaimed: boolean;
  updatedAt?: string;
  completed?: boolean; // Legacy alias support
  claimed?: boolean; // Legacy alias support
}

// ------------------------------------------------
// 🏪 Store Items & Inventory
// ------------------------------------------------
export interface StoreItem {
  id: string;
  communityId: string;
  name: string;
  description?: string;
  cost: number;
  icon: string;
  itemType: 'INSTANT' | 'TIMED_EFFECT';
  durationHours?: number;
  modifier?: number;
  isActive: boolean;
  isArchived?: boolean; 
  createdAt?: string;
}

export interface UserInventoryItem {
  id: string;
  userId: string;
  itemId: string;
  isActive: boolean;
  purchasedAt?: string;
  itemDetails?: StoreItem;
}

export interface ActiveEffect {
  id: string;
  userId: string;
  itemId: string;
  effectType: 'XP_BOOST' | 'STREAK_PROTECT' | string;
  modifier: number;
  expiresAt?: string; // maps to expires_at
}

// ------------------------------------------------
// 📊 Analytics
// ------------------------------------------------
export interface AnalyticsData {
  engagement: {
    activeMembers7d: number;
    activeMembers30d: number;
    avgDailyActions: number;
    xpEarnedToday: number;
  };
  growth: {
    newMembers7d: number;
    churnedMembers14d: number;
  };
  streakHealth: {
    percentWithActiveStreak: number;
    avgStreakLength: number;
  };
  topPerformers: {
    byXp: Profile[];
    byStreak: Profile[];
  };
  topXpActions: {
    actionType: ActionType;
    totalXp: number;
  }[];
  topBadges: {
    name: string;
    count: number;
    color: string;
    icon: string;
  }[];
  activityBreakdown: {
    label: string;
    value: number;
  }[];
  questAnalytics: {
    questId: string;
    title: string;
    participationRate: number;
    completionRate: number;
  }[];
  storeAnalytics: {
    totalItems: number;
    xpSpent: number;
    mostPopularItem: string;
    totalSpent: number; 
    items: { name: string; count: number }[];
  };
}

// ------------------------------------------------
// 🧱 General Configs
// ------------------------------------------------
export interface RewardsConfig {
  [actionType: string]: {
    xpGained: number;
    description?: string;
  };
}

export interface APIResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

// ==========================================
// 🧩 Legacy Compatibility Layer 
// ==========================================

// Alias old "User" to new Profile
export type User = Profile;

// Add minimal placeholder types for analytics components
export interface BadgeStat {
  name: string;
  icon: string;
  color: string;
  count: number;
  id?: string;
}

export interface ChartData {
  actionType: string;
  count: number;
}

// Keep temporary QuestData/StoreData used in analytics
export interface QuestData {
  questId?: string;
  title?: string;
  participationRate?: number;
  completionRate?: number;
}

export interface StoreData {
  totalItems: number;
  xpSpent: number;
  mostPopularItem: string;
  totalSpent?: number;
  items?: { name: string; count: number }[];
}