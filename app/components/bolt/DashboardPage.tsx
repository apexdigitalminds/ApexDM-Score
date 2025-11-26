"use client";

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import Link from 'next/link';
import type { Action, ActionType } from '@/types';
import XPProgress from './XPProgress';
import StreakCounter from './StreakCounter';
import BadgeDisplay from './BadgeDisplay';
import Leaderboard from './Leaderboard';
import { SnowflakeIcon } from './icons';
import ActionButton from './ActionButton';
import InventorySection from './InventorySection'; // 🟢 NEW IMPORT
import { ArrowPathIcon } from './icons'; // Ensure you have a refresh icon or similar

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

const DashboardPage: React.FC = () => {
    const { 
        isLoading, 
        selectedUser, 
        allUsers, 
        getUserActions, 
        handleRecordAction, 
        rewardsConfig,
    } = useApp();
    const [isSyncing, setIsSyncing] = useState(false);

const handleSync = async () => {
    setIsSyncing(true);
    try {
        const res = await fetch('/api/sync', { method: 'POST' });
        const data = await res.json();
        showNotification(data.message); // Reuse your existing notification helper
        if (data.success) fetchData(); // Refresh dashboard if sync found new stuff
    } catch (e) {
        showNotification("Sync failed. Try again later.");
    }
    setIsSyncing(false);
};
    const [userActions, setUserActions] = useState<Action[]>([]);
    const [xpGained, setXpGained] = useState<number | null>(null);
    const [notification, setNotification] = useState('');

    const fetchData = async () => {
        if (selectedUser) {
            const actions = await getUserActions(selectedUser.id);
            setUserActions(actions);
        }
    };
<div className="flex justify-between items-start">
    <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        {/* ... */}
    </div>
    <button 
        onClick={handleSync} 
        disabled={isSyncing}
        className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
    >
        <ArrowPathIcon className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
        {isSyncing ? 'Syncing...' : 'Sync Progress'}
    </button>
</div>
    useEffect(() => {
        fetchData();
    }, [selectedUser]);

    const showNotification = (message: string) => {
        setNotification(message);
        setTimeout(() => setNotification(''), 3000);
    };
    
    const handleAction = async (actionType: ActionType) => {
        if (!selectedUser) return;
        const result = await handleRecordAction(selectedUser.id, actionType, 'manual');
        if (result) {
            setXpGained(result.xpGained);
            showNotification(`+${result.xpGained} XP for ${actionType.replace(/_/g, ' ')}!`);
            setTimeout(() => setXpGained(null), 2000);
            fetchData(); 
        }
    };

    if (isLoading || !selectedUser) {
        return <div className="text-center p-8">Loading user data...</div>;
    }
    
    const currentUser = selectedUser!;
    const isDev = process.env.NODE_ENV === 'development';

    return (
        <div className="space-y-6">
            {xpGained && <XpNotification amount={xpGained} />}
             {notification && (
                <div className="fixed top-20 right-8 bg-slate-700 text-white px-4 py-2 rounded-lg shadow-lg z-20 border border-slate-600">
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

            {/* 🟢 NEW: Dedicated Inventory Section */}
            <InventorySection />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Leaderboard users={allUsers} currentUserId={currentUser.id} />
                </div>
                <div>
                    <BadgeDisplay badges={currentUser.badges ?? []} />
                </div>
            </div>

            {/* Only show Manual Actions to Admin in Dev Mode */}
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
                     <div className="space-y-2 max-h-48 overflow-y-auto pr-2 text-sm">
                        {Object.entries(rewardsConfig).map(([action, config]) => (
                            <div key={action} className="flex justify-between items-center p-2 bg-slate-700/50 rounded-md">
                                <span className="text-slate-300 capitalize">{action.replace(/_/g, ' ')}</span>
                                <span className="font-bold text-blue-400">+{ (config as any).xpGained ?? (config as any).xp } XP</span>
                            </div>
                        ))}
                     </div>
                </div>
                <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-4">Recent Actions</h3>
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                        {userActions.length > 0 ? userActions.slice(0, 5).map(action => (
                            <div key={action.id} className="flex justify-between items-center text-sm">
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