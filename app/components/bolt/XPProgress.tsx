"use client";

import React from 'react';

interface XPProgressProps {
    xp: number;
}

const XPProgress: React.FC<XPProgressProps> = ({ xp }) => {
    
    // 🟢 UPDATED: Badge Tiers to match AppContext & Admin Settings
    const TIERS = [
        { name: 'Rookie', threshold: 0 },       // 0 - 99
        { name: 'Novice', threshold: 100 },     // 100 - 999
        { name: 'Adept', threshold: 1000 },     // 1,000 - 4,999
        { name: 'Veteran', threshold: 5000 },   // 5,000 - 9,999
        { name: 'Master', threshold: 10000 }    // 10,000+
    ];

    // 1. Determine Current Tier Info
    // We reverse finding the first tier that is <= current XP
    const currentTierIndex = [...TIERS].reverse().findIndex(t => xp >= t.threshold);
    const actualTierIndex = currentTierIndex >= 0 ? TIERS.length - 1 - currentTierIndex : 0;
    
    const currentTier = TIERS[actualTierIndex];
    const nextTier = TIERS[actualTierIndex + 1];

    // 2. Calculate Progress Percentage
    let progressPercent = 0;
    let xpToNext = 0;

    if (nextTier) {
        const tierStart = currentTier.threshold;
        const tierEnd = nextTier.threshold;
        const tierRange = tierEnd - tierStart;
        const xpInTier = xp - tierStart;
        
        progressPercent = Math.min((xpInTier / tierRange) * 100, 100);
        xpToNext = tierEnd - xp;
    } else {
        // Max Level reached
        progressPercent = 100;
        xpToNext = 0;
    }

    return (
        <div className="bg-slate-800 p-6 rounded-2xl shadow-lg w-full h-full flex flex-col justify-center">
            <div className="flex justify-between items-center mb-4">
                {/* 🟢 FIX: Updated classes to match 'Earned Badges' header size/color */}
                <span className="text-lg font-bold text-white">
                    {currentTier.name} (Level {actualTierIndex + 1})
                </span>
                
                <span className="text-lg font-bold text-white">{xp.toLocaleString()} XP</span>
            </div>
            
            <div className="w-full bg-slate-700 rounded-full h-4 relative overflow-hidden">
                <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${Math.max(progressPercent, 5)}%` }} // Min 5% for visibility
                >
                </div>
                {/* Pulse overlay */}
                <div className="absolute inset-0 bg-purple-500/30 rounded-full animate-pulse"></div>
            </div>
            
            <div className="text-right text-sm text-slate-400 mt-2">
                {!nextTier ? 'Max Rank Achieved!' : `${xpToNext.toLocaleString()} XP to next level`}
            </div>
        </div>
    );
};

export default XPProgress;