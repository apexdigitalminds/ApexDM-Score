"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Reward, Badge, Quest, StoreItem, Profile, Action, Community, QuestTask, AnalyticsData, UserQuestProgress, ActiveEffect, UserInventoryItem, BadgeConfig, ActionType } from "@/types";
import { api } from "@/services/api";
import { whopApi } from "@/services/whopApi";

export interface AppContextValue {
  selectedUser: Profile | null;
  isLoading: boolean;
  community: Community | null;
  isWhopConnected: boolean;
  
  // AUTH FUNCTIONS DISABLED FOR WHOP EMBED
  // connectWhop: () => Promise<void>;
  // signOut: () => Promise<void>;

  allUsers: Profile[];
  getUserById: (id: string) => Promise<Profile | null>;
  getUserActions: (userId: string) => Promise<Action[]>;
  getUserItemUsage: (userId: string) => Promise<any[]>;
  getAllUserActions: (userId: string) => Promise<Action[]>;
  fetchAllUsers: () => Promise<void>;
  adminUpdateUserRole: (userId: string, role: "member" | "admin") => Promise<{ success: boolean; message: string }>;
  adminBanUser: (userId: string, durationHours: number | null) => Promise<{ success: boolean; message: string }>;
  adminGetUserEmail: (userId: string) => Promise<string | null>;
  adminUpdateCommunityTier: (newTier: "Core" | "Pro" | "Elite") => Promise<boolean>;
  adminUpdateUserStats: (userId: string, xp: number, streak: number, freezes: number) => Promise<{ success: boolean; message: string }>;
  rewardsConfig: Record<string, Reward>;
  badgesConfig: Record<string, BadgeConfig>;
  questsAdmin: Quest[];
  storeItems: StoreItem[];
  fetchRewards: () => Promise<void>;
  fetchBadges: () => Promise<void>;
  fetchQuests: () => Promise<void>;
  fetchStoreItems: () => Promise<void>;
  fetchUserQuestProgress: () => Promise<void>;
  handleAddReward: (reward: Partial<Reward>) => Promise<void>;
  handleUpdateReward: (actionType: string, data: { xpGained?: number, isActive?: boolean }) => Promise<void>;
  handleDeleteReward: (actionType: string) => Promise<void>;
  handleRestoreReward: (actionType: string) => Promise<void>;
  handleAddBadge: (badge: Partial<Badge>) => Promise<void>;
  handleUpdateBadge: (badgeName: string, data: Partial<Badge> & { isActive?: boolean }) => Promise<void>;
  handleDeleteBadge: (badgeName: string) => Promise<{ success: boolean; message: string }>;
  handleRestoreBadge: (badgeName: string) => Promise<{ success: boolean; message: string }>;
  handleCreateQuest: (quest: Partial<Quest>) => Promise<boolean>;
  handleUpdateQuest: (questId: string, data: Partial<Quest>) => Promise<boolean>;
  handleDeleteQuest: (questId: string) => Promise<boolean>;
  handleRestoreQuest: (questId: string) => Promise<{ success: boolean; message: string }>;
  handleToggleQuest: (questId: string, isActive: boolean) => Promise<void>;
  handleCreateStoreItem: (item: Partial<StoreItem>) => Promise<boolean>;
  handleUpdateStoreItem: (itemId: string, data: Partial<StoreItem>) => Promise<boolean>;
  handleDeleteStoreItem: (itemId: string) => Promise<{ success: boolean; message: string }>;
  handleToggleStoreItemActive: (itemId: string, isActive: boolean) => Promise<void>;
  handleRecordAction: (userId: string, actionType: ActionType, source?: 'manual' | 'whop' | 'discord') => Promise<{ xpGained: number } | null>;
  handleAwardBadge: (userId: string, badgeName: string) => Promise<{ success: boolean; message: string } | void>;
  handleTriggerWebhook: (userId: string, actionType: string) => Promise<string | null>;
  userQuestProgress: UserQuestProgress[];
  claimQuestReward: (progressId: number) => Promise<{ success: boolean; message: string }>;
  getUserInventory: (userId: string) => Promise<UserInventoryItem[]>;
  getActiveEffects: (userId: string) => Promise<ActiveEffect[]>;
  activateInventoryItem: (inventoryId: string) => Promise<{ success: boolean; message: string }>;
  handleBuyStoreItem: (userId: string, itemId: string) => Promise<{ success: boolean; message: string }>;
  isFeatureEnabled: (feature: string) => boolean;
  analyticsData: AnalyticsData | null;
  refreshAnalytics: (range?: "7d" | "30d") => Promise<void>;
  handleRestoreStoreItem: (itemId: string) => Promise<{ success: boolean; message: string }>;
  handleToggleWhiteLabel: (enabled: boolean) => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider = ({ 
    children, 
    verifiedUserId, 
    experienceId 
}: { 
    children: ReactNode, 
    verifiedUserId: string, 
    experienceId: string 
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

  /* // AUTH LOGIC DISABLED FOR WHOP EMBED
  const connectWhop = async () => { try { const url = await whopApi.authorize(); if (url) window.location.href = url; } catch (err) { console.error("Whop connection failed:", err); } };
  const signOut = async () => { localStorage.removeItem("whop_connected"); setIsWhopConnected(false); setSelectedUser(null); };
  */

  const fetchAllUsers = async () => { const users = await api.getUsers(); setAllUsers(users); };
  const fetchCommunity = async () => { const commData = await api.getCommunityInfo(); if (commData) setCommunity(commData); };
  
  const fetchRewards = async () => { 
      const config = await api.getRewardsConfig(); 
      setRewardsConfig(config as any); 
  };
  const fetchBadges = async () => { 
      const config = await api.getBadgesConfig(); 
      setBadgesConfig(config); 
  };
  const fetchQuests = async () => { const quests = await api.getQuestsAdmin(); setQuestsAdmin(quests); };
  const fetchStoreItems = async () => { const items = await api.getStoreItems(); setStoreItems(items); };
  const fetchUserQuestProgress = async () => { if (selectedUser) { const progress = await api.getUserQuestProgress(selectedUser.id); setUserQuestProgress(progress); } };

  const handleAddReward = async (reward: Partial<Reward>) => { if (!reward.actionType || reward.xpGained == null) return; await api.createReward(reward.actionType, reward.xpGained); await fetchRewards(); };
  const handleUpdateReward = async (actionType: string, data: { xpGained?: number, isActive?: boolean }) => { await api.updateReward(actionType, data); await fetchRewards(); };
  const handleDeleteReward = async (actionType: string) => { await api.deleteReward(actionType, true); await fetchRewards(); };
  const handleRestoreReward = async (actionType: string) => { await api.restoreReward(actionType); await fetchRewards(); };

  const handleAddBadge = async (badge: Partial<Badge>) => { if (!badge.name) return; const config = { name: badge.name, description: badge.description || '', icon: badge.icon || '', color: badge.color || '' }; await api.createBadge(badge.name, config); await fetchBadges(); };
  const handleUpdateBadge = async (badgeName: string, data: Partial<Badge> & { isActive?: boolean }) => { const config = { name: data.name ?? badgeName, description: data.description ?? "", icon: data.icon ?? "", color: data.color ?? "#ffffff" }; await api.updateBadge(badgeName, { ...config, isActive: data.isActive }); await fetchBadges(); };
  const handleDeleteBadge = async (badgeName: string) => { const result = await api.deleteBadge(badgeName, true); await fetchBadges(); return result; };
  const handleRestoreBadge = async (badgeName: string) => { const result = await api.restoreBadge(badgeName); await fetchBadges(); return result; };

  const handleCreateQuest = async (quest: Partial<Quest>) => { const success = await api.createQuest(quest as any); if (success) await fetchQuests(); return success; };
  const handleUpdateQuest = async (id: string, quest: Partial<Quest>) => { const success = await api.updateQuest(id, quest as any); if (success) await fetchQuests(); return success; };
  const handleDeleteQuest = async (id: string) => { const result = await api.deleteQuest(id); if (result.success) await fetchQuests(); return result.success; };
  const handleRestoreQuest = async (id: string) => { const result = await api.restoreQuest(id); await fetchQuests(); return result; };
  const handleToggleQuest = async (id: string, isActive: boolean) => { await api.updateQuestActiveStatus(id, isActive); await fetchQuests(); };

  const handleCreateStoreItem = async (item: Partial<StoreItem>) => { const success = await api.createStoreItem(item as any); if (success) await fetchStoreItems(); return success; };
  const handleUpdateStoreItem = async (id: string, item: Partial<StoreItem>) => { const success = await api.updateStoreItem(id, item as any); if (success) await fetchStoreItems(); return success; };
  const handleDeleteStoreItem = async (id: string) => { const result = await api.deleteStoreItem(id); if (result.success) await fetchStoreItems(); return result; };
  const handleToggleStoreItemActive = async (id: string, isActive: boolean) => { await api.updateStoreItemActiveStatus(id, isActive); await fetchStoreItems(); };
  const handleRestoreStoreItem = async (itemId: string) => {
      const result = await api.restoreStoreItem(itemId);
      await fetchStoreItems();
      return result;
  };

  const handleToggleWhiteLabel = async (enabled: boolean) => {
    setCommunity((prev) => (prev ? { ...prev, whiteLabelEnabled: enabled } : prev));
    const success = await api.updateCommunityBranding(enabled);
    if (!success) {
        console.error("Failed to save White Label setting");
        setCommunity((prev) => (prev ? { ...prev, whiteLabelEnabled: !enabled } : prev));
    }
  };

  const handleRecordAction = async (userId: string, actionType: ActionType, source: 'manual' | 'whop' | 'discord' = "manual") => { try { const result = await api.recordAction(userId, actionType, source); if (selectedUser && userId === selectedUser.id) await fetchUserQuestProgress(); return result; } catch (err) { return null; } };
  const handleAwardBadge = async (userId: string, badgeName: string) => { const res = await api.awardBadge(userId, badgeName); return res ? { success: false, message: "Failed" } : { success: true, message: "Awarded" }; };
  const handleTriggerWebhook = async (userId: string, actionType: string) => { return await api.triggerWebhook(userId, actionType); };
  
  const adminUpdateUserRole = async (userId: string, role: "member" | "admin") => { return await api.adminUpdateUserRole(userId, role); };
  const adminBanUser = async (userId: string, h: number | null) => { return await api.adminBanUser(userId, h); };
  const adminGetUserEmail = async (userId: string) => { return await api.adminGetUserEmail(userId); };
  const adminUpdateCommunityTier = async (newTier: "Core" | "Pro" | "Elite") => { const success = await api.adminUpdateCommunityTier(newTier); if (success) setCommunity((prev) => prev ? { ...prev, tier: newTier } : prev); return success; };
  const adminUpdateUserStats = async (userId: string, xp: number, streak: number, freezes: number) => { return await api.adminUpdateUserStats(userId, xp, streak, freezes); };

  const claimQuestReward = async (id: number) => { const res = await api.claimQuestReward(id); if (res.success) await fetchUserQuestProgress(); return res; };
  const activateInventoryItem = async (id: string) => { return await api.activateInventoryItem(id); };
  const handleBuyStoreItem = async (uid: string, iid: string) => { return await api.buyStoreItem(uid, iid); };
  const refreshAnalytics = async (range: "7d" | "30d" = "30d") => { const data = await api.getAnalyticsData(range); setAnalyticsData(data); };

  // -------------------------------
  // FEATURE GATING
  // -------------------------------
  const isFeatureEnabled = (feature: string) => {
    const f = feature.toLowerCase();
    if (community?.trialEndsAt) {
       if (new Date(community.trialEndsAt) > new Date()) return true; 
    }
    const tierValue = (community?.tier || "free").toLowerCase();
    if (f === 'dashboard') return true;
    if (tierValue === 'elite') return true;
    if (tierValue === 'pro') {
        const eliteFeatures = ['store', 'retention', 'inventory', 'white_label'];
        return !eliteFeatures.includes(f);
    }
    if (tierValue === 'core') {
        const coreFeatures = ['badges', 'leaderboard', 'manual_actions', 'engagement', 'dashboard']; 
        return coreFeatures.includes(f);
    }
    return false;
  };

  // -------------------------------
  // INITIALIZATION / AUTH (UPDATED)
  // -------------------------------
  useEffect(() => {
    const initAuth = async () => {
      // 1. TRACER LOG
      console.log("🟢 AppProvider Mounted via layout prop");
      console.log("👉 Verified User ID:", verifiedUserId);

      let user = null;

      if (verifiedUserId && verifiedUserId !== "GUEST") {
         // 泙 PROD/VERIFIED: Use the ID passed from the server
         console.log("🔍 Fetching user profile for:", verifiedUserId);
         user = await api.getUserByWhopId(verifiedUserId);
         console.log("✅ User profile result:", user);
      } else if (process.env.NODE_ENV === 'development') {
          // 圦 DEV: Fallback logic (only if strict dev mode)
          console.log("⚠️ No valid verifiedUserId found (or GUEST).");
      }

      setSelectedUser(user);
      
      // We treat connection as true if we have a user
      setIsWhopConnected(!!user);
      
      await fetchCommunity();
      setIsLoading(false);
      console.log("🏁 initAuth finished. Loading set to false.");

      // Fetch initial data
      if (user) {
          fetchAllUsers(); fetchRewards(); fetchBadges(); fetchQuests(); fetchStoreItems();
      }
    };
    initAuth();
  }, [verifiedUserId]);

  useEffect(() => { if (selectedUser) fetchUserQuestProgress(); }, [selectedUser]);

  return (
    <AppContext.Provider
      value={{
        selectedUser, isLoading, community, isWhopConnected, 
        // connectWhop, // DISABLED
        // signOut, // DISABLED
        allUsers, getUserById: api.getUserById, getUserActions: api.getUserActions, getAllUserActions: api.getAllUserActions, fetchAllUsers,
        adminUpdateUserRole, adminBanUser, adminGetUserEmail, adminUpdateCommunityTier, adminUpdateUserStats,
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