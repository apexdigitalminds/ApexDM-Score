'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Profile,
  RewardAction,
  Badge,
  Quest,
  StoreItem,
  ActionLog,
  Community,
  APIResponse,
  QuestTask,
} from '@/types';

// ===================================
// 🔹 CONTEXT TYPE DEFINITION
// ===================================

interface AppContextValue {
  allUsers: Profile[];
  rewardsConfig: RewardAction[];
  badgesConfig: Badge[];
  questsAdmin: Quest[];
  storeItems: StoreItem[];
  community?: Community | null;

  // --- Reward Handlers ---
  handleAddReward: (reward: Partial<RewardAction>) => Promise<APIResponse<RewardAction>>;
  handleUpdateReward: (id: string, updates: Partial<RewardAction>) => Promise<APIResponse<RewardAction>>;
  handleDeleteReward: (id: string) => Promise<APIResponse<void>>;
  handleRestoreReward: (id: string) => Promise<APIResponse<void>>;

  // --- Badge Handlers ---
  handleAddBadge: (badge: Partial<Badge>) => Promise<APIResponse<Badge>>;
  handleUpdateBadge: (id: string, updates: Partial<Badge>) => Promise<APIResponse<Badge>>;
  handleDeleteBadge: (id: string) => Promise<APIResponse<void>>;
  handleRestoreBadge: (id: string) => Promise<APIResponse<void>>;

  // --- Quest Handlers ---
  handleCreateQuest: (quest: Partial<Quest>) => Promise<APIResponse<Quest>>;
  handleUpdateQuest: (id: string, updates: Partial<Quest>) => Promise<APIResponse<Quest>>;
  handleDeleteQuest: (id: string) => Promise<APIResponse<void>>;
  handleToggleQuest: (id: string, isActive: boolean) => Promise<APIResponse<void>>;

  // --- Store Item Handlers ---
  handleCreateStoreItem: (item: Partial<StoreItem>) => Promise<APIResponse<StoreItem>>;
  handleUpdateStoreItem: (id: string, updates: Partial<StoreItem>) => Promise<APIResponse<StoreItem>>;
  handleDeleteStoreItem: (id: string) => Promise<APIResponse<void>>;
  handleToggleStoreItemActive: (id: string, isAvailable: boolean) => Promise<APIResponse<void>>;

  // --- User Management ---
  adminUpdateUserStats: (userId: string, updates: Partial<Profile>) => Promise<APIResponse<void>>;
  adminUpdateUserRole: (userId: string, role: string) => Promise<APIResponse<void>>;
  adminBanUser: (userId: string, untilDate?: string) => Promise<APIResponse<void>>;
  adminGetUserEmail: (userId: string) => Promise<APIResponse<string>>;

  // --- Logs and Analytics ---
  getAllUserActions: (userId: string) => Promise<APIResponse<ActionLog[]>>;

  // --- Global ---
  refreshAllData: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

// ===================================
// 🔹 PROVIDER
// ===================================

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [rewardsConfig, setRewardsConfig] = useState<RewardAction[]>([]);
  const [badgesConfig, setBadgesConfig] = useState<Badge[]>([]);
  const [questsAdmin, setQuestsAdmin] = useState<Quest[]>([]);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [community, setCommunity] = useState<Community | null>(null);

