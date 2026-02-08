"use client";

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';

// Helper to check if tier is at least a certain level
const tierAtLeast = (currentTier: string | undefined, requiredTier: 'starter' | 'pro' | 'elite'): boolean => {
    const tierLower = (currentTier || 'starter').toLowerCase();
    const tierOrder = ['free', 'core', 'starter', 'pro', 'elite'];
    const currentIndex = tierOrder.indexOf(tierLower);
    const requiredIndex = tierOrder.indexOf(requiredTier);
    // free, core, starter all map to the same level (index 0-2)
    const normalizedCurrent = currentIndex <= 2 ? 2 : currentIndex;
    const normalizedRequired = requiredIndex <= 2 ? 2 : requiredIndex;
    return normalizedCurrent >= normalizedRequired;
};

interface SetupStep {
    id: string;
    title: string;
    description: string;
    tab: 'users' | 'engagement' | 'quests' | 'store' | 'settings';
    requiredTier: 'starter' | 'pro' | 'elite';
    icon: string;
}

const SETUP_STEPS: SetupStep[] = [
    {
        id: 'manage-users',
        title: 'Manage Users',
        description: 'View your community members. Search, award XP, and manage badges.',
        tab: 'users',
        requiredTier: 'starter',
        icon: '👥'
    },
    {
        id: 'xp-actions',
        title: 'Set up XP Reward Actions',
        description: 'Set the activity and XP rewards then watch members see their XP grow.',
        tab: 'engagement',
        requiredTier: 'starter',
        icon: '⚡'
    },
    {
        id: 'badges',
        title: 'Create Badges',
        description: 'Design achievement icons for milestones. Award automatically or manually.',
        tab: 'engagement',
        requiredTier: 'starter',
        icon: '🏆'
    },
    {
        id: 'quests',
        title: 'Create Quests',
        description: 'Build multi-step challenges with XP rewards. Guide member behavior.',
        tab: 'quests',
        requiredTier: 'pro',
        icon: '🎯'
    },
    {
        id: 'store',
        title: 'Set up Store Items',
        description: 'Create an XP store with boosters, freezes, and cosmetic rewards.',
        tab: 'store',
        requiredTier: 'elite',
        icon: '🛒'
    },
    {
        id: 'white-label',
        title: 'Configure White-Label Branding',
        description: 'Make this app your own. Customize colors, logo, and branding to match your community.',
        tab: 'settings',
        requiredTier: 'elite',
        icon: '🎨'
    }
];

interface GettingStartedCardProps {
    onNavigateToTab: (tab: 'users' | 'engagement' | 'quests' | 'store' | 'settings') => void;
}

export default function GettingStartedCard({ onNavigateToTab }: GettingStartedCardProps) {
    const { community } = useApp();
    const [isExpanded, setIsExpanded] = useState(true);
    const currentTier = community?.tier;

    // Filter steps based on current tier
    const availableSteps = SETUP_STEPS.filter(step => tierAtLeast(currentTier, step.requiredTier));

    return (
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-300 dark:border-slate-700 border-l-4 border-l-purple-500 overflow-hidden mb-6">
            {/* Header - Always visible */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                        <span className="text-xl">🚀</span>
                    </div>
                    <div className="text-left">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Getting Started</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">Set up your community in a few easy steps</p>
                    </div>
                </div>
                <svg
                    className={`w-5 h-5 text-slate-600 dark:text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Collapsible Content */}
            {isExpanded && (
                <div className="px-6 pb-6">
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {availableSteps.map((step) => (
                            <button
                                key={step.id}
                                onClick={() => onNavigateToTab(step.tab)}
                                className="bg-white/80 hover:bg-white dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-300 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-600 rounded-xl p-4 text-left transition-all duration-200 group shadow-sm"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700/50 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                                        {step.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-slate-900 dark:text-white font-semibold text-sm mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                            {step.title}
                                        </h4>
                                        <p className="text-slate-600 dark:text-slate-400 text-xs">
                                            {step.description}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Tier upgrade hint if not Elite */}
                    {!tierAtLeast(currentTier, 'elite') && (
                        <p className="text-center text-slate-600 dark:text-slate-500 text-xs mt-4">
                            💡 Upgrade your plan to unlock more features
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
