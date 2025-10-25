import React, { createContext, useState, ReactNode, useContext, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import DashboardPage from './components/DashboardPage';
import AdminPage from './components/AdminPage';
import Layout from './components/Layout';
import useMockData from './hooks/useMockData';
import { useWhop } from './hooks/useWhop';
import type { User, RewardsConfig, BadgeConfig, Community } from './types';
import { initialRewardsConfig, initialBadgesConfig } from './config/rewards';

// --- Start of App Context Logic ---

export type MockDb = ReturnType<typeof useMockData>;

interface AppContextType {
  db: MockDb;
  allUsers: User[];
  selectedUser: User | null;
  setSelectedUserId: (id: string) => void;
  rewardsConfig: RewardsConfig;
  badgesConfig: { [key: string]: BadgeConfig };
  addReward: (actionName: string, xp: number) => void;
  addBadge: (badgeName: string, config: BadgeConfig) => void;
  isWhopConnected: boolean;
  community: Community | null;
  connectWhop: () => void;
  syncWhopMembers: () => Promise<string>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const db = useMockData();
  const { isWhopConnected, community, connectWhop, syncWhopMembers } = useWhop(db);
  const allUsers = db.users.getAll();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(allUsers[0]?.id || null);

  const [rewardsConfig, setRewardsConfig] = useState<RewardsConfig>(initialRewardsConfig);
  const [badgesConfig, setBadgesConfig] = useState<{ [key: string]: BadgeConfig }>(initialBadgesConfig);

  useEffect(() => {
    if (allUsers.length > 0 && !allUsers.some(u => u.id === selectedUserId)) {
      setSelectedUserId(allUsers[0].id);
    }
     if (allUsers.length > 0 && selectedUserId === null) {
      setSelectedUserId(allUsers[0].id);
    }
  }, [allUsers, selectedUserId]);

  const selectedUser = allUsers.find(user => user.id === selectedUserId) || null;

  const addReward = useCallback((actionName: string, xp: number) => {
    const formattedActionName = actionName.trim().toLowerCase().replace(/\s+/g, '_');
    if(formattedActionName) {
        setRewardsConfig(prev => ({
          ...prev,
          [formattedActionName]: { xp, badge: null }
        }));
    }
  }, []);

  const addBadge = useCallback((badgeName: string, config: BadgeConfig) => {
    if(badgeName.trim()){
        setBadgesConfig(prev => ({
          ...prev,
          [badgeName.trim()]: config
        }));
    }
  }, []);

  const value = {
    db,
    allUsers,
    selectedUser,
    setSelectedUserId,
    rewardsConfig,
    badgesConfig,
    addReward,
    addBadge,
    isWhopConnected,
    community,
    connectWhop,
    syncWhopMembers,
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
          <Route path="/dashboard" element={<Layout><DashboardPage /></Layout>} />
          <Route path="/admin" element={<Layout><AdminPage /></Layout>} />
        </Routes>
      </AppProvider>
    </HashRouter>
  );
};

export default App;