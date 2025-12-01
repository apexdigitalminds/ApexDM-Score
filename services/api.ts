import { supabase } from './supabase';
import { 
    updateUserProfile, 
    buyStoreItemAction, 
    activateInventoryItemAction, 
    equipCosmeticAction, 
    unequipCosmeticAction,
    claimQuestRewardAction,
    adminCreateStoreItemAction,
    adminUpdateStoreItemAction,
    adminDeleteStoreItemAction,
    adminRestoreStoreItemAction,
    adminToggleStoreItemAction,
    adminUpdateUserStatsAction,
    adminUpdateUserRoleAction,
    adminBanUserAction,
    adminUpdateCommunityTierAction,
    adminAddRewardAction,
    adminUpdateRewardAction,
    adminDeleteRewardAction,
    adminRestoreRewardAction,
    adminAddBadgeAction,
    adminUpdateBadgeAction,
    adminDeleteBadgeAction,
    adminRestoreBadgeAction,
    adminCreateQuestAction,
    adminUpdateQuestAction,
    adminDeleteQuestAction,
    adminRestoreQuestAction,
    adminToggleQuestAction,
    recordActionServer,
    getAnalyticsDataServer, 
    syncUserAction,
    awardBadgeAction 
} from '@/app/actions';

import type {
    User, Action, Badge, RewardsConfig, BadgeConfig, BadgesConfig, Community, Quest, UserQuestProgress, QuestTask, AnalyticsData, StoreItem, UserInventoryItem, ActiveEffect, ActionType
} from '@/types';

// --- DATA TRANSFORMATION HELPERS ---
const profileFromSupabase = (data: any): User => {
    // 🟢 UPDATED: Handle manual badge array injection
    const badges: Badge[] = Array.isArray(data.badges) 
        ? data.badges 
        : (data.user_badges || [])
            .map((join: any) => (join.badges ? badgeFromSupabase(join.badges) : null))
            .filter((b: Badge | null): b is Badge => b !== null);

    return {
        id: data.id,
        communityId: data.community_id,
        username: data.username,
        avatarUrl: data.avatar_url,
        xp: data.xp,
        streak: data.streak,
        streakFreezes: data.streak_freezes,
        last_action_date: data.last_action_date,
        role: data.role,
        whopUser: data.whop_user_id ? { id: data.whop_user_id, username: data.username } : undefined,
        bannedUntil: data.banned_until,
        badges, // Now populated correctly
        level: Math.floor((data.xp ?? 0) / 100),
        metadata: data.metadata || {}, 
    };
};

const actionFromSupabase = (data: any): Action => ({
    id: data.id,
    userId: data.user_id,
    communityId: data.community_id,
    actionType: data.action_type,
    xpGained: data.xp_gained ?? 0,
    createdAt: data.created_at,
    source: data.source,
});

const badgeFromSupabase = (data: any): Badge => ({
  id: data.id,
  name: data.name,
  description: data.description,
  icon: data.icon,
  color: data.color,
  communityId: data.community_id ?? "",
  isActive: data.is_active ?? !data.is_archived,
  isArchived: data.is_archived
});

const questFromSupabase = (data: any): Quest => ({
    id: data.id,
    communityId: data.community_id ?? "",
    title: data.title,
    description: data.description,
    tasks: (data.quest_tasks || []).map((task: any): QuestTask => ({
        id: task.id ?? "",
        questId: task.quest_id ?? "",
        actionType: task.action_type,
        targetCount: task.target_count,
        description: task.description,
    })),
    xpReward: data.xp_reward,
    badgeReward: data.badges ? data.badges.name : null,
    badgeRewardId: data.badge_reward_id,
    isActive: data.is_active,
    isArchived: data.is_archived,
});

const userQuestProgressFromSupabase = (data: any): UserQuestProgress => ({
    id: data.id,
    userId: data.user_id ?? "",
    questId: data.quest_id,
    progress: data.progress,
    completed: data.is_completed,
    isClaimed: data.is_claimed,
});

const storeItemFromSupabase = (data: any): StoreItem => ({
    id: data.id,
    communityId: data.community_id ?? "",
    name: data.name,
    description: data.description,
    cost: data.cost_xp,
    icon: data.icon,
    isActive: data.is_available,
    isArchived: data.is_archived,
    itemType: data.item_type,
    durationHours: data.duration_hours,
    modifier: data.modifier,
    metadata: data.metadata || {}, 
});

const inventoryItemFromSupabase = (data: any): UserInventoryItem => ({
    id: data.id,
    userId: data.user_id,
    itemId: data.item_id,
    purchasedAt: data.purchased_at,
    itemDetails: data.store_items ? storeItemFromSupabase(data.store_items) : undefined,
    isActive: data.is_active ?? false,
});

const activeEffectFromSupabase = (data: any): ActiveEffect => ({
    id: data.id,
    userId: data.user_id,
    itemId: data.item_id ?? "",
    effectType: data.effect_type,
    modifier: data.modifier,
    expiresAt: data.expires_at,
});