  // -----------------------------------
  // INITIAL DATA LOAD
  // -----------------------------------
  const refreshAllData = async () => {
    const [users, rewards, badges, quests, store] = await Promise.all([
      supabase.from('profiles').select('*').order('xp', { ascending: false }),
      supabase.from('reward_actions').select('*').order('xp_gained', { ascending: false }),
      supabase.from('badges').select('*').order('created_at', { ascending: false }),
      supabase.from('quests').select('*').order('created_at', { ascending: false }),
      supabase.from('store_items').select('*').order('cost_xp', { ascending: true }),
    ]);

    if (users.data) setAllUsers(users.data);
    if (rewards.data) setRewardsConfig(rewards.data);
    if (badges.data) setBadgesConfig(badges.data);
    if (quests.data) setQuestsAdmin(quests.data);
    if (store.data) setStoreItems(store.data);
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  // ===================================
  // 🔸 REWARD HANDLERS
  // ===================================

  const handleAddReward = async (
    reward: Partial<RewardAction>
  ): Promise<APIResponse<RewardAction>> => {
    const { data, error } = await supabase
      .from('reward_actions')
      .insert(reward)
      .select()
      .single();

    if (error) return { success: false, message: error.message };
    setRewardsConfig(prev => [...prev, data]);
    return { success: true, data };
  };

  const handleUpdateReward = async (
    id: string,
    updates: Partial<RewardAction>
  ): Promise<APIResponse<RewardAction>> => {
    const { data, error } = await supabase
      .from('reward_actions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return { success: false, message: error.message };
    setRewardsConfig(prev => prev.map(r => (r.id === id ? data : r)));
    return { success: true, data };
  };

  const handleDeleteReward = async (id: string): Promise<APIResponse<void>> => {
    const { error } = await supabase.from('reward_actions').delete().eq('id', id);
    if (error) return { success: false, message: error.message };
    setRewardsConfig(prev => prev.filter(r => r.id !== id));
    return { success: true };
  };

  const handleRestoreReward = async (id: string): Promise<APIResponse<void>> => {
    const { error } = await supabase
      .from('reward_actions')
      .update({ is_archived: false })
      .eq('id', id);
    if (error) return { success: false, message: error.message };
    await refreshAllData();
    return { success: true };
  };

  // ===================================
  // 🔸 BADGE HANDLERS
  // ===================================

  const handleAddBadge = async (
    badge: Partial<Badge>
  ): Promise<APIResponse<Badge>> => {
    const { data, error } = await supabase.from('badges').insert(badge).select().single();
    if (error) return { success: false, message: error.message };
    setBadgesConfig(prev => [...prev, data]);
    return { success: true, data };
  };

  const handleUpdateBadge = async (
    id: string,
    updates: Partial<Badge>
  ): Promise<APIResponse<Badge>> => {
    const { data, error } = await supabase
      .from('badges')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) return { success: false, message: error.message };
    setBadgesConfig(prev => prev.map(b => (b.id === id ? data : b)));
    return { success: true, data };
  };

  const handleDeleteBadge = async (id: string): Promise<APIResponse<void>> => {
    const { error } = await supabase.from('badges').delete().eq('id', id);
    if (error) return { success: false, message: error.message };
    setBadgesConfig(prev => prev.filter(b => b.id !== id));
    return { success: true };
  };

  const handleRestoreBadge = async (id: string): Promise<APIResponse<void>> => {
    const { error } = await supabase
      .from('badges')
      .update({ is_archived: false })
      .eq('id', id);
    if (error) return { success: false, message: error.message };
    await refreshAllData();
    return { success: true };
  };

  // ===================================
  // 🔸 QUEST HANDLERS
  // ===================================

  const handleCreateQuest = async (
    quest: Partial<Quest>
  ): Promise<APIResponse<Quest>> => {
    const { data, error } = await supabase.from('quests').insert(quest).select().single();
    if (error) return { success: false, message: error.message };
    setQuestsAdmin(prev => [...prev, data]);
    return { success: true, data };
  };

  const handleUpdateQuest = async (
    id: string,
    updates: Partial<Quest>
  ): Promise<APIResponse<Quest>> => {
    const { data, error } = await supabase
      .from('quests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) return { success: false, message: error.message };
    setQuestsAdmin(prev => prev.map(q => (q.id === id ? data : q)));
    return { success: true, data };
  };

  const handleDeleteQuest = async (id: string): Promise<APIResponse<void>> => {
    const { error } = await supabase.from('quests').delete().eq('id', id);
    if (error) return { success: false, message: error.message };
    setQuestsAdmin(prev => prev.filter(q => q.id !== id));
    return { success: true };
  };

  const handleToggleQuest = async (
    id: string,
    isActive: boolean
  ): Promise<APIResponse<void>> => {
    const { error } = await supabase
      .from('quests')
      .update({ is_active: isActive })
      .eq('id', id);
    if (error) return { success: false, message: error.message };
    await refreshAllData();
    return { success: true };
  };

  // ===================================
  // 🔸 STORE ITEM HANDLERS
  // ===================================

  const handleCreateStoreItem = async (
    item: Partial<StoreItem>
  ): Promise<APIResponse<StoreItem>> => {
    const { data, error } = await supabase.from('store_items').insert(item).select().single();
    if (error) return { success: false, message: error.message };
    setStoreItems(prev => [...prev, data]);
    return { success: true, data };
  };

  const handleUpdateStoreItem = async (
    id: string,
    updates: Partial<StoreItem>
  ): Promise<APIResponse<StoreItem>> => {
    const { data, error } = await supabase
      .from('store_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) return { success: false, message: error.message };
    setStoreItems(prev => prev.map(i => (i.id === id ? data : i)));
    return { success: true, data };
  };

  const handleDeleteStoreItem = async (id: string): Promise<APIResponse<void>> => {
    const { error } = await supabase.from('store_items').delete().eq('id', id);
    if (error) return { success: false, message: error.message };
    setStoreItems(prev => prev.filter(i => i.id !== id));
    return { success: true };
  };

  const handleToggleStoreItemActive = async (
    id: string,
    isAvailable: boolean
  ): Promise<APIResponse<void>> => {
    const { error } = await supabase
      .from('store_items')
      .update({ is_available: isAvailable })
      .eq('id', id);
    if (error) return { success: false, message: error.message };
    await refreshAllData();
    return { success: true };
  };

  // ===================================
  // 🔸 USER MANAGEMENT
  // ===================================

  const adminUpdateUserStats = async (
    userId: string,
    updates: Partial<Profile>
  ): Promise<APIResponse<void>> => {
    const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
    if (error) return { success: false, message: error.message };
    await refreshAllData();
    return { success: true };
  };

  const adminUpdateUserRole = async (
    userId: string,
    role: string
  ): Promise<APIResponse<void>> => {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);
    if (error) return { success: false, message: error.message };
    await refreshAllData();
    return { success: true };
  };

  const adminBanUser = async (
    userId: string,
    untilDate?: string
  ): Promise<APIResponse<void>> => {
    const { error } = await supabase
      .from('profiles')
      .update({ banned_until: untilDate || null })
      .eq('id', userId);
    if (error) return { success: false, message: error.message };
    await refreshAllData();
    return { success: true };
  };

  const adminGetUserEmail = async (userId: string): Promise<APIResponse<string>> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single();

    if (error) return { success: false, message: error.message };
    return { success: true, data: data.username };
  };

  const getAllUserActions = async (
    userId: string
  ): Promise<APIResponse<ActionLog[]>> => {
    const { data, error } = await supabase
      .from('actions_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return { success: false, message: error.message };
    return { success: true, data };
  };

  // ===================================
  // 🔹 CONTEXT VALUE
  // ===================================

  const contextValue: AppContextValue = {
    allUsers,
    rewardsConfig,
    badgesConfig,
    questsAdmin,
    storeItems,
    community,
    handleAddReward,
    handleUpdateReward,
    handleDeleteReward,
    handleRestoreReward,
    handleAddBadge,
    handleUpdateBadge,
    handleDeleteBadge,
    handleRestoreBadge,
    handleCreateQuest,
    handleUpdateQuest,
    handleDeleteQuest,
    handleToggleQuest,
    handleCreateStoreItem,
    handleUpdateStoreItem,
    handleDeleteStoreItem,
    handleToggleStoreItemActive,
    adminUpdateUserStats,
    adminUpdateUserRole,
    adminBanUser,
    adminGetUserEmail,
    getAllUserActions,
    refreshAllData,
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

// ===================================
// 🔹 HOOK
// ===================================

export const useApp = (): AppContextValue => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
};
