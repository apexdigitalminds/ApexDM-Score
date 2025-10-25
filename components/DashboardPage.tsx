

import React, { useState } from 'react';
import { useApp } from '../App';
import { recordAction } from '../services/xpService';
import type { Action, ActionType } from '../types';
import XPProgress from './XPProgress';
import StreakCounter from './StreakCounter';
import BadgeDisplay from './BadgeDisplay';
import Leaderboard from './Leaderboard';
import ActionButton from './ActionButton';
import StreakShowcase from './StreakShowcase';
import BadgeShowcase from './BadgeShowcase';

const XpNotification: React.FC<{ amount: number }> = ({ amount }) => {
    return (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-blue-500 to-purple-600 text-white text-3xl font-bold px-8 py-4 rounded-2xl shadow-2xl animate-fade-up-out pointer-events-none z-50">
            +{amount} XP
        </div>
    );
};

const DashboardPage: React.FC = () => {
    const { db, selectedUser, allUsers, rewardsConfig, badgesConfig } = useApp();
    const userActions = selectedUser ? db.actions.getAllForUser(selectedUser.id) : [];

    const [xpGained, setXpGained] = useState<number | null>(null);

    const handleAction = (actionType: ActionType) => {
        if (!selectedUser) return;
        const result = recordAction(db, selectedUser.id, actionType, rewardsConfig, badgesConfig);
        if (result) {
            setXpGained(result.xpGained);
            setTimeout(() => setXpGained(null), 2000);
        }
    };

    if (!selectedUser) {
        return <div className="text-center p-8">Loading user data...</div>;
    }

    return (
        <div className="space-y-6">
            {xpGained && <XpNotification amount={xpGained} />}
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

            {/* Top Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <XPProgress xp={selectedUser.xp} />
                </div>
                <div>
                    <StreakCounter streak={selectedUser.streak} />
                </div>
            </div>

            {/* Mid Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <BadgeDisplay badges={selectedUser.badges} />
                </div>
                <div>
                    <Leaderboard users={allUsers} currentUserId={selectedUser.id} />
                </div>
            </div>
            
            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-800 p-6 rounded-2xl shadow-lg">
                     <h3 className="text-lg font-bold text-white mb-4">Recent Actions</h3>
                     <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                        {userActions.map(action => (
                            <div key={action.id} className="flex justify-between items-center text-sm">
                                <p className="text-slate-300">
                                    Performed <span className="font-semibold text-white">{action.actionType.replace(/_/g, ' ')}</span>
                                </p>
                                <div className="flex items-center gap-4">
                                     <span className="text-slate-400">{new Date(action.timestamp).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                                     <span className="font-bold text-blue-400 text-right w-16">+{action.xpGained} XP</span>
                                </div>
                            </div>
                        ))}
                     </div>
                </div>
                <div className="bg-slate-800 p-6 rounded-2xl shadow-lg flex flex-col justify-center text-center">
                    <h3 className="text-lg font-bold text-white mb-2">Community Engagement</h3>
                    <p className="text-sm text-slate-400">XP is awarded automatically for actions like renewing subscriptions or participating in events.</p>
                </div>
            </div>

            {/* Showcase Section */}
            <div className="pt-6 space-y-6">
                <StreakShowcase />
                <BadgeShowcase />
            </div>
        </div>
    );
};

export default DashboardPage;