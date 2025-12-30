"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Reward, Badge, Quest, StoreItem, Profile, Action, Community, AnalyticsData, UserQuestProgress, ActiveEffect, UserInventoryItem, BadgeConfig, ActionType } from "@/types";
import { api, setApiContext } from "@/services/api"; // 🟢 FIX: Import setApiContext

export interface AppContextValue {
    selectedUser: Profile | null;
    isLoading: boolean;
    community: Community | null;
    isWhopConnected: boolean;
    experienceId: string; // 🟢 FIX: Added for navigation URLs

    allUsers: Profile[];
    getUserById: (id: string) => Promise<Profile | null>;
    getUserActions: (userId: string) => Promise<Action[]>;
    getUserItemUsage: (userId: string) => Promise<any[]>;
    getAllUserActions: (userId: string) => Promise<Action[]>;
    fetchAllUsers: () => Promise<void>;
    refreshSelectedUser: () => Promise<void>;
    fetchActiveEffects: () => Promise<void>;

    // Admin Actions
    adminUpdateUserRole: (userId: string, role: "member" | "admin") => Promise<{ success: boolean; message: string }>;
    adminBanUser: (userId: string, durationHours: number | null) => Promise<{ success: boolean; message: string }>;
    adminGetUserEmail: (userId: string) => Promise<string | null>;
    adminUpdateCommunityTier: (newTier: "Core" | "Pro" | "Elite") => Promise<boolean>;
    adminUpdateUserStats: (userId: string, xp: number, streak: number, freezes: number) => Promise<{ success: boolean; message: string }>;

    // Configs
    rewardsConfig: Record<string, Reward>;
    badgesConfig: Record<string, BadgeConfig>;
    questsAdmin: Quest[];
    storeItems: StoreItem[];

    // Fetchers
    fetchRewards: () => Promise<void>;
    fetchBadges: () => Promise<void>;
    fetchQuests: () => Promise<void>;
    fetchStoreItems: () => Promise<void>;
    fetchUserQuestProgress: () => Promise<void>;

    // Rewards
    handleAddReward: (reward: Partial<Reward>) => Promise<void>;
    // 🟢 UPDATED: Added actionType and description to type definition
    handleUpdateReward: (actionType: string, data: { xpGained?: number, isActive?: boolean, actionType?: string, description?: string }) => Promise<void>;
    handleDeleteReward: (actionType: string) => Promise<void>;
    handleRestoreReward: (actionType: string) => Promise<void>;

    // Badges
    handleAddBadge: (badge: Partial<Badge>) => Promise<void>;
    handleUpdateBadge: (badgeName: string, data: Partial<Badge> & { isActive?: boolean }) => Promise<void>;
    handleDeleteBadge: (badgeName: string) => Promise<{ success: boolean; message: string }>;
    handleRestoreBadge: (badgeName: string) => Promise<{ success: boolean; message: string }>;

    // Quests
    handleCreateQuest: (quest: Partial<Quest>) => Promise<boolean>;
    handleUpdateQuest: (questId: string, data: Partial<Quest>) => Promise<boolean>;
    handleDeleteQuest: (questId: string) => Promise<{ success: boolean; message: string }>;
    handleRestoreQuest: (questId: string) => Promise<{ success: boolean; message: string }>;
    handleToggleQuest: (questId: string, isActive: boolean) => Promise<void>;

    // Store
    handleCreateStoreItem: (item: Partial<StoreItem>) => Promise<boolean>;
    handleUpdateStoreItem: (itemId: string, data: Partial<StoreItem>) => Promise<boolean>;
    handleDeleteStoreItem: (itemId: string) => Promise<{ success: boolean; message: string }>;
    handleRestoreStoreItem: (itemId: string) => Promise<{ success: boolean; message: string }>;
    handleToggleStoreItemActive: (itemId: string, isActive: boolean) => Promise<void>;

