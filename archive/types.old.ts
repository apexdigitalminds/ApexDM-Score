// =============================
// 🔷 CORE ENTITY TYPES
// =============================

export interface Community {
  id: string;
  name: string;
  logo_url?: string;
  theme_color?: string;
  subscription_tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  created_at: string;
  trial_ends_at?: string | null;
  is_active_subscription?: boolean;
  whop_company_id?: string | null;
  whop_store_id?: string | null;
  whop_scope?: string | null;
  whop_access_token?: string | null;
  whop_refresh_token?: string | null;
  whop_connected_at?: string | null;
  whop_expires_at?: string | null;
  whop_last_refreshed?: string | null;
  whop_token_type?: string | null;
}

// =============================
// 🔹 USER + PROFILE STRUCTURE
// =============================

export type UserRole = 'admin' | 'moderator' | 'customer';

export interface Profile {
  id: string;
  community_id: string;
  username: string;
  avatar_url?: string | null;
  role: UserRole;
  xp: number;
  streak: number;
  streak_freezes: number;
  last_action_date?: string | null;
  updated_at: string;
  banned_until?: string | null;
  whop_user_id?: string | null;
  discord_user_id?: string | null;
}

// =============================
// 🔹 ACTIONS, REWARDS, BADGES
// =============================

export interface RewardAction {
  id: string;
  community_id: string;
  action_type: string;
  description?: string | null;
  xp_gained: number;
  is_active: boolean;
  is_archived: boolean;
}

export interface ActionLog {
  id: number;
  user_id: string;
  community_id: string;
  action_type: string;
  xp_gained: number;
  source: string; // e.g. 'manual' | 'discord' | 'system'
  created_at: string;
}



export interface UserBadge {
  id: number;
  user_id: string;
  community_id: string;
  badge_id: string;
  earned_at: string;
}

// ---------------------------------------
// 👤 User — maps to Supabase table: profiles
// ---------------------------------------
export interface User {
  id: string;                 // uuid
  username: string;           // text
  communityId: string;        // uuid → communities.id
  xp: number;                 // integer
  streak: number;             // integer
  streakFreezes: number;      // integer
  lastActionDate?: string;    // timestamp
  avatarUrl?: string;         // text
  role: "admin" | "member" | "customer"; // text default 'customer'
  whopUserId?: string;        // text
  discordUserId?: string;     // text
  bannedUntil?: string | null; // timestamp nullable
  updatedAt?: string;         // timestamp
}



// ---------------------------------------
// 🏆 Reward — maps to Supabase table: reward_actions
// ---------------------------------------
export interface Reward {
  id: string;            // uuid
  communityId: string;   // uuid → communities.id
  actionType: string;    // text
  xpGained: number;      // integer (xp_gained)
  description?: string;  // optional text
  isActive: boolean;     // boolean
  isArchived: boolean;   // boolean
}

// =============================
// 🔹 QUEST SYSTEM
// =============================

export interface Quest {
  id: string;
  community_id: string;
  title: string;
  description?: string | null;
  xp_reward: number;
  badge_reward_id?: string | null;
  is_active: boolean;
  is_archived: boolean;
  created_at: string;
}

export interface QuestTask {
  id: string;
  quest_id: string;
  description?: string | null;
  action_type: string;
  target_count: number;
}

export interface UserQuestProgress {
  id: number;
  user_id: string;
  quest_id: string;
  progress: Record<string, number>; // jsonb
  is_completed: boolean;
  is_claimed: boolean;
  completed_at?: string | null;
  claimed_at?: string | null;
}

// ---------------------------------------
// 🧩 ActionType — defines valid action keys
// ---------------------------------------
export type ActionType =
  | 'login'
  | 'purchase'
  | 'quest_complete'
  | 'daily_checkin'
  | 'invite_friend'
  | 'post_message'
  | 'react_to_post'
  | 'other';

// =============================
// 🔹 STORE & INVENTORY SYSTEM
// =============================

export type ItemType = 'INSTANT' | 'EFFECT' | 'COLLECTIBLE';

export interface StoreItem {
  id: string;
  community_id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  item_type: ItemType;
  cost_xp: number;
  is_available: boolean;
  duration_hours?: number | null;
  modifier?: number | null;
  is_archived: boolean;
}

export interface UserInventoryItem {
  id: string;
  user_id: string;
  community_id: string;
  item_id: string;
  purchased_at: string;
}

export interface UserPurchase {
  id: number;
  user_id: string;
  community_id: string;
  item_id: string;
  cost_xp: number;
  purchased_at: string;
}

// =============================
// 🔹 ACTIVE EFFECTS SYSTEM
// =============================

export interface ActiveEffect {
  id: string;
  user_id: string;
  community_id: string;
  effect_type: string; // e.g., 'boost_xp', 'shield', etc.
  modifier?: number | null;
  expires_at: string;
  created_at: string;
}

// =============================
// 🔹 ANALYTICS & LEADERBOARD
// =============================

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  xp: number;
  streak: number;
  community_name?: string | null;
}

export interface RecentAction {
  action_id: number;
  user_id: string;
  community_id: string;
  username?: string | null;
  action_type: string;
  xp_gained: number;
  created_at: string;
}

export interface AnalyticsData {
  totalUsers: number;
  totalXP: number;
  activeQuests: number;
  completedQuests: number;
  badgesAwarded: number;
  storePurchases: number;
  averageXPPerUser: number;
}

// =============================
// 🔹 CONFIG + ENUMS
// =============================

export interface RewardsConfig {
  [actionType: string]: {
    xp_gained: number;
    description?: string;
  };
}

// ---------------------------------------
// 🪶 Action — represents a logged user XP event
// ---------------------------------------
export interface Action {
  id: number;                    // bigint
  userId: string;                // uuid
  communityId: string;           // uuid
  actionType: ActionType;        // text
  xpGained: number;              // integer
  source: string;                // text
  createdAt: string;             // timestamp
}

export interface QuestConfig {
  quest: Quest;
  tasks: QuestTask[];
}

export interface UserStats {
  xp: number;
  streak: number;
  streak_freezes: number;
  badges: UserBadge[];
  effects: ActiveEffect[];
  inventory: UserInventoryItem[];
  quests: UserQuestProgress[];
}

// =============================
// 🔹 API RESPONSE WRAPPERS
// =============================

export interface APIResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
