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
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 justify-items-center">
                {badges.map((userBadge) => {
                    const config = badgesConfig[userBadge.name];
                    const iconName = userBadge.icon || config?.icon || 'Star';
                    const color = userBadge.color || config?.color || '#fbbf24';
                    const description = userBadge.description || config?.description || "No description available";
                    
                    const isPreset = iconMapKeys.includes(iconName);
                    const IconComponent = isPreset ? iconMap[iconName] : null;

                    return (
                        <div key={userBadge.id} className="flex flex-col items-center group relative w-20">
                            {/* Visual Container */}
                            <div 
                                className="w-16 h-16 rounded-2xl flex items-center justify-center border-2 bg-slate-900/50 shadow-md transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:border-opacity-100 border-opacity-70"
                                style={{ borderColor: color }}
                            >
                                {isPreset && IconComponent ? (
                                    <IconComponent className="w-8 h-8 drop-shadow-md transition-transform group-hover:rotate-12" style={{ color }} />
                                ) : (
                                    <span className="text-2xl select-none filter drop-shadow-md transition-transform group-hover:scale-110">
                                        {iconName || "🏆"}
                                    </span>
                                )}
                            </div>
                            
                            {/* Name Label (Visible Always) */}
                            <div className="mt-2 text-center w-full">
                                <p className="text-[10px] font-bold text-slate-300 truncate px-1 group-hover:text-white transition-colors leading-tight">
                                    {userBadge.name}
                                </p>
                            </div>
                            
                            {/* Tooltip (Description on Hover) */}
                            <div className="absolute bottom-full mb-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 bg-slate-900/95 text-slate-200 text-[10px] p-2 rounded-lg shadow-2xl pointer-events-none w-32 text-center z-20 border border-slate-700 backdrop-blur-sm">
                                {description}
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-b border-r border-slate-700 rotate-45"></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default BadgeDisplay;