    // Actions & Webhooks
    handleRecordAction: (userId: string, actionType: ActionType, source?: 'manual' | 'whop' | 'discord') => Promise<{ xpGained: number } | null>;
    handleAwardBadge: (userId: string, badgeName: string) => Promise<{ success: boolean; message: string }>;
    handleTriggerWebhook: (userId: string, actionType: string) => Promise<string | null>;

    // User Features
    userQuestProgress: UserQuestProgress[];
    claimQuestReward: (progressId: number) => Promise<{ success: boolean; message: string }>;
    getUserInventory: (userId: string) => Promise<UserInventoryItem[]>;
    getActiveEffects: (userId: string) => Promise<ActiveEffect[]>;
    activeEffects: ActiveEffect[];
    activateInventoryItem: (inventoryId: string) => Promise<{ success: boolean; message: string }>;
    handleBuyStoreItem: (userId: string, itemId: string) => Promise<{ success: boolean; message: string }>;

    // Utils
    isFeatureEnabled: (feature: string) => boolean;
    analyticsData: AnalyticsData | null;
    refreshAnalytics: (range?: "7d" | "30d") => Promise<void>;
    handleToggleWhiteLabel: (enabled: boolean) => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider = ({
    children,
    verifiedUserId,
    experienceId,
    verifiedRole = "member"
}: {
    children: ReactNode,
    verifiedUserId: string,
    experienceId: string,
    verifiedRole?: "admin" | "member"
}) => {
    const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
    const [community, setCommunity] = useState<Community | null>(null);
    const [isWhopConnected, setIsWhopConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [allUsers, setAllUsers] = useState<Profile[]>([]);
    const [rewardsConfig, setRewardsConfig] = useState<Record<string, Reward>>({});
    const [badgesConfig, setBadgesConfig] = useState<Record<string, BadgeConfig>>({});
    const [questsAdmin, setQuestsAdmin] = useState<Quest[]>([]);
    const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
    const [userQuestProgress, setUserQuestProgress] = useState<UserQuestProgress[]>([]);
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [activeEffects, setActiveEffects] = useState<ActiveEffect[]>([]);

    const fetchAllUsers = async () => { const users = await api.getUsers(); setAllUsers(users); };
    const fetchCommunity = async () => {
        const commData = await api.getCommunityInfo();
        if (commData) {
            setCommunity(commData);
            setApiContext(commData.id); // 🟢 FIX: Set API context for multi-tenancy
        }
    };
    const fetchRewards = async () => { const config = await api.getRewardsConfig(); setRewardsConfig(config as any); };
    const fetchBadges = async () => { const config = await api.getBadgesConfig(); setBadgesConfig(config); };
    const fetchQuests = async () => { const quests = await api.getQuestsAdmin(); setQuestsAdmin(quests); };
    const fetchStoreItems = async () => { const items = await api.getStoreItems(); setStoreItems(items); };
    const fetchUserQuestProgress = async () => { if (selectedUser) { const progress = await api.getUserQuestProgress(selectedUser.id); setUserQuestProgress(progress); } };

    const fetchActiveEffects = async () => {
        if (selectedUser) {
            const effects = await api.getActiveEffects(selectedUser.id);
            setActiveEffects(effects);
        }
    };

    const refreshSelectedUser = async () => {
        if (selectedUser) {
            const fresh = await api.getUserById(selectedUser.id);
            if (fresh) setSelectedUser(fresh);
        }
    };

    // 🟢 AUTOMATED BADGE CHECKER
    const checkAutomatedBadges = async (userId: string) => {
        const user = await api.getUserById(userId);
        if (!user) return;

        const xpBadges = [
            { xp: 100, name: 'XP Novice' },
            { xp: 1000, name: 'XP Adept' },
            { xp: 5000, name: 'XP Veteran' },
            { xp: 10000, name: 'XP Master' }
        ];

        const streakBadges = [
            { streak: 3, name: '3 Day Streak' },
            { streak: 7, name: '7 Day Streak' },
            { streak: 30, name: '30 Day Streak' },
            { streak: 100, name: 'Century Club (100 Day Streak)' }
        ];

        let badgeAwarded = false;

        // Check XP Badges
        for (const badge of xpBadges) {
            if (user.xp >= badge.xp) {
                const hasBadge = user.badges?.some(b => b.name === badge.name);
                if (!hasBadge) {
                    console.log(`🏆 Auto-Awarding Badge: ${badge.name}`);
                    await api.awardBadge(userId, badge.name);
                    badgeAwarded = true;
                }
            }
        }

        // Check Streak Badges
        for (const badge of streakBadges) {
            if (user.streak >= badge.streak) {
                const hasBadge = user.badges?.some(b => b.name === badge.name);
                if (!hasBadge) {
                    console.log(`🔥 Auto-Awarding Streak Badge: ${badge.name}`);
                    await api.awardBadge(userId, badge.name);
                    badgeAwarded = true;
                }
            }
        }

        if (badgeAwarded) {
            await fetchAllUsers();
            if (selectedUser && userId === selectedUser.id) await refreshSelectedUser();
        }
    };

    const checkDailyLogin = async (user: Profile) => {
        const today = new Date().toDateString();
        const lastDate = user.last_action_date ? new Date(user.last_action_date).toDateString() : null;
        if (lastDate !== today) {
            console.log("📅 First login of the day! Awarding XP...");
            const result = await api.recordAction(user.id, 'daily_login', 'manual');
            if (result) {
                await checkAutomatedBadges(user.id); // Check badges after login
                await refreshSelectedUser();
            }
        }
    };

    const handleAddReward = async (reward: Partial<Reward>) => {
        if (!reward.actionType || reward.xpGained == null) return;
        // Pass description if available
        await api.createReward(reward.actionType, reward.xpGained);
        await fetchRewards();
    };

    // 🟢 UPDATED: Function implementation now passes full data object to API
    const handleUpdateReward = async (actionType: string, data: { xpGained?: number, isActive?: boolean, actionType?: string, description?: string }) => {
        await api.updateReward(actionType, data);
        await fetchRewards();
    };

    const handleDeleteReward = async (actionType: string) => { await api.deleteReward(actionType, true); await fetchRewards(); };
    const handleRestoreReward = async (actionType: string) => { await api.restoreReward(actionType); await fetchRewards(); };

    const handleAddBadge = async (badge: Partial<Badge>) => { if (!badge.name) return; const config = { name: badge.name, description: badge.description || '', icon: badge.icon || '', color: badge.color || '' }; await api.createBadge(badge.name, config); await fetchBadges(); };

    const handleUpdateBadge = async (badgeName: string, data: Partial<Badge> & { isActive?: boolean }) => {
        await api.updateBadge(badgeName, data);
        await fetchBadges();
    };

    const handleDeleteBadge = async (badgeName: string) => { const result = await api.deleteBadge(badgeName, true); await fetchBadges(); return { success: result.success, message: result.success ? "Badge deleted" : "Failed to delete badge" }; };
    const handleRestoreBadge = async (badgeName: string) => { const result = await api.restoreBadge(badgeName); await fetchBadges(); return { success: result.success, message: result.success ? "Badge restored" : "Failed to restore badge" }; };

    const handleCreateQuest = async (quest: Partial<Quest>) => { const success = await api.createQuest(quest as any); if (success) await fetchQuests(); return success; };
    const handleUpdateQuest = async (id: string, quest: Partial<Quest>) => { const success = await api.updateQuest(id, quest as any); if (success) await fetchQuests(); return success; };
    const handleToggleQuest = async (id: string, isActive: boolean) => { await api.updateQuestActiveStatus(id, isActive); await fetchQuests(); };
    const handleDeleteQuest = async (id: string) => { const result = await api.deleteQuest(id); if (result.success) await fetchQuests(); return { success: result.success, message: result.success ? "Quest deleted" : "Failed to delete quest" }; };
    const handleRestoreQuest = async (id: string) => { const result = await api.restoreQuest(id); await fetchQuests(); return { success: result.success, message: result.success ? "Quest restored" : "Failed to restore quest" }; };

    const handleCreateStoreItem = async (item: Partial<StoreItem>) => { const success = await api.createStoreItem(item as any); if (success) await fetchStoreItems(); return success; };
    const handleUpdateStoreItem = async (id: string, item: Partial<StoreItem>) => { const success = await api.updateStoreItem(id, item as any); if (success) await fetchStoreItems(); return success; };
    const handleToggleStoreItemActive = async (id: string, isActive: boolean) => { await api.updateStoreItemActiveStatus(id, isActive); await fetchStoreItems(); };
    const handleDeleteStoreItem = async (id: string) => { const result = await api.deleteStoreItem(id); if (result.success) await fetchStoreItems(); return { success: result.success, message: result.success ? "Item deleted" : "Failed to delete item" }; };
    const handleRestoreStoreItem = async (itemId: string) => { const result = await api.restoreStoreItem(itemId); await fetchStoreItems(); return { success: result.success, message: result.success ? "Item restored" : "Failed to restore item" }; };

    const handleToggleWhiteLabel = async (enabled: boolean) => {
        setCommunity((prev) => (prev ? { ...prev, whiteLabelEnabled: enabled } : prev));
        const success = await api.updateCommunityBranding(enabled);
        if (!success) { console.error("Failed to save White Label setting"); setCommunity((prev) => (prev ? { ...prev, whiteLabelEnabled: !enabled } : prev)); }
    };

    const handleRecordAction = async (userId: string, actionType: ActionType, source: 'manual' | 'whop' | 'discord' = "manual") => {
        try {
            const result = await api.recordAction(userId, actionType, source);
            await checkAutomatedBadges(userId);
            if (selectedUser && userId === selectedUser.id) { await fetchUserQuestProgress(); await refreshSelectedUser(); }
            await fetchAllUsers();
            return result;
        } catch (err) { return null; }
    };

    const handleAwardBadge = async (userId: string, badgeName: string) => {
        try {
            const res = await api.awardBadge(userId, badgeName);
            await fetchAllUsers();
            if (selectedUser && userId === selectedUser.id) await refreshSelectedUser();
            return res ? { success: true, message: "Badge Awarded" } : { success: false, message: "Failed to award" };
        } catch (e) {
            return { success: false, message: "Error awarding badge" };
        }
    };

    const handleTriggerWebhook = async (userId: string, actionType: string) => { return await (api as any).triggerWebhook(userId, actionType); };

    const adminUpdateUserRole = async (userId: string, role: "member" | "admin") => { const res = await api.adminUpdateUserRole(userId, role); return { success: res.success, message: res.success ? "Role updated" : "Failed" }; };
    const adminBanUser = async (userId: string, h: number | null) => { const res = await api.adminBanUser(userId, h); return { success: res.success, message: res.success ? "Updated" : "Failed" }; };
    const adminGetUserEmail = async (userId: string) => { return await (api as any).adminGetUserEmail(userId); };
    const adminUpdateCommunityTier = async (newTier: "Core" | "Pro" | "Elite") => { const success = await api.adminUpdateCommunityTier(newTier); if (success) setCommunity((prev) => prev ? { ...prev, tier: newTier } : prev); return success; };
    const adminUpdateUserStats = async (userId: string, xp: number, streak: number, freezes: number) => {
        const res = await api.adminUpdateUserStats(userId, xp, streak, freezes);
        await checkAutomatedBadges(userId);
        await fetchAllUsers();
        if (selectedUser && userId === selectedUser.id) await refreshSelectedUser();
        return { success: res.success, message: res.success ? "Updated" : "Failed" };
    };

    const claimQuestReward = async (id: number) => {
        const res = await api.claimQuestReward(id);
        if (res.success) {
            if (selectedUser) await checkAutomatedBadges(selectedUser.id);
            await fetchUserQuestProgress(); await refreshSelectedUser(); await fetchAllUsers();
        }
        return res;
    };

    const activateInventoryItem = async (id: string) => {
        const res = await api.activateInventoryItem(id);
        if (res.success) {
            if (selectedUser) await checkAutomatedBadges(selectedUser.id);
            await refreshSelectedUser(); await fetchActiveEffects();
        }
        return res;
    };

    const handleBuyStoreItem = async (uid: string, iid: string) => {
        const res = await api.buyStoreItem(uid, iid);
        if (res.success) { await refreshSelectedUser(); await fetchAllUsers(); await fetchStoreItems(); }
        return res;
    };

    const refreshAnalytics = async (range: "7d" | "30d" = "30d") => { const data = await api.getAnalyticsData(range); setAnalyticsData(data); };

    const isFeatureEnabled = (feature: string) => {
        const f = feature.toLowerCase();
        if (community?.trialEndsAt) { if (new Date(community.trialEndsAt) > new Date()) return true; }
        const tierValue = (community?.tier || "free").toLowerCase();
        if (f === 'dashboard') return true;
        if (tierValue === 'elite') return true;
        if (tierValue === 'pro') { return !['store', 'retention', 'inventory', 'white_label'].includes(f); }
        if (tierValue === 'core') { return ['badges', 'leaderboard', 'manual_actions', 'engagement', 'dashboard'].includes(f); }
        return false;
    };

    useEffect(() => {
        const initAuth = async () => {
            let user = null;
            if (verifiedUserId && verifiedUserId !== "GUEST") { user = await api.getUserByWhopId(verifiedUserId, verifiedRole); }
            setSelectedUser(user);
            setIsWhopConnected(!!user);
            await fetchCommunity();
            setIsLoading(false);
            if (user) { fetchAllUsers(); fetchRewards(); fetchBadges(); fetchQuests(); fetchStoreItems(); fetchActiveEffects(); checkDailyLogin(user); }
        };
        initAuth();
    }, [verifiedUserId, verifiedRole]);

    useEffect(() => { if (selectedUser) fetchUserQuestProgress(); }, [selectedUser]);

    return (
        <AppContext.Provider
            value={{
                selectedUser, isLoading, community, isWhopConnected, experienceId, // 🟢 FIX: Exposed to context
                allUsers, getUserById: api.getUserById, getUserActions: api.getUserActions, getAllUserActions: api.getAllUserActions, fetchAllUsers,
                adminUpdateUserRole, adminBanUser, adminGetUserEmail, adminUpdateCommunityTier, adminUpdateUserStats,
                refreshSelectedUser, fetchActiveEffects,
                rewardsConfig, badgesConfig, questsAdmin, storeItems,
                fetchRewards, fetchBadges, fetchQuests, fetchStoreItems, fetchUserQuestProgress,
                handleAddReward, handleUpdateReward, handleDeleteReward, handleRestoreReward,
                handleAddBadge, handleUpdateBadge, handleDeleteBadge, handleRestoreBadge,
                handleCreateQuest, handleUpdateQuest, handleDeleteQuest, handleRestoreQuest, handleToggleQuest,
                handleCreateStoreItem, handleUpdateStoreItem, handleDeleteStoreItem, handleToggleStoreItemActive, handleRestoreStoreItem,
                handleRecordAction, handleAwardBadge, handleTriggerWebhook,
                userQuestProgress, claimQuestReward, getUserInventory: api.getUserInventory, getActiveEffects: api.getActiveEffects, activateInventoryItem, handleBuyStoreItem,
                isFeatureEnabled, analyticsData, refreshAnalytics, getUserItemUsage: api.getUserItemUsage,
                handleToggleWhiteLabel,
                activeEffects,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("useApp must be used within an AppProvider");
    return context;
};