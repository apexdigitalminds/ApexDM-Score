import React from 'react';
import { useApp } from '@/context/AppContext';
import type { Reward } from '@/types';
import BadgeShowcase from './BadgeShowcase';
import StreakShowcase from './StreakShowcase';
import { TrophyIcon } from './icons';

const CollectionPage: React.FC = () => {
    const { rewardsConfig } = useApp();

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Collection & Rewards</h1>
                <p className="text-slate-400">Discover all the badges you can earn and how to gain XP.</p>
            </div>

            <BadgeShowcase />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                        <TrophyIcon className="w-6 h-6 text-yellow-400"/>
                        <h3 className="text-lg font-bold text-white">How to Earn XP</h3>
                    </div>
                    <p className="text-sm text-slate-400 mb-4">Performing any of these actions daily will maintain your streak.</p>
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2 text-sm">
                        {Object.entries(rewardsConfig).map(([action, config]) => (
                            <div key={action} className="flex justify-between items-center p-3 bg-slate-700/50 rounded-md">
                                <span className="text-slate-300 capitalize">{action.replace(/_/g, ' ')}</span>
                                <span className="font-bold text-blue-400">+{ (config as Reward).xpGained } XP</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-8">
                     <StreakShowcase />
                </div>
            </div>
        </div>
    );
};

export default CollectionPage;