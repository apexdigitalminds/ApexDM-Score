import React, { createContext, useState, ReactNode, useContext, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import DashboardPage from './components/DashboardPage';
import AdminPage from './components/AdminPage';
import AnalyticsPage from './components/AnalyticsPage';
import WhopConnectPage from './components/WhopConnectPage';
import StorePage from './components/StorePage';
import ProfilePage from './components/ProfilePage';
import QuestsPage from './components/QuestsPage';
import CollectionPage from './components/CollectionPage';
import PricingPage from './components/PricingPage';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import LoginPage from './components/LoginPage';
import SignUpPage from './components/SignUpPage';
import { api, SignInCredentials, SignUpCredentials } from './services/api';
import type { User, Action, RewardsConfig, BadgeConfig, Community, Quest, UserQuestProgress, StoreItem, UserInventoryItem, ActiveEffect } from './types';
import { supabase } from './services/supabase';

// --- App Context Logic ---
type Feature = 'quests' | 'store' | 'analytics' | 'retention';
type Tier = 'starter' | 'core' | 'pro';

const FEATURE_TIERS: { [key in Feature]: Tier } = {
  quests: 'core',
  store: 'pro',
  analytics: 'core',
  retention: 'pro',
};

const TIER_HIERARCHY: { [key in Tier]: number } = {
  starter: 1,
  core: 2,
  pro: 3,
};

interface AppContextType {
  // State
  isLoading: boolean;
  allUsers: User[];
  selectedUser: User | null;
  rewardsConfig: RewardsConfig;
  badgesConfig: { [key: string]: BadgeConfig };
  isWhopConnected: boolean;
  community: Community | null;
  quests: Quest[];
  questsAdmin: Quest[];
  userQuestProgress: UserQuestProgress[];
  storeItems: StoreItem[];
  
  // Auth Actions
  signIn: (credentials: SignInCredentials) => Promise<any>;
  signUp: (credentials: SignUpCredentials) => Promise<any>;
  signOut: () => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<any>;

  // Data Actions
  getUserById: (userId: string) => Promise<User | null>;
  getUserActions: (userId: string) => Promise<Action[]>;
  handleRecordAction: (userId: string, actionType: string, source?: 'manual' | 'whop' | 'discord') => Promise<any>;
  handleAwardBadge: (userId: string, badgeName: string) => Promise<{success: boolean, message: string}>;
  handleAddReward: (actionName: string, xp: number) => Promise<void>;
  handleUpdateReward: (actionType: string, xp: number) => Promise<void>;
  handleDeleteReward: (actionType: string) => Promise<{success: boolean, message: string}>;
  handleAddBadge: (badgeName: string, config: BadgeConfig) => Promise<{ success: boolean; message?: string; }>;
  handleUpdateBadge: (badgeName: string, config: BadgeConfig) => Promise<void>;
  handleDeleteBadge: (badgeName: string) => Promise<{success: boolean, message: string}>;
  handleCreateQuest: (questData: Omit<Quest, 'id' | 'isActive'>) => Promise<boolean>;
  handleUpdateQuest: (questId: string, questData: Omit<Quest, 'id' | 'isActive'>) => Promise<boolean>;
  handleDeleteQuest: (questId: string) => Promise<boolean>;
  handleToggleQuest: (questId: string, isActive: boolean) => Promise<void>;
  handleCreateStoreItem: (itemData: Omit<StoreItem, 'id'>) => Promise<boolean>;
  handleUpdateStoreItem: (itemId: string, itemData: Omit<StoreItem, 'id'>) => Promise<boolean>;
  handleDeleteStoreItem: (itemId: string) => Promise<{success: boolean, message: string}>;
  handleToggleStoreItemActive: (itemId: string, isActive: boolean) => Promise<void>;
  updateUserProfile: (updates: { avatarUrl?: string }) => Promise<boolean>;
  connectWhop: () => Promise<void>;
  syncWhopMembers: () => Promise<string>;
  handleTriggerWebhook: (userId: string, actionType: string) => Promise<string | null>;
  isFeatureEnabled: (feature: Feature) => boolean;
  handleBuyStoreItem: (userId: string, itemId: string) => Promise<{ success: boolean; message: string; }>;
  claimQuestReward: (userId: string, questId: string) => Promise<{ success: boolean; message: string; }>;
  resetAppData: () => Promise<void>;
  // Inventory
  getUserInventory: (userId: string) => Promise<UserInventoryItem[]>;
  getActiveEffects: (userId: string) => Promise<ActiveEffect[]>;
  activateInventoryItem: (inventoryId: string) => Promise<{ success: boolean; message: string; }>;
  // Admin
  adminUpdateUserStats: (userId: string, xp: number, streak: number, freezes: number) => Promise<{ success: boolean; message: string; }>;
  adminUpdateUserRole: (userId: string, role: 'admin' | 'member') => Promise<{ success: boolean; message: string; }>;
  adminBanUser: (userId: string, duration: number | null) => Promise<{ success: boolean; message: string; }>;
  adminGetUserEmail: (userId: string) => Promise<string | null>;
  getAllUserActions: (userId: string) => Promise<Action[]>;
  adminUpdateCommunityTier: (tier: Tier) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [rewardsConfig, setRewardsConfig] = useState<RewardsConfig>({});
  const [badgesConfig, setBadgesConfig] = useState<{ [key: string]: BadgeConfig }>({});
  const [isWhopConnected, setIsWhopConnected] = useState(false);
  const [community, setCommunity] = useState<Community | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [questsAdmin, setQuestsAdmin] = useState<Quest[]>([]);
  const [userQuestProgress, setUserQuestProgress] = useState<UserQuestProgress[]>([]);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);

  const fetchStaticData = useCallback(async () => {
    try {
      const [rewards, badges, communityInfo, questsData, questsAdminData, storeItemsData] = await Promise.all([
        api.getRewardsConfig(),
        api.getBadgesConfig(),
        api.getCommunityInfo(),
        api.getQuests(),
        api.getQuestsAdmin(),
        api.getStoreItems(),
      ]);
      setRewardsConfig(rewards);
      setBadgesConfig(badges);
      setCommunity(communityInfo);
      setQuests(questsData);
      setQuestsAdmin(questsData);
      setStoreItems(storeItemsData);
    } catch (error) {
      console.error("Failed to fetch static data:", error);
    }
  }, []);

  const refreshDynamicData = useCallback(async () => {
    // This function refreshes data that changes frequently (users, progress)
    // without blocking the UI with a loading spinner, suitable for background updates.
    const [users, profile, questsData, questsAdminData, storeItemsData, communityInfo] = await Promise.all([
      api.getUsers(),
      api.getCurrentUserProfile(),
      api.getQuests(),
      api.getQuestsAdmin(),
      api.getStoreItems(),
      api.getCommunityInfo(),
    ]);
    setAllUsers(users);
    setSelectedUser(profile);
    setQuests(questsData);
    setQuestsAdmin(questsAdminData);
    setStoreItems(storeItemsData);
    setCommunity(communityInfo); // Also refresh community for tier changes
    if (profile) {
      const progress = await api.getUserQuestProgress(profile.id);
      setUserQuestProgress(progress);
    }
  }, []);
  
  const handleAuthChange = useCallback(async () => {
    // This function handles the full loading sequence on auth changes.
    setIsLoading(true);
    try {
        const [users, profile] = await Promise.all([
            api.getUsers(),
            api.getCurrentUserProfile(),
        ]);
        setAllUsers(users);
        setSelectedUser(profile);

        if (profile?.bannedUntil && new Date(profile.bannedUntil) > new Date()) {
             // If user is banned, force sign out and prevent further action
             await api.signOut();
             // The onAuthStateChange will trigger again, setting selectedUser to null.
             return;
        }

        if (profile) {
            const progress = await api.getUserQuestProgress(profile.id);
            setUserQuestProgress(progress);
        } else {
            setUserQuestProgress([]);
        }
    } catch (e) {
        console.error("Error handling auth change:", e);
        // Reset state on error
        setAllUsers([]);
        setSelectedUser(null);
        setUserQuestProgress([]);
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaticData(); // Fetch non-user-specific data

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Any change in auth state (sign in, sign out) triggers a full refresh
        // with a loading state to prevent race conditions.
        handleAuthChange();
      }
    );
    
    // Also run once on initial load to check for an existing session
    handleAuthChange();

    return () => {
      subscription?.unsubscribe();
    };
  }, [fetchStaticData, handleAuthChange]);

  const handleRecordAction = async (userId: string, actionType: string, source: 'manual' | 'whop' | 'discord' = 'manual') => {
    const result = await api.recordAction(userId, actionType, source);
    await refreshDynamicData(); // Refresh data
    return result;
  };

  const handleAwardBadge = async (userId: string, badgeName: string) => {
    const error = await api.awardBadge(userId, badgeName);
    if (error) {
        if (error.code === '23505') {
            return { success: false, message: `User already has the '${badgeName}' badge.` };
        }
        return { success: false, message: 'An unknown error occurred.' };
    }
    await refreshDynamicData();
    return { success: true, message: `Awarded '${badgeName}' badge.` };
  };

  const handleAddReward = async (actionName: string, xp: number) => {
    const formattedActionName = actionName.trim().toLowerCase().replace(/\s+/g, '_');
    if (formattedActionName) {
      await api.createReward(formattedActionName, xp);
      await fetchStaticData();
    }
  };
  
  const handleUpdateReward = async (actionType: string, xp: number) => {
    await api.updateReward(actionType, xp);
    await fetchStaticData();
  };

  const handleDeleteReward = async (actionType: string) => {
    const result = await api.deleteReward(actionType);
    if (result.success) {
        await fetchStaticData();
    }
    return result;
  };

  const handleAddBadge = async (badgeName: string, config: BadgeConfig): Promise<{ success: boolean; message?: string; }> => {
    if (badgeName.trim()) {
      const error = await api.createBadge(badgeName.trim(), config);
      if (!error) {
        await fetchStaticData();
        return { success: true };
      }
      return { success: false, message: error.code === '23505' ? `Badge "${badgeName}" already exists.` : 'Failed to create badge.' };
    }
    return { success: false, message: "Badge name cannot be empty." };
  };
  
  const handleUpdateBadge = async (badgeName: string, config: BadgeConfig) => {
      await api.updateBadge(badgeName, config);
      await fetchStaticData();
  };

  const handleDeleteBadge = async (badgeName: string) => {
      const result = await api.deleteBadge(badgeName);
      if (result.success) {
          await fetchStaticData();
      }
      return result;
  };

   const handleCreateQuest = async (questData: Omit<Quest, 'id' | 'isActive'>) => {
      const success = await api.createQuest(questData);
      if (success) await refreshDynamicData();
      return success;
  };

  const handleUpdateQuest = async (questId: string, questData: Omit<Quest, 'id' | 'isActive'>) => {
      const success = await api.updateQuest(questId, questData);
      if (success) await refreshDynamicData();
      return success;
  };

  const handleDeleteQuest = async (questId: string) => {
      const success = await api.deleteQuest(questId);
      if (success) await refreshDynamicData();
      return success;
  };
  
  const handleToggleQuest = async (questId: string, isActive: boolean) => {
      await api.updateQuestActiveStatus(questId, isActive);
      await refreshDynamicData();
  };

  const handleCreateStoreItem = async (itemData: Omit<StoreItem, 'id'>) => {
    const success = await api.createStoreItem(itemData);
    if (success) await refreshDynamicData();
    return success;
  };
  const handleUpdateStoreItem = async (itemId: string, itemData: Omit<StoreItem, 'id'>) => {
    const success = await api.updateStoreItem(itemId, itemData);
    if (success) await refreshDynamicData();
    return success;
  };
  const handleDeleteStoreItem = async (itemId: string) => {
    const result = await api.deleteStoreItem(itemId);
    if (result.success) {
      await refreshDynamicData();
    }
    return result;
  };
  const handleToggleStoreItemActive = async (itemId: string, isActive: boolean) => {
    await api.updateStoreItemActiveStatus(itemId, isActive);
    await refreshDynamicData();
  };
  
  const updateUserProfile = async (updates: { avatarUrl?: string }): Promise<boolean> => {
      if (!selectedUser) return false;

      const success = await api.updateUserProfile(updates);
      if (success && updates.avatarUrl) {
          // Optimistic update to avoid race conditions with DB replication
          const updatedUser = { ...selectedUser, avatarUrl: updates.avatarUrl };
          setSelectedUser(updatedUser);

          // Also update the user in the allUsers list for leaderboards, etc.
          setAllUsers(prevUsers => 
              prevUsers.map(u => u.id === selectedUser.id ? updatedUser : u)
          );
      }
      return success;
  };

  const connectWhop = async () => {
    const communityData = await api.getCommunityInfo();
    setCommunity(communityData);
    setIsWhopConnected(true);
  };
  
  const syncWhopMembers = async () => {
    const summary = await api.syncWhopMembers();
    await refreshDynamicData();
    return summary;
  };

  const handleTriggerWebhook = async (userId: string, actionType: string) => {
    const message = await api.triggerWebhook(userId, actionType);
    await refreshDynamicData();
    return message;
  };
  
  const isFeatureEnabled = (feature: Feature) => {
    if (!community?.subscriptionTier) return false;
    const requiredTier = FEATURE_TIERS[feature];
    const userTier = community.subscriptionTier;
    return TIER_HIERARCHY[userTier] >= TIER_HIERARCHY[requiredTier];
  };

  const handleBuyStoreItem = async (userId: string, itemId: string) => {
    const result = await api.buyStoreItem(userId, itemId);
    if(result.success) {
      await refreshDynamicData();
    }
    return result;
  };
  
  const claimQuestReward = async (userId: string, questId: string) => {
      const result = await api.claimQuestReward(userId, questId);
       if(result.success) {
            await refreshDynamicData();
        }
        return result;
  }
  
  const resetAppData = async () => {
    console.warn("Reset App Data is disabled.");
  };

  const activateInventoryItem = async (inventoryId: string) => {
    const result = await api.activateInventoryItem(inventoryId);
    if(result.success) {
      await refreshDynamicData();
    }
    return result;
  };

  const adminActionWrapper = async (action: Promise<{success: boolean; message: string;}>) => {
      const result = await action;
      if (result.success) {
          await refreshDynamicData();
      }
      return result;
  }
  
  const adminUpdateCommunityTier = async (tier: Tier) => {
    const success = await api.adminUpdateCommunityTier(tier);
    if (success) {
        await refreshDynamicData();
    }
    return success;
  }

  const value: AppContextType = {
    isLoading,
    allUsers,
    selectedUser,
    rewardsConfig,
    badgesConfig,
    isWhopConnected,
    community,
    quests,
    questsAdmin,
    userQuestProgress,
    storeItems,
    signIn: api.signInWithPassword,
    signUp: api.signUpNewUser,
    signOut: api.signOut,
    sendPasswordResetEmail: api.sendPasswordResetEmail,
    getUserById: api.getUserById,
    getUserActions: api.getUserActions,
    handleRecordAction,
    handleAwardBadge,
    handleAddReward,
    handleUpdateReward,
    handleDeleteReward,
    handleAddBadge,
    handleUpdateBadge,
    handleDeleteBadge,
    handleCreateQuest,
    handleUpdateQuest,
    handleDeleteQuest,
    handleToggleQuest,
    handleCreateStoreItem,
    handleUpdateStoreItem,
    handleDeleteStoreItem,
    handleToggleStoreItemActive,
    updateUserProfile,
    connectWhop,
    syncWhopMembers,
    handleTriggerWebhook,
    isFeatureEnabled,
    handleBuyStoreItem,
    claimQuestReward,
    resetAppData,
    // Inventory
    getUserInventory: api.getUserInventory,
    getActiveEffects: api.getActiveEffects,
    activateInventoryItem,
    // Admin
    adminUpdateUserStats: (userId, xp, streak, freezes) => adminActionWrapper(api.adminUpdateUserStats(userId, xp, streak, freezes)),
    adminUpdateUserRole: (userId, role) => adminActionWrapper(api.adminUpdateUserRole(userId, role)),
    adminBanUser: (userId, duration) => adminActionWrapper(api.adminBanUser(userId, duration)),
    adminGetUserEmail: api.adminGetUserEmail,
    getAllUserActions: api.getAllUserActions,
    adminUpdateCommunityTier,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// --- End of App Context Logic ---

// Component to handle feature gating at the route level
const FeatureGatedPage: React.FC<{ feature: Feature; children: ReactNode }> = ({ feature, children }) => {
  const { isFeatureEnabled, isLoading } = useApp();
  if (isLoading) return <div className="text-center p-8">Loading...</div>;
  
  return isFeatureEnabled(feature) ? <>{children}</> : <Navigate to="/dashboard" replace />;
};


const App: React.FC = () => {
  return (
    <HashRouter>
      <AppProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route 
            path="/dashboard" 
            element={<ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>} 
          />
           <Route 
            path="/collection" 
            element={<ProtectedRoute><Layout><CollectionPage /></Layout></ProtectedRoute>} 
          />
           <Route 
            path="/pricing" 
            element={<ProtectedRoute><Layout><PricingPage /></Layout></ProtectedRoute>} 
          />
          <Route 
            path="/profile/:userId"
            element={<ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>}
          />
           <Route 
            path="/quests" 
            element={
              <ProtectedRoute>
                <Layout>
                  <FeatureGatedPage feature="quests"><QuestsPage /></FeatureGatedPage>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route 
            path="/store" 
            element={
              <ProtectedRoute>
                <Layout>
                  <FeatureGatedPage feature="store"><StorePage /></FeatureGatedPage>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route 
            path="/analytics" 
            element={<AdminRoute><Layout><AnalyticsPage /></Layout></AdminRoute>} 
          />
          <Route 
            path="/admin" 
            element={<AdminRoute><Layout><AdminPage /></Layout></AdminRoute>} 
          />
          <Route 
            path="/connect/whop" 
            element={<AdminRoute><Layout><WhopConnectPage /></Layout></AdminRoute>} 
          />
        </Routes>
      </AppProvider>
    </HashRouter>
  );
};

export default App;