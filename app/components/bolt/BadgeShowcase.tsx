"use client";

import React from 'react';
import { useApp } from '@/context/AppContext';
import StreakShowcase from './StreakShowcase';
import type { Badge, BadgeConfig } from '@/types';
import { iconMap, iconMapKeys } from './icons'; // 🟢 Added to handle Icon/Emoji detection

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
            {/* BADGES SECTION */}
            <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
                <h3 className="text-lg font-bold text-white mb-4 text-center">Badge Collection</h3>
                <p className="text-slate-400 text-sm text-center mb-6">Collect unique badges by completing quests and engaging with the community.</p>
                
                {allBadges.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-6 justify-items-center">
                        {allBadges.map((badge) => {
                            // 🟢 FIX: Logic to check if badge uses a Preset Icon or Emoji
                            const isPreset = iconMapKeys.includes(badge.icon);
                            const IconComponent = isPreset ? iconMap[badge.icon] : null;

                            return (
                                <div key={badge.id} className="flex flex-col items-center group relative w-24">
                                    {/* Badge Visual */}
                                    <div 
                                        className="w-20 h-20 rounded-2xl flex items-center justify-center border-2 bg-slate-900/50 shadow-md transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:border-opacity-100 border-opacity-70"
                                        style={{ borderColor: badge.color }}
                                    >
                                        {isPreset && IconComponent ? (
                                            <IconComponent className="w-10 h-10 drop-shadow-md transition-transform group-hover:rotate-12" style={{ color: badge.color }} />
                                        ) : (
                                            // 🟢 Renders Emoji if not a preset
                                            <span className="text-4xl select-none filter drop-shadow-md transition-transform group-hover:scale-110">
                                                {badge.icon || "🏆"}
                                            </span>
                                        )}
                                    </div>
                                    
                                    {/* Name Label */}
                                    <div className="mt-3 text-center w-full">
                                        <p className="text-xs font-bold text-slate-300 truncate px-1 group-hover:text-white transition-colors">{badge.name}</p>
                                    </div>
                                    
                                    {/* Description Tooltip (Hover) */}
                                    <div className="absolute bottom-full mb-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 bg-slate-900/95 text-slate-200 text-[10px] p-3 rounded-lg shadow-2xl pointer-events-none w-40 text-center z-20 border border-slate-700 backdrop-blur-sm">
                                        {badge.description}
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-b border-r border-slate-700 rotate-45"></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-slate-700/30 rounded-xl border border-dashed border-slate-600">
                        <p className="text-slate-500">No badges configured yet.</p>
                    </div>
                )}
            </div>

            <StreakShowcase />
        </div>
    );
};

export default BadgeShowcase;