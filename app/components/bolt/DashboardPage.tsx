"use client";

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import Link from 'next/link';
import type { Action, ActionType, UserInventoryItem, ActiveEffect } from '@/types';
import XPProgress from './XPProgress';
import StreakCounter from './StreakCounter';
import BadgeDisplay from './BadgeDisplay';
import Leaderboard from './Leaderboard';
import { SnowflakeIcon, iconMap, SparklesIcon, ClockIcon } from './icons';
import Countdown from './Countdown';
import ActionButton from './ActionButton';

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
        getUserInventory,
        getActiveEffects,
        activateInventoryItem,
        getUserItemUsage, 
        storeItems, 
    } = useApp();

    const [userActions, setUserActions] = useState<Action[]>([]);
    const [inventory, setInventory] = useState<UserInventoryItem[]>([]);
    const [activeEffects, setActiveEffects] = useState<ActiveEffect[]>([]);
    const [usageHistory, setUsageHistory] = useState<any[]>([]); 
    const [xpGained, setXpGained] = useState<number | null>(null);
    const [notification, setNotification] = useState('');

    const fetchData = async () => {
        if (selectedUser) {
            // Safe check for getUserItemUsage in case Context isn't fully reloaded
            const historyPromise = getUserItemUsage ? getUserItemUsage(selectedUser.id) : Promise.resolve([]);
            
            const [actions, inv, effects, history] = await Promise.all([
                getUserActions(selectedUser.id),
                getUserInventory(selectedUser.id),
                getActiveEffects(selectedUser.id),
                historyPromise
            ]);
            setUserActions(actions);
            setInventory(inv);
            setActiveEffects(effects);
            setUsageHistory(history || []);
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
            fetchData(); 
        }
    };

    const handleActivate = async (inventoryId: string) => {
        const result = await activateInventoryItem(inventoryId);
        showNotification(result.message);
        if (result.success) {
            fetchData();
        }
    };

    // GROUPING LOGIC
    const groupedInventory = React.useMemo(() => {
        const groups: Record<string, { count: number, items: UserInventoryItem[] }> = {};
        
        inventory.forEach(item => {
            if (!item.isActive) { 
                const key = item.itemId;
                if (!groups[key]) {
                    groups[key] = { count: 0, items: [] };
                }
                groups[key].count++;
                groups[key].items.push(item);
            }
        });

        return Object.values(groups);
    }, [inventory]);

    const featuredItem = storeItems.find(i => i.isActive && i.cost > 0);

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
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-800 p-6 rounded-2xl shadow-lg">
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

             <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
                <h3 className="text-lg font-bold text-white mb-4">Inventory & Active Effects</h3>
                <div className="space-y-4">
                    
                    {/* 1. Active Effects Section */}
                    {activeEffects.map(effect => (
                        <div key={effect.id} className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                            <div className="flex items-center gap-3">
                                <SparklesIcon className="w-6 h-6 text-green-400"/>
                                {/* FIX: Default modifier to 1 if missing */}
                                <p className="font-semibold text-white">{effect.modifier || 1}x XP Boost Active</p>
                            </div>
                            <div className="text-sm text-slate-300">
                                Expires in: <span className="font-bold">
                                    {effect.expiresAt ? <Countdown expiry={effect.expiresAt} /> : 'N/A'}
                                </span>
                            </div>
                        </div>
                    ))}

                    {/* 2. Grouped Inventory Section */}
                    {groupedInventory.map((group) => {
                        const representative = group.items[0]; 
                        const Icon = iconMap[representative.itemDetails?.icon ?? ''] || SparklesIcon;
                        
                        return (
                            <div key={representative.itemId} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-700 hover:border-purple-500/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Icon className="w-8 h-8 text-purple-400"/>
                                        {/* Count Badge */}
                                        {group.count > 1 && (
                                            <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                                                x{group.count}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white">{representative.itemDetails?.name ?? 'Unknown Item'}</p>
<p className="text-xs text-slate-400 break-words pr-4">
    {representative.itemDetails?.description || 'Use this item to gain effects.'}
</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleActivate(representative.id)} 
                                    className="text-sm bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all transform hover:scale-105 active:scale-95"
                                >
                                    Use Item
                                </button>
                            </div>
                        );
                    })}
                    
                    {/* Empty State */}
                    {inventory.length === 0 && activeEffects.length === 0 && (
                        <div className="text-center py-6 bg-slate-700/30 rounded-xl border border-dashed border-slate-600">
                            <p className="text-slate-400 mb-2">Your inventory is empty.</p>
                            {featuredItem ? (
                                <div className="flex flex-col items-center gap-2">
                                    <p className="text-sm text-slate-500">Save up to buy:</p>
                                    <div className="flex items-center gap-2 text-purple-300 font-semibold">
                                        <SparklesIcon className="w-4 h-4" /> 
                                        {featuredItem.name} ({featuredItem.cost} XP)
                                    </div>
                                    <Link href="/store" className="mt-2 text-sm bg-slate-600 hover:bg-slate-500 text-white px-4 py-1.5 rounded-full transition-colors">
                                        Visit Store &rarr;
                                    </Link>
                                </div>
                            ) : (
                                <Link href="/store" className="text-purple-400 hover:text-purple-300 text-sm font-semibold">
                                    Visit the XP Store
                                </Link>
                            )}
                        </div>
                    )}

                    {/* 3. Item Usage History */}
                    {usageHistory.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-slate-700">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                                <ClockIcon className="w-3 h-3"/> Item Usage History
                            </h4>
                            <div className="space-y-2">
                                {usageHistory.map((log) => (
                                    <div key={log.id} className="flex justify-between text-xs bg-slate-900/30 p-2 rounded">
                                        <span className="text-slate-300 font-medium">{log.item_name}</span>
                                        <span className="text-slate-500">
                                            {new Date(log.used_at).toLocaleDateString()} {new Date(log.used_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;