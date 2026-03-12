"use client";

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';

interface OnboardingModalProps {
    onNavigateToSetup: () => void;
}

export default function OnboardingModal({ onNavigateToSetup }: OnboardingModalProps) {
    const { community } = useApp();
    const [isVisible, setIsVisible] = useState(false);

    // Community-scoped localStorage key prevents cross-community leakage
    const storageKey = community?.id
        ? `apexdm_onboarding_seen_${community.id}`
        : 'apexdm_admin_onboarding_seen';

    useEffect(() => {
        if (!community) return; // Wait for community to load
        const hasSeen = typeof window !== 'undefined' && (
            localStorage.getItem(storageKey) === 'true' ||
            localStorage.getItem('apexdm_admin_onboarding_seen') === 'true' // Legacy key fallback
        );
        if (!hasSeen) {
            setIsVisible(true);
        }
    }, [community, storageKey]);

    const handleDismiss = () => {
        setIsVisible(false);
        if (typeof window !== 'undefined') {
            localStorage.setItem(storageKey, 'true');
            localStorage.setItem('apexdm_admin_onboarding_seen', 'true'); // Legacy compat
        }
    };

    const handleGetStarted = () => {
        handleDismiss();
        onNavigateToSetup();
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-slate-700 animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Welcome to CommunityXP! 🎉</h2>
                    <p className="text-slate-400">
                        Let's get your community set up with XP rewards, badges, and more.
                    </p>
                </div>

                {/* Highlights */}
                <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400">
                            <span>✓</span>
                        </div>
                        <span className="text-slate-300">Configure XP reward actions</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400">
                            <span>✓</span>
                        </div>
                        <span className="text-slate-300">Create custom badges for achievements</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400">
                            <span>✓</span>
                        </div>
                        <span className="text-slate-300">Set up leaderboards and engagement</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <button
                        onClick={handleGetStarted}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
                    >
                        Get Started →
                    </button>
                    <button
                        onClick={handleDismiss}
                        className="w-full text-slate-400 hover:text-white text-sm py-2 transition-colors"
                    >
                        I'll explore on my own
                    </button>
                </div>
            </div>
        </div>
    );
}


