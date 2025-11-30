"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; 
import { useApp } from '@/context/AppContext';
import type { Action, ActionType, UserInventoryItem, ActiveEffect, Profile } from '@/types'; 
import XPProgress from './XPProgress';
import StreakCounter from './StreakCounter';
import BadgeDisplay from './BadgeDisplay';
import Leaderboard from './Leaderboard';
import { SnowflakeIcon, ArrowPathIcon } from './icons'; 
import ActionButton from './ActionButton';
import InventorySection from './InventorySection'; 

// --- Sub-Components ---

const XpNotification: React.FC<{ amount: number }> = ({ amount }) => {
    return (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-blue-500 to-purple-600 text-white text-3xl font-bold px-8 py-4 rounded-2xl shadow-2xl animate-fade-up-out pointer-events-none z-50">
            {amount > 0 ? '+' : ''}{amount} XP
        </div>
    );
};

const StreakFreezeIndicator: React.FC<{ count: number }> = ({ count }) => (
    <div className="bg-slate-800 p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center text-center h-full">
        <div className="relative w-20 h-20 flex items-center justify-center rounded-full bg-cyan-500/10">
            <SnowflakeIcon className="w-10 h-10 text-cyan-400" />
        </div>
        <p className="mt-4 text-3xl font-bold text-white">{count}</p>
        <p className="text-sm text-slate-400">Streak Freezes</p>
    </div>
);

// --- Main Component ---

