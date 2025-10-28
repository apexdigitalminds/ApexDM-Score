import React, { useState, useEffect } from 'react';
import { useApp } from '../App';
// FIX: Import Reward type
import type { Action, ActionType, UserInventoryItem, ActiveEffect, Reward } from '../types';
import XPProgress from './XPProgress';
import StreakCounter from './StreakCounter';
import BadgeDisplay from './BadgeDisplay';
import Leaderboard from './Leaderboard';
import StreakShowcase from './StreakShowcase';
import { SnowflakeIcon, iconMap, SparklesIcon, TrophyIcon } from './icons';
import { Countdown } from './ProfilePage'; // Re-using the fixed Countdown component
import ActionButton from './ActionButton';

const XpNotification: React.FC<{ amount: number }> = ({ amount }) => {
    return (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-blue-500 to-purple-600 text-white text-3xl font-bold px-8 py-4 rounded-2xl shadow-2xl animate-fade-up-out pointer-events-none z-50">
            +{amount} XP
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
        getUserInventory,
        getActiveEffects,
        activateInventoryItem,
    } = useApp();

    const [userActions, setUserActions] = useState<Action[]>([]);
    const [inventory, setInventory] = useState<UserInventoryItem[]>([]);
    const [activeEffects, setActiveEffects] = useState<ActiveEffect[]>([]);
    const [xpGained, setXpGained] = useState<number | null>(null);
    const [notification, setNotification] = useState('');

    const fetchData = async () => {
        if (selectedUser) {
            const [actions, inv, effects] = await Promise.all([
                getUserActions(selectedUser.id),
                getUserInventory(selectedUser.id),
                getActiveEffects(selectedUser.id)
            ]);
            setUserActions(actions);
            setInventory(inv);
            setActiveEffects(effects);
        }
    };

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
            fetchData(); // Refresh data after action
        }
    };

    const handleActivate = async (inventoryId: string) => {
        const result = await activateInventoryItem(inventoryId);
        showNotification(result.message);
        if (result.success) {
            fetchData(); // Refresh all profile data
        }
    };

    if (isLoading) {
        return <div className="text-center p-8">Loading user data...</div>;
    }
    
    const currentUser = selectedUser!;

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
                    <StreakFreezeIndicator count={currentUser.streakFreezes} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Leaderboard users={allUsers} currentUserId={currentUser.id} />
                </div>
                <div>
                    <BadgeDisplay badges={currentUser.badges} />
                </div>
            </div>

            {currentUser.role === 'admin' && (
                <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-4">Admin Manual Actions (for Testing)</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.keys(rewardsConfig).map(actionType => (
                            <ActionButton 
                                key={actionType}
                                actionType={actionType}
                                label={actionType.replace(/_/g, ' ')}
                                onAction={handleAction}
                            />
                        ))}
                    </div>
                </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-800 p-6 rounded-2xl shadow-lg">
                     <h3 className="text-lg font-bold text-white mb-2">How to Earn XP</h3>
                     <p className="text-sm text-slate-400 mb-4">Performing any of these actions daily will maintain your streak.</p>
                     <div className="space-y-2 max-h-48 overflow-y-auto pr-2 text-sm">
                        {Object.entries(rewardsConfig).map(([action, config]) => (
                            <div key={action} className="flex justify-between items-center p-2 bg-slate-700/50 rounded-md">
                                <span className="text-slate-300 capitalize">{action.replace(/_/g, ' ')}</span>
                                {/* FIX: Cast config to Reward to access xp property */}
                                <span className="font-bold text-blue-400">+{ (config as Reward).xp } XP</span>
                            </div>
                        ))}
                     </div>
                </div>
                <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-4">Recent Actions</h3>
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                        {userActions.slice(0, 5).map(action => (
                            <div key={action.id} className="flex justify-between items-center text-sm">
                                <p className="text-slate-300 capitalize">{action.actionType.replace(/_/g, ' ')}</p>
                                <span className="font-bold text-blue-400">+{action.xpGained} XP</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

             <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
                <h3 className="text-lg font-bold text-white mb-4">Inventory & Active Effects</h3>
                <div className="space-y-4">
                    {activeEffects.map(effect => (
                        <div key={effect.id} className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                            <div className="flex items-center gap-3">
                                <SparklesIcon className="w-6 h-6 text-green-400"/>
                                <p className="font-semibold text-white">{effect.modifier}x XP Boost Active</p>
                            </div>
                            <div className="text-sm text-slate-300">
                                Expires in: <span className="font-bold"><Countdown expiry={effect.expiresAt} /></span>
                            </div>
                        </div>
                    ))}
                    {inventory.map(invItem => {
                        const Icon = iconMap[invItem.itemDetails.icon] || SparklesIcon;
                        return (
                        <div key={invItem.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Icon className="w-6 h-6 text-purple-400"/>
                                <div>
                                    <p className="font-semibold text-white">{invItem.itemDetails.name}</p>
                                    <p className="text-xs text-slate-400">Purchased: {new Date(invItem.purchasedAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <button onClick={() => handleActivate(invItem.id)} className="text-sm bg-purple-600 hover:bg-purple-700 text-white font-semibold py-1.5 px-3 rounded-md">Activate</button>
                        </div>
                    )})}
                    {inventory.length === 0 && activeEffects.length === 0 && (
                        <p className="text-slate-500 text-center py-4">No inventory items or active effects. Visit the XP Store!</p>
                    )}
                </div>
                </div>

            <div className="pt-6 space-y-6">
                <StreakShowcase />
            </div>
        </div>
    );
};

export default DashboardPage;