let COMMUNITY_ID: string | null = null;
const getCommunityId = async () => {
    if (COMMUNITY_ID) return COMMUNITY_ID;
    const { data, error } = await supabase.from('communities').select('id').limit(1).single();
    if (error || !data) {
        throw new Error("A community must be configured in the database.");
    }
    COMMUNITY_ID = data.id;
    return COMMUNITY_ID;
};

const PROFILE_COLUMNS = 'id, community_id, username, avatar_url, xp, streak, streak_freezes, last_action_date, role, whop_user_id, banned_until, metadata';

export const api = {
    // READ
    getUsers: async (): Promise<User[]> => {
        const { data, error } = await supabase.from('profiles').select(PROFILE_COLUMNS).order('xp', { ascending: false });
        if (error) return [];
        return data.map(profileFromSupabase);
    },

    getUserById: async (userId: string): Promise<User | null> => {
        // 🟢 1. Get Profile
        const { data: profile, error } = await supabase.from('profiles').select(PROFILE_COLUMNS).eq('id', userId).single();
        if (error || !profile) return null;

        // 🟢 2. Manual Badge Fetch (Robust against missing FKs)
        const { data: userBadges } = await supabase.from('user_badges').select('badge_id').eq('user_id', userId);
        const badgeIds = userBadges?.map((ub: any) => ub.badge_id) || [];
        
        let badges: Badge[] = [];
        if (badgeIds.length > 0) {
            const { data: badgeDefs } = await supabase.from('badges').select('*').in('id', badgeIds);
            badges = (badgeDefs || []).map(badgeFromSupabase);
        }

        // 🟢 3. Stitch and Return
        // We temporarily attach the fetched badges array to the raw profile data 
        // so profileFromSupabase can pick it up
        (profile as any).badges = badges; 
        
        return profileFromSupabase(profile);
    },

    getUserByWhopId: async (whopId: string, whopRole: "admin" | "member" = "member"): Promise<User | null> => {
        const userData = await syncUserAction(whopId, whopRole);
        if (userData) return profileFromSupabase(userData);
        return null;
    },

    getCurrentUserProfile: async (): Promise<User | null> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        return await api.getUserById(user.id);
    },

    getUserActions: async (userId: string): Promise<Action[]> => {
        const { data, error } = await supabase.from('actions_log').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20);
        if (error) return [];
        return data.map(actionFromSupabase);
    },

    getAllUserActions: async (userId: string): Promise<Action[]> => {
         const { data, error } = await supabase.from('actions_log').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        if (error) return [];
        return data.map(actionFromSupabase);
    },

    // CONFIGS
    getRewardsConfig: async (): Promise<RewardsConfig> => {
        const { data, error } = await supabase.from('reward_actions').select('action_type, xp_gained, is_archived, is_active'); 
        if (error) return {};
        return data.reduce((acc, r) => ({ ...acc, [r.action_type]: { xpGained: r.xp_gained, isArchived: r.is_archived, isActive: r.is_active } }), {} as any);
    },

    getBadgesConfig: async (): Promise<BadgesConfig> => {
        const communityId = await getCommunityId();
        const { data, error } = await supabase.from('badges').select('*').eq('community_id', communityId);
        if (error || !data) return {};
        return data.reduce((acc, b) => ({ ...acc, [b.name]: { name: b.name, description: b.description, icon: b.icon, color: b.color, isArchived: b.is_archived, isActive: b.isActive } }), {} as any);
    },

    getCommunityInfo: async (): Promise<Community | null> => {
        try {
            const id = await getCommunityId();
            const { data } = await supabase.from('communities').select('*').eq('id', id).single();
            if (!data) return null;
            return { id: data.id, name: data.name, description: data.description, logoUrl: data.logo_url, tier: data.subscription_tier ?? "Free", trialEndsAt: data.trial_ends_at, whiteLabelEnabled: data.white_label_enabled ?? false };
        } catch (e) { return null; }
    },

    updateCommunityBranding: async (enabled: boolean) => { 
        const communityId = await getCommunityId();
        const { error } = await supabase.from('communities').update({ white_label_enabled: enabled }).eq('id', communityId);
        return !error;
    },

    // QUESTS
    getQuests: async (): Promise<Quest[]> => {
        const { data } = await supabase.from('quests').select('*, quest_tasks(*)').eq('is_active', true).eq('is_archived', false).order('created_at');
        return (data || []).map(questFromSupabase);
    },
    getQuestsAdmin: async (): Promise<Quest[]> => {
        const { data } = await supabase.from('quests').select('*, quest_tasks(*)').order('created_at', { ascending: false });
        return (data || []).map(questFromSupabase);
    },
    getUserQuestProgress: async (userId: string): Promise<UserQuestProgress[]> => {
        const { data } = await supabase.from('user_quest_progress').select('*').eq('user_id', userId);
        return (data || []).map(userQuestProgressFromSupabase);
    },

    // STORE
    getStoreItems: async (): Promise<StoreItem[]> => {
        const { data } = await supabase.from('store_items').select('*').order('cost_xp'); 
        return (data || []).map(storeItemFromSupabase);
    },
    getUserItemUsage: async (userId: string) => {
        const { data } = await supabase.from('item_usage_logs').select('*').eq('user_id', userId).order('used_at', { ascending: false }).limit(5); 
        return data || [];
    },
    getUserInventory: async (userId: string): Promise<UserInventoryItem[]> => {
        const { data } = await supabase.from('user_inventory').select('*, store_items(*)').eq('user_id', userId).order('purchased_at');
        return (data || []).map(inventoryItemFromSupabase);
    },
    getActiveEffects: async (userId: string): Promise<ActiveEffect[]> => {
        const { data } = await supabase.from('user_active_effects').select('*').eq('user_id', userId).gt('expires_at', new Date().toISOString());
        return (data || []).map(activeEffectFromSupabase);
    },

    // --- WRITE OPERATIONS ---

    recordAction: async (userId: string, actionType: ActionType, source: 'manual' | 'whop' | 'discord') => {
        return await recordActionServer(userId, actionType, source);
    },

    awardBadge: async (userId: string, badgeName: string) => {
        if (!awardBadgeAction) {
            console.error("awardBadgeAction not found in imports");
            return { success: false, message: "Server action missing" };
        }
        return await awardBadgeAction(userId, badgeName);
    },

    // USER WRITE ACTIONS
    updateUserProfile: async (updates: { avatarUrl?: string; username?: string }, userId?: string) => {
        return await updateUserProfile(updates, userId);
    },
    
    buyStoreItem: async (userId: string, itemId: string) => {
        return await buyStoreItemAction(itemId);
    },
    
    activateInventoryItem: async (inventoryId: string) => {
        return await activateInventoryItemAction(inventoryId);
    },

    equipCosmetic: async (userId: string, item: StoreItem) => {
        return await equipCosmeticAction(item);
    },

    unequipCosmetic: async (userId: string, type: any) => {
        return await unequipCosmeticAction(type);
    },

    claimQuestReward: async (progressId: number) => {
        return await claimQuestRewardAction(progressId);
    },

    // ADMIN WRITE ACTIONS
    createStoreItem: async (itemData: any) => { return await adminCreateStoreItemAction(itemData); },
    updateStoreItem: async (itemId: string, itemData: any) => { return await adminUpdateStoreItemAction(itemId, itemData); },
    deleteStoreItem: async (itemId: string) => { return await adminDeleteStoreItemAction(itemId); },
    restoreStoreItem: async (itemId: string) => { return await adminRestoreStoreItemAction(itemId); },
    updateStoreItemActiveStatus: async (itemId: string, isActive: boolean) => { return await adminToggleStoreItemAction(itemId, isActive); },

    adminUpdateUserStats: async (userId: string, xp: number, streak: number, freezes: number) => {
        return await adminUpdateUserStatsAction(userId, xp, streak, freezes);
    },
    adminUpdateUserRole: async (userId: string, role: string) => {
        return await adminUpdateUserRoleAction(userId, role);
    },
    adminBanUser: async (userId: string, h: number | null) => {
        return await adminBanUserAction(userId, h);
    },

    // Mapped Admin Actions
    createReward: async (a: string, x: number) => { return await adminAddRewardAction(a, x); },
    updateReward: async (a: string, d: any) => { return await adminUpdateRewardAction(a, d); },
    deleteReward: async (a: string, b: boolean) => { return await adminDeleteRewardAction(a, b); },
    restoreReward: async (a: string) => { return await adminRestoreRewardAction(a); },

    createBadge: async (n: string, c: any) => { return await adminAddBadgeAction(n, c); },
    updateBadge: async (n: string, c: any) => { return await adminUpdateBadgeAction(n, c); },
    deleteBadge: async (n: string, b: boolean) => { return await adminDeleteBadgeAction(n, b); },
    restoreBadge: async (n: string) => { return await adminRestoreBadgeAction(n); },

    createQuest: async (d: any) => { return await adminCreateQuestAction(d); },
    updateQuest: async (id: string, d: any) => { return await adminUpdateQuestAction(id, d); },
    deleteQuest: async (id: string) => { return await adminDeleteQuestAction(id); },
    restoreQuest: async (id: string) => { return await adminRestoreQuestAction(id); },
    updateQuestActiveStatus: async (id: string, v: boolean) => { return await adminToggleQuestAction(id, v); },

    getAnalyticsData: async (dateRange: '7d' | '30d'): Promise<AnalyticsData | null> => {
        return await getAnalyticsDataServer(dateRange);
    },

    uploadAvatar: async (file: File, userId?: string) => {
        let targetId = userId;
        if (!targetId) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) targetId = user.id;
        }
        if (!targetId) return null;
        const fileExt = file.name.split('.').pop();
        const filePath = `${targetId}/${Math.random()}.${fileExt}`;
        const { error } = await supabase.storage.from('avatars').upload(filePath, file);
        if (error) return null;
        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        return data.publicUrl;
    },
    
    adminGetUserEmail: async () => null,
    adminUpdateCommunityTier: async (tier: any) => { return await adminUpdateCommunityTierAction(tier); },
    
    triggerWebhook: async (userId: string, actionType: string) => {
         return api.recordAction(userId, actionType as ActionType, 'whop').then(result =>
            result ? `Webhook simulated.` : "Failed."
         );
    },
};