import React from 'react';
import { useApp } from '@/context/AppContext';
import BadgeItem from './BadgeItem';
import StreakShowcase from './StreakShowcase'; // ADDED IMPORT
import type { Badge, BadgeConfig } from '@/types';

const BadgeShowcase: React.FC = () => {
    const { badgesConfig } = useApp();

    const allBadges: Badge[] = Object.entries(badgesConfig).map(([name, config], index) => ({
        id: `showcase_${index}`,
        name,
        description: (config as BadgeConfig).description,
        icon: (config as BadgeConfig).icon,
        color: (config as BadgeConfig).color,
        communityId: '',
        isActive: true
    }));

    return (
        <div className="space-y-8">
            {/* SECTION 1: BADGES */}
            <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
                <h3 className="text-lg font-bold text-white mb-4 text-center">Badge Collection</h3>
                <p className="text-slate-400 text-sm text-center mb-6">Collect unique badges by completing quests and engaging with the community.</p>
                
                {allBadges.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-4">
                        {allBadges.map((badge) => (
                            <div key={badge.id} className="flex flex-col items-center">
                                <BadgeItem badge={badge} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-slate-700/30 rounded-xl border border-dashed border-slate-600">
                        <p className="text-slate-500">No badges configured yet.</p>
                    </div>
                )}
            </div>

            {/* SECTION 2: STREAK TIERS (MOVED FROM DASHBOARD) */}
            <StreakShowcase />
        </div>
    );
};

export default BadgeShowcase;