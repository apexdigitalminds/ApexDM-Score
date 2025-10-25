import React, { createContext, useState, ReactNode, useContext, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import DashboardPage from './components/DashboardPage';
import AdminPage from './components/AdminPage';
import WhopConnectPage from './components/WhopConnectPage';
import StorePage from './components/StorePage';
import ProfilePage from './components/ProfilePage';
import QuestsPage from './components/QuestsPage';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import { api } from './services/api';
import type { User, Action, RewardsConfig, BadgeConfig, Community, Quest, UserQuestProgress } from './types';

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
  userQuestProgress: UserQuestProgress[];
  
  // Actions
  login: (userId: string) => void;
  logout: () => void;
  getUserById: (userId: string) => Promise<User | null>;
  getUserActions: (userId: string) => Promise<Action[]>;
  handleRecordAction: (userId: string, actionType: string, source?: 'manual' | 'whop' | 'discord') => Promise<any>;
  handleAwardBadge: (userId: string, badgeName: string) => Promise<void>;
  handleAddReward: (actionName: string, xp: number) => Promise<void>;
  handleAddBadge: (badgeName: string, config: BadgeConfig) => Promise<void>;
  connectWhop: () => Promise<void>;
  syncWhopMembers: () => Promise<string>;
  handleTriggerWebhook: (userId: string, actionType: string) => Promise<string | null>;
  isFeatureEnabled: (feature: Feature) => boolean;
  buyStreakFreeze: (userId: string) => Promise<{ success: boolean; message: string; }>;
  claimQuestReward: (userId: string, questId: string) => Promise<{ success: boolean; message: string; }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [rewardsConfig, setRewardsConfig] = useState<RewardsConfig>({});
  const [badgesConfig, setBadgesConfig] = useState<{ [key: string]: BadgeConfig }>({});
  const [isWhopConnected, setIsWhopConnected] = useState(false);
  const [community, setCommunity] = useState<Community | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [userQuestProgress, setUserQuestProgress] = useState<UserQuestProgress[]>([]);

  const selectedUser = allUsers.find(user => user.id === selectedUserId) || null;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [users, rewards, badges, communityInfo, questsData] = await Promise.all([
        api.getUsers(),
        api.getRewardsConfig(),
        api.getBadgesConfig(),
        api.getCommunityInfo(),
        api.getQuests(),
      ]);
      setAllUsers(users);
      setRewardsConfig(rewards);
      setBadgesConfig(badges);
      setCommunity(communityInfo);
      setQuests(questsData);
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  useEffect(() => {
    if (selectedUser) {
      api.getUserQuestProgress(selectedUser.id).then(setUserQuestProgress);
    } else {
      setUserQuestProgress([]);
    }
  }, [selectedUser]);


  const login = (userId: string) => {
    setSelectedUserId(userId);
  };

  const logout = () => {
    setSelectedUserId(null);
  };
  
  const refreshUserData = async () => {
    const users = await api.getUsers();
    setAllUsers(users);
    if(selectedUser) {
       const progress = await api.getUserQuestProgress(selectedUser.id);
       setUserQuestProgress(progress);
    }
  }

  const handleRecordAction = async (userId: string, actionType: string, source: 'manual' | 'whop' | 'discord' = 'manual') => {
    const result = await api.recordAction(userId, actionType, source);
    await refreshUserData(); // Refresh data
    return result;
  };

  const handleAwardBadge = async (userId: string, badgeName: string) => {
    await api.awardBadge(userId, badgeName);
    await refreshUserData();
  };

  const handleAddReward = async (actionName: string, xp: number) => {
    const formattedActionName = actionName.trim().toLowerCase().replace(/\s+/g, '_');
    if (formattedActionName) {
      await api.createReward(formattedActionName, xp);
      await fetchData();
    }
  };

  const handleAddBadge = async (badgeName: string, config: BadgeConfig) => {
    if (badgeName.trim()) {
      await api.createBadge(badgeName.trim(), config);
      await fetchData();
    }
  };
  
  const connectWhop = async () => {
    const communityData = await api.getCommunityInfo();
    setCommunity(communityData);
    setIsWhopConnected(true);
  };
  
  const syncWhopMembers = async () => {
    const summary = await api.syncWhopMembers();
    await refreshUserData();
    return summary;
  };

  const handleTriggerWebhook = async (userId: string, actionType: string) => {
    const message = await api.triggerWebhook(userId, actionType);
    await refreshUserData();
    return message;
  };
  
  const isFeatureEnabled = (feature: Feature) => {
    if (!community?.subscriptionTier) return false;
    const requiredTier = FEATURE_TIERS[feature];
    const userTier = community.subscriptionTier;
    return TIER_HIERARCHY[userTier] >= TIER_HIERARCHY[requiredTier];
  };

  const buyStreakFreeze = async (userId: string) => {
    const result = await api.buyStreakFreeze(userId);
    if(result.success) {
      await refreshUserData();
    }
    return result;
  };
  
  const claimQuestReward = async (userId: string, questId: string) => {
      const result = await api.claimQuestReward(userId, questId);
       if(result.success) {
            await refreshUserData();
        }
        return result;
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
    userQuestProgress,
    login,
    logout,
    getUserById: api.getUserById,
    getUserActions: api.getUserActions,
    handleRecordAction,
    handleAwardBadge,
    handleAddReward,
    handleAddBadge,
    connectWhop,
    syncWhopMembers,
    handleTriggerWebhook,
    isFeatureEnabled,
    buyStreakFreeze,
    claimQuestReward,
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