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
  subscriptionTier: 'bronze' | 'silver' | 'gold';
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
}

export interface UserQuestProgress {
  questId: string;
  progress: { [actionType: string]: number }; // e.g. { "log_trade": 3 }
  completed: boolean;
  claimed: boolean;
}