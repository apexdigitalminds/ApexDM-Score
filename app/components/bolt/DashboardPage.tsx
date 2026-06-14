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
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center h-full">
        <div className="relative w-20 h-20 flex items-center justify-center rounded-full bg-cyan-100 dark:bg-cyan-500/10">
            <SnowflakeIcon className="w-10 h-10 text-cyan-500 dark:text-cyan-400" />
        </div>
        <p className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">{count}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">Streak Freezes</p>
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
    const [syncCooldownMins, setSyncCooldownMins] = useState<number | null>(null);
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

    // Sync Handler with Queue Support
    const handleSync = async () => {
        setIsSyncing(true);
        setSyncCooldownMins(null);
        try {
            const res = await fetch('/api/sync', { method: 'POST' });
            const data = await res.json();

            if (data.cooldown) {
                // On cooldown - show remaining time
                setSyncCooldownMins(data.minutesRemaining);
                showNotification(`⏳ ${data.message}`);
                setIsSyncing(false);
            } else if (data.queued) {
                // 🆕 QUEUED - sync added to queue, start polling
                showNotification(`📥 ${data.message}`);
                // Keep syncing state true and start polling
                pollSyncStatus();
            } else if (data.success) {
                // IMMEDIATE - sync completed immediately
                const details = data.details?.join(', ') || '';
                if (data.xpAwarded > 0) {
                    showNotification(`✅ +${data.xpAwarded} XP from ${details}`);
                } else {
                    showNotification(data.message || 'Sync complete. No new activity.');
                }
                setSyncCooldownMins(null);
                await triggerRefresh();
                setIsSyncing(false);
            } else {
                showNotification(data.message || 'Sync completed with no changes.');
                setIsSyncing(false);
            }
        } catch (e) {
            console.error('Sync error:', e);
            showNotification('Sync failed. Check connection.');
            setIsSyncing(false);
        }
    };

    // 🆕 Poll for sync queue status
    const pollSyncStatus = async () => {
        let attempts = 0;
        const maxAttempts = 30; // Poll for up to 5 minutes (10 sec intervals)

        const checkStatus = async () => {
            try {
                const res = await fetch('/api/sync/status');
                const data = await res.json();

                console.log('📊 Sync status:', data.status);

                if (data.status === 'completed') {
                    // Sync complete!
                    if (data.xpGained > 0) {
                        showNotification(`✅ Sync complete! +${data.xpGained} XP from ${data.actionsSynced} action${data.actionsSynced !== 1 ? 's' : ''}`);
                    } else {
                        showNotification('✅ Sync complete. No new activity to reward.');
                    }
                    await triggerRefresh();
                    setIsSyncing(false);
                    return true; // Stop polling

                } else if (data.status === 'failed') {
                    showNotification(`❌ Sync failed: ${data.error || 'Unknown error'}`);
                    setIsSyncing(false);
                    return true; // Stop polling

                } else if (data.status === 'pending' || data.status === 'processing') {
                    // Still in progress
                    attempts++;
                    if (attempts >= maxAttempts) {
                        showNotification('⏳ Sync is taking longer than expected. Check back soon.');
                        setIsSyncing(false);
                        return true; // Stop polling
                    }
                    return false; // Continue polling
                }

                return false;
            } catch (e) {
                console.error('Status check error:', e);
                attempts++;
                if (attempts >= maxAttempts) {
                    setIsSyncing(false);
                    return true;
                }
                return false;
            }
        };

        // Poll every 10 seconds
        const poll = async () => {
            const done = await checkStatus();
            if (!done) {
                setTimeout(poll, 10000); // 10 second intervals
            }
        };

        // Start polling after a short delay
        setTimeout(poll, 3000); // First check after 3 seconds
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
        return <div className="text-center p-8 text-slate-500 dark:text-slate-400">Loading user data...</div>;
    }

    const currentUser = selectedUser!;
    const isDev = process.env.NODE_ENV === 'development';

    return (
        <div className="space-y-6">
            {/* Header Row */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
                    <p className="text-slate-600 dark:text-slate-400">Your hub for stats and inventory.</p>
                </div>

                <div className="flex flex-col items-end gap-1">
                    <button
                        onClick={handleSync}
                        disabled={isSyncing || !!syncCooldownMins}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-md border ${syncCooldownMins
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500 disabled:opacity-50'
                            }`}
                        title={syncCooldownMins ? `Available in ${syncCooldownMins} minute${syncCooldownMins !== 1 ? 's' : ''}` : 'Collects XP for new courses, lessons, and posts since your last sync'}
                    >
                        <ArrowPathIcon className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing
                            ? 'Syncing...'
                            : syncCooldownMins
                                ? `Available in ${syncCooldownMins}m`
                                : 'Sync New Activity'}
                    </button>
                    <p className="text-xs text-slate-500">
                        {syncCooldownMins
                            ? '⏳ Syncs available once per hour'
                            : currentUser.last_sync_at
                                ? `📅 Last synced: ${new Date(currentUser.last_sync_at).toLocaleDateString()} at ${new Date(currentUser.last_sync_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                : '🆕 First sync collects activity from the last 24 hours'}
                    </p>
                </div>
            </div>

            {xpGained && <XpNotification amount={xpGained} />}
            {notification && (
                <div className="fixed top-20 right-4 sm:right-8 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white px-4 py-2 rounded-lg shadow-lg z-50 border border-slate-200 dark:border-slate-600 animate-pulse max-w-[calc(100vw-2rem)]">
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
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-dashed border-slate-300 dark:border-slate-600">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">🛠️ Dev Tools (Admin Only)</h3>
                        <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300">Hidden in Prod</span>
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
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">How to Earn XP</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Performing any of these actions daily will maintain your streak.</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 text-sm custom-scrollbar">
                        {Object.entries(rewardsConfig).map(([action, config]) => (
                            <div key={action} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                <span className="text-slate-700 dark:text-slate-300 capitalize">{action.replace(/_/g, ' ')}</span>
                                <span className="font-bold text-blue-600 dark:text-blue-400">+{(config as any).xpGained ?? (config as any).xp} XP</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Recent Actions</h3>
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {userActions.length > 0 ? userActions.slice(0, 5).map(action => (
                            <div key={action.id} className="flex justify-between items-center text-sm p-2 bg-slate-50 dark:bg-slate-700/30 rounded-md">
                                <p className="text-slate-700 dark:text-slate-300 capitalize">{action.actionType.replace(/_/g, ' ')}</p>
                                <span className={`font-bold ${action.xpGained >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {action.xpGained > 0 ? '+' : ''}{action.xpGained} XP
                                </span>
                            </div>
                        )) : (
                            <p className="text-slate-400 dark:text-slate-500 text-center py-4">No actions yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;