const DashboardPage: React.FC = () => {
    const router = useRouter();
    const { 
        isLoading, 
        selectedUser, 
        allUsers, 
        getUserActions, 
        handleRecordAction, 
        rewardsConfig,
        getUserInventory,
        getActiveEffects,
        getUserById,
        // 🟢 IMPORTED: Context Refreshers to update Layout/Profile/Leaderboard
        refreshSelectedUser,
        fetchAllUsers
    } = useApp();

    const [isSyncing, setIsSyncing] = useState(false);
    const [userActions, setUserActions] = useState<Action[]>([]);
    
    // Data States
    const [inventory, setInventory] = useState<UserInventoryItem[]>([]);
    const [activeEffects, setActiveEffects] = useState<ActiveEffect[]>([]);
    const [currentMetadata, setCurrentMetadata] = useState<any>(null); 
    
    const [xpGained, setXpGained] = useState<number | null>(null);
    const [notification, setNotification] = useState('');
    
    // Helpers
    const showNotification = (message: string) => {
        setNotification(message);
        setTimeout(() => setNotification(''), 3000);
    };

    // 🟢 FIXED REFRESH LOGIC: Updates Global Context + Local Data + Server Data
    const triggerRefresh = async () => {
        await Promise.all([
            fetchData(),            // 1. Refresh Dashboard Local Data (Inventory/Effects)
            refreshSelectedUser(),  // 2. Refresh Global Context (Updates Top Menu / Profile Page)
            fetchAllUsers()         // 3. Refresh Global Leaderboard
        ]);
        router.refresh();           // 4. Refresh Server Components
    };

    const fetchData = async () => {
        if (selectedUser) {
            try {
                // 1. Fetch Actions
                const actions = await getUserActions(selectedUser.id);
                setUserActions(actions);

                // 2. Fetch Inventory 
                if (getUserInventory) {
                    const items = await getUserInventory(selectedUser.id);
                    setInventory(items);
                }

                // 3. Fetch Active Effects
                if (getActiveEffects) {
                    const effects = await getActiveEffects(selectedUser.id);
                    setActiveEffects(effects);
                }

                // 4. Fetch Fresh User Metadata
                if (getUserById) {
                    const freshUser = await getUserById(selectedUser.id);
                    if (freshUser && freshUser.metadata) {
                        setCurrentMetadata(freshUser.metadata);
                    } else if (selectedUser.metadata) {
                        setCurrentMetadata(selectedUser.metadata);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            }
        }
    };

    // Sync Handler
    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const res = await fetch('/api/sync', { method: 'POST' });
            const data = await res.json();
            
            if (data.success) {
                showNotification(data.message || "Sync successful!");
                await triggerRefresh();
            } else {
                showNotification(data.message || "Sync completed with no changes.");
            }
        } catch (e) {
            console.error("Sync error:", e);
            showNotification("Sync failed. Check connection.");
        } finally {
            setIsSyncing(false);
        }
    };

    // Manual Action Handler
    const handleAction = async (actionType: ActionType) => {
        if (!selectedUser) return;
        const result = await handleRecordAction(selectedUser.id, actionType, 'manual');
        if (result) {
            setXpGained(result.xpGained);
            showNotification(`+${result.xpGained} XP for ${actionType.replace(/_/g, ' ')}!`);
            setTimeout(() => setXpGained(null), 2000);
            triggerRefresh(); 
        }
    };

    // Initial Load Effect
    useEffect(() => {
        fetchData();
        if (selectedUser?.metadata) {
            setCurrentMetadata(selectedUser.metadata);
        }
    }, [selectedUser]);

    if (isLoading || !selectedUser) {
        return <div className="text-center p-8 text-slate-400">Loading user data...</div>;
    }
    
    const currentUser = selectedUser!;
    const isDev = process.env.NODE_ENV === 'development';

    return (
        <div className="space-y-6">
            {/* Header Row */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                    <p className="text-slate-400">Your hub for stats and inventory.</p>
                </div>
                
                <button 
                    onClick={handleSync} 
                    disabled={isSyncing}
                    className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 shadow-md border border-slate-600"
                >
                    <ArrowPathIcon className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Syncing...' : 'Sync Progress'}
                </button>
            </div>

            {xpGained && <XpNotification amount={xpGained} />}
            {notification && (
                <div className="fixed top-20 right-8 bg-slate-700 text-white px-4 py-2 rounded-lg shadow-lg z-20 border border-slate-600 animate-pulse">
                    {notification}
                </div>
            )}

            <style>{`
                @keyframes fade-up-out {
                    0% { opacity: 0; transform: translate(-50%, 0); }
                    20% { opacity: 1; transform: translate(-50%, -2rem); }
                    80% { opacity: 1; transform: translate(-50%, -2.2rem); }
                    100% { opacity: 0; transform: translate(-50%, -3rem); }
                }
                .animate-fade-up-out {
                    animation: fade-up-out 2s ease-out forwards;
                }
            `}</style>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-2">
                    <XPProgress xp={currentUser.xp} />
                </div>
                <div>
                    <StreakCounter streak={currentUser.streak} />
                </div>
                <div>
                    <StreakFreezeIndicator count={currentUser.streakFreezes ?? 0} />
                </div>
            </div>

            <InventorySection 
                inventory={inventory}
                activeEffects={activeEffects}
                userMetadata={currentMetadata}
                onRefresh={triggerRefresh}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Leaderboard users={allUsers} currentUserId={currentUser.id} />
                </div>
                <div>
                    <BadgeDisplay badges={currentUser.badges ?? []} />
                </div>
            </div>

            {currentUser.role === 'admin' && isDev && (
                <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-dashed border-slate-600">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-white">🛠️ Dev Tools (Admin Only)</h3>
                        <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">Hidden in Prod</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.keys(rewardsConfig).map(actionType => (
                            <ActionButton 
                                key={actionType}
                                actionType={actionType as ActionType}
                                label={actionType.replace(/_/g, ' ')}
                                onAction={handleAction}
                            />
                        ))}
                    </div>
                </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
                     <h3 className="text-lg font-bold text-white mb-2">How to Earn XP</h3>
                     <p className="text-sm text-slate-400 mb-4">Performing any of these actions daily will maintain your streak.</p>
                     <div className="space-y-2 max-h-48 overflow-y-auto pr-2 text-sm custom-scrollbar">
                        {Object.entries(rewardsConfig).map(([action, config]) => (
                            <div key={action} className="flex justify-between items-center p-2 bg-slate-700/50 rounded-md hover:bg-slate-700 transition-colors">
                                <span className="text-slate-300 capitalize">{action.replace(/_/g, ' ')}</span>
                                <span className="font-bold text-blue-400">+{ (config as any).xpGained ?? (config as any).xp } XP</span>
                            </div>
                        ))}
                     </div>
                </div>

                <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-4">Recent Actions</h3>
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {userActions.length > 0 ? userActions.slice(0, 5).map(action => (
                            <div key={action.id} className="flex justify-between items-center text-sm p-2 bg-slate-700/30 rounded-md">
                                <p className="text-slate-300 capitalize">{action.actionType.replace(/_/g, ' ')}</p>
                                <span className={`font-bold ${action.xpGained >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {action.xpGained > 0 ? '+' : ''}{action.xpGained} XP
                                </span>
                            </div>
                        )) : (
                            <p className="text-slate-500 text-center py-4">No actions yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;