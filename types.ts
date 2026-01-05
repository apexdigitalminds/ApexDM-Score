// ==========================================
// 📘 ApexDM Score - Global Types (Fixed)
// ==========================================

// ------------------------------------------------
// 🧩 ActionType (Enum)
// ------------------------------------------------
export type ActionType =
  | 'daily_login'
  | 'complete_module'
  | 'watch_content'
  | 'post_comment'
  | 'attend_call'
  | 'renew_subscription'
  | 'referral'
  | 'feedback'
  | 'log_trade'
  | 'ask_good_question'
  | 'login'
  | 'purchase'
  | 'quest_complete'
  | 'daily_checkin'
  | 'invite_friend'
  | 'post_message'
  | 'react_to_post'
  | 'other';

// ------------------------------------------------
// 🪶 Action (Database Row) - THIS WAS MISSING
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
// 🎒 Items & Inventory (Cosmetics)
// ------------------------------------------------
export type ItemType =
  | 'INSTANT'
  | 'TIMED_EFFECT'
  | 'NAME_COLOR'
  | 'TITLE'
  | 'BANNER'
  | 'FRAME'
  | 'AVATAR_PULSE';

export interface ItemMetadata {
  color?: string;
  text?: string;
  titlePosition?: 'prefix' | 'suffix';
  imageUrl?: string;
  [key: string]: any;
}

export interface StoreItem {
  id: string;
  communityId: string;
  name: string;
  description?: string;
  cost: number;
  icon: string;
  isActive: boolean;
  isArchived: boolean;
  createdAt?: string;
  itemType: ItemType;
  durationHours?: number;
  modifier?: number;
  metadata?: ItemMetadata;
}

export interface UserInventoryItem {
  id: string;
  userId: string;
  itemId: string;
  isActive: boolean;
  purchasedAt?: string;
  itemDetails?: StoreItem;
  metadata?: ItemMetadata;
}

export interface ActiveEffect {
  id: string;
  userId: string;
  itemId: string;
  effectType: string;
  modifier: number;
  expiresAt?: string;
}

// ------------------------------------------------
// 🧍 User / Profile
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

export interface WhopUser {
  id: string;
  username: string;
  email?: string;
  membershipTier?: string;
  joinedAt?: string;
}

export interface Profile {
  id: string;
  whopUser?: WhopUser;
  whop_user_id?: string | null;
  username: string;
  xp: number;
  streak: number;
  streakFreezes: number;
  level: number;
  role: 'member' | 'moderator' | 'admin' | string;
  communityId: string;
  joinedAt?: string;
  last_action_date: string | null;
  avatarUrl?: string;
  bannedUntil?: string;
  badges?: Badge[];
  activeEffects?: ActiveEffect[];
  metadata?: {
    nameColor?: string;
    title?: string;
    titlePosition?: 'prefix' | 'suffix';
    bannerUrl?: string;
    frameUrl?: string;
    avatarPulseColor?: string;
    [key: string]: any;
  };
}

// ------------------------------------------------
// 🎯 Quest & Tasks
// ------------------------------------------------
export interface QuestTask {
  id: string;
  questId: string;
  actionType: ActionType | string;
  targetCount: number;
  description: string;
}

export interface Quest {
  id: string;
  communityId: string;
  title: string;
  description?: string;
  xpReward: number;
  badgeReward: string | null;
  badgeRewardId?: string;
  tasks: QuestTask[];
  isActive: boolean;
  isArchived: boolean;
  createdAt?: string;
}

export interface UserQuestProgress {
  id?: number;
  userId: string;
  questId: string;
  progress: Record<string, number>;
  isClaimed: boolean;
  completed: boolean;
  updatedAt?: string;
}

// ------------------------------------------------
// 🧱 General Configs & Analytics
// ------------------------------------------------
export interface Reward {
  xpGained: number;
  isActive: boolean;
  isArchived: boolean;
  actionType?: string;
}

export interface BadgeConfig {
  name?: string;
  description: string;
  icon: string;
  color: string;
  isActive?: boolean;
  isArchived?: boolean;
}

export type RewardsConfig = Record<string, Reward>;
export type BadgesConfig = Record<string, BadgeConfig>;

export interface Community {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  tier: 'Free' | 'Core' | 'Pro' | 'Elite' | 'trial'; // 🆕 Added 'trial' tier
  trialEndsAt?: string | null;
  trialUsed?: boolean; // 🆕 Track if user has used their trial
  createdAt?: string;
  whiteLabelEnabled?: boolean;
  // 🆕 White-Label Branding Fields (Phase 1 + 3)
  themeColor?: string;        // Hex color for primary accent (e.g., "#7c3aed")
  faviconUrl?: string;        // Custom favicon URL (separate from logo)
  customFooterText?: string;  // Replace "Powered by ApexDM" 
  hideMemberCount?: boolean;  // Hide member count in sidebar
}

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
// 🏗️ Legacy & Utility Types
// ------------------------------------------------
export type User = Profile; // Legacy alias

// Analytics Page Helper Types
export interface ChartData {
  label?: string;
  actionType?: string;
  value?: number;
  count?: number;
}
export interface QuestData { questId: string; title: string; participationRate: number; completionRate: number; }
export interface StoreData { totalItems: number; xpSpent: number; mostPopularItem: string; totalSpent: number; items: { name: string; count: number }[]; }
export interface APIResponse<T> { success: boolean; message?: string; data?: T; }