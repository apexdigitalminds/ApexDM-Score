import React, { createContext, useState, ReactNode, useContext, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import DashboardPage from './components/DashboardPage';
import AdminPage from './components/AdminPage';
import AnalyticsPage from './components/AnalyticsPage';
import WhopConnectPage from './components/WhopConnectPage';
import StorePage from './components/StorePage';
import ProfilePage from './components/ProfilePage';
import QuestsPage from './components/QuestsPage';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import LoginPage from './components/LoginPage';
import SignUpPage from './components/SignUpPage';
import { api, SignInCredentials, SignUpCredentials } from './services/api';
import type { User, Action, RewardsConfig, BadgeConfig, Community, Quest, UserQuestProgress, StoreItem } from './types';
import { supabase } from './services/supabase';

// --- App Context Logic ---
type Feature = 'discordIntegration';
type Tier = 'bronze' | 'silver' | 'gold';

const FEATURE_TIERS: { [key in Feature]: Tier } = {
  discordIntegration: 'silver',
};

const TIER_HIERARCHY: { [key in Tier]: number } = {
  bronze: 1,
  silver: 2,
  gold: 3,
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

  // Data Actions
  getUserById: (userId: string) => Promise<User | null>;
  getUserActions: (userId: string) => Promise<Action[]>;
  handleRecordAction: (userId: string, actionType: string, source?: 'manual' | 'whop' | 'discord') => Promise<any>;
  handleAwardBadge: (userId: string, badgeName: string) => Promise<void>;
  handleAddReward: (actionName: string, xp: number) => Promise<void>;
  handleUpdateReward: (actionType: string, xp: number) => Promise<void>;
  handleDeleteReward: (actionType: string) => Promise<void>;
  handleAddBadge: (badgeName: string, config: BadgeConfig) => Promise<void>;
  handleUpdateBadge: (badgeName: string, config: BadgeConfig) => Promise<void>;
  handleDeleteBadge: (badgeName: string) => Promise<void>;
  handleCreateQuest: (questData: Omit<Quest, 'id'>) => Promise<boolean>;
  handleUpdateQuest: (questId: string, questData: Omit<Quest, 'id'>) => Promise<boolean>;
  handleDeleteQuest: (questId: string) => Promise<boolean>;
  handleToggleQuest: (questId: string, isActive: boolean) => Promise<void>;
  handleCreateStoreItem: (itemData: Omit<StoreItem, 'id'>) => Promise<boolean>;
  handleUpdateStoreItem: (itemId: string, itemData: Omit<StoreItem, 'id'>) => Promise<boolean>;
  handleDeleteStoreItem: (itemId: string) => Promise<boolean>;
  handleToggleStoreItemActive: (itemId: string, isActive: boolean) => Promise<void>;
  updateUserProfile: (updates: { avatarUrl?: string }) => Promise<boolean>;
  connectWhop: () => Promise<void>;
  syncWhopMembers: () => Promise<string>;
  handleTriggerWebhook: (userId: string, actionType: string) => Promise<string | null>;
  isFeatureEnabled: (feature: Feature) => boolean;
  handleBuyStoreItem: (userId: string, itemId: string) => Promise<{ success: boolean; message: string; }>;
  claimQuestReward: (userId: string, questId: string) => Promise<{ success: boolean; message: string; }>;
  resetAppData: () => Promise<void>;
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
      setQuestsAdmin(questsAdminData);
      setStoreItems(storeItemsData);
    } catch (error) {
      console.error("Failed to fetch static data:", error);
    }
  }, []);

  const refreshDynamicData = useCallback(async () => {
    // This function refreshes data that changes frequently (users, progress)
    // without blocking the UI with a loading spinner, suitable for background updates.
    const [users, profile, questsData, questsAdminData, storeItemsData] = await Promise.all([
      api.getUsers(),
      api.getCurrentUserProfile(),
      api.getQuests(),
      api.getQuestsAdmin(),
      api.getStoreItems(),
    ]);
    setAllUsers(users);
    setSelectedUser(profile);
    setQuests(questsData);
    setQuestsAdmin(questsAdminData);
    setStoreItems(storeItemsData);
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
    await api.awardBadge(userId, badgeName);
    await refreshDynamicData();
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
    await api.deleteReward(actionType);
    await fetchStaticData();
  };

  const handleAddBadge = async (badgeName: string, config: BadgeConfig) => {
    if (badgeName.trim()) {
      await api.createBadge(badgeName.trim(), config);
      await fetchStaticData();
    }
  };
  
  const handleUpdateBadge = async (badgeName: string, config: BadgeConfig) => {
      await api.updateBadge(badgeName, config);
      await fetchStaticData();
  };

  const handleDeleteBadge = async (badgeName: string) => {
      await api.deleteBadge(badgeName);
      await fetchStaticData();
  };

   const handleCreateQuest = async (questData: Omit<Quest, 'id'>) => {
      const success = await api.createQuest(questData);
      if (success) await fetchStaticData();
      return success;
  };

  const handleUpdateQuest = async (questId: string, questData: Omit<Quest, 'id'>) => {
      const success = await api.updateQuest(questId, questData);
      if (success) await fetchStaticData();
      return success;
  };

  const handleDeleteQuest = async (questId: string) => {
      const success = await api.deleteQuest(questId);
      if (success) await fetchStaticData();
      return success;
  };
  
  const handleToggleQuest = async (questId: string, isActive: boolean) => {
      await api.updateQuestActiveStatus(questId, isActive);
      await fetchStaticData();
  };

  const handleCreateStoreItem = async (itemData: Omit<StoreItem, 'id'>) => {
    const success = await api.createStoreItem(itemData);
    if (success) await fetchStaticData();
    return success;
  };
  const handleUpdateStoreItem = async (itemId: string, itemData: Omit<StoreItem, 'id'>) => {
    const success = await api.updateStoreItem(itemId, itemData);
    if (success) await fetchStaticData();
    return success;
  };
  const handleDeleteStoreItem = async (itemId: string) => {
    const success = await api.deleteStoreItem(itemId);
    if (success) await fetchStaticData();
    return success;
  };
  const handleToggleStoreItemActive = async (itemId: string, isActive: boolean) => {
    await api.updateStoreItemActiveStatus(itemId, isActive);
    await fetchStaticData();
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
            path="/profile/:userId"
            element={<ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>}
          />
           <Route 
            path="/quests" 
            element={<ProtectedRoute><Layout><QuestsPage /></Layout></ProtectedRoute>} 
          />
          <Route 
            path="/store" 
            element={<ProtectedRoute><Layout><StorePage /></Layout></ProtectedRoute>} 
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
            element={<AdminRoute><WhopConnectPage /></AdminRoute>} 
          />
        </Routes>
      </AppProvider>
    </HashRouter>
  );
};

export default App;