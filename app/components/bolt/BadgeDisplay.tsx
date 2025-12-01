"use client";

import React from 'react';
import { useApp } from '@/context/AppContext';
import { iconMap, iconMapKeys } from './icons';
import type { Badge } from '@/types';

interface BadgeDisplayProps {
    badges: Badge[];
}

const BadgeDisplay: React.FC<BadgeDisplayProps> = ({ badges }) => {
    const { badgesConfig } = useApp();

    if (!badges || badges.length === 0) {
        return (
            <div className="bg-slate-800 p-6 rounded-2xl shadow-lg h-full flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
                    <span className="text-3xl grayscale opacity-50">🏆</span>
                </div>
                <h3 className="text-lg font-bold text-white">No Badges Yet</h3>
                <p className="text-sm text-slate-400">Complete quests to earn your first badge!</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-800 p-6 rounded-2xl shadow-lg h-full">
            <h3 className="text-lg font-bold text-white mb-4">Earned Badges</h3>
            <div className="grid grid-cols-4 gap-4">
                {badges.map((userBadge) => {
                    // 🟢 HYDRATION: Look up config by name if details are missing
                    const config = badgesConfig[userBadge.name];
                    const iconName = userBadge.icon || config?.icon || 'Star';
                    const color = userBadge.color || config?.color || '#fbbf24';
                    
                    const isPreset = iconMapKeys.includes(iconName);
                    const IconComponent = isPreset ? iconMap[iconName] : null;

                    return (
                        <div key={userBadge.id} className="flex flex-col items-center group relative">
                            <div 
                                className="w-12 h-12 rounded-xl flex items-center justify-center border-2 bg-slate-900/50 shadow-md transition-all duration-300 group-hover:scale-110"
                                style={{ borderColor: color }}
                            >
                                {isPreset && IconComponent ? (
                                    <IconComponent className="w-6 h-6" style={{ color }} />
                                ) : (
                                    <span className="text-xl select-none filter drop-shadow-md">
                                        {iconName || "🏆"}
                                    </span>
                                )}
                            </div>
                            
                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none">
                                {userBadge.name}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default BadgeDisplay;