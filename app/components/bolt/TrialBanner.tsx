"use client";

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';

const TrialBanner = () => {
    const { community } = useApp();

    if (!community?.trialEndsAt) return null;

    const now = new Date();
    const trialEnd = new Date(community.trialEndsAt);
    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft <= 0) return null;

    // 🔧 FIX: Only show trial banner if tier is EXPLICITLY 'trial'
    // If user purchases Starter/Pro/Elite, hide this banner even if trialEndsAt exists
    const currentTier = (community.tier || "starter").toLowerCase();
    if (currentTier !== 'trial') return null;

    return (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 shadow-md relative z-50">
            <div className="container mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-center sm:text-left">
                <div className="flex items-center gap-2">
                    <span className="text-xl">💎</span>
                    {/* FIX: Updated Text */}
                    <span className="font-bold">Elite Trial Active</span>
                </div>
                <span className="hidden sm:inline text-indigo-200">|</span>
                <p>
                    You have <span className="font-bold text-yellow-300">{daysLeft} days</span> left to enjoy all features.
                </p>
                <Link
                    href="/pricing"
                    className="mt-2 sm:mt-0 sm:ml-4 bg-white text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide transition-colors"
                >
                    Upgrade Now
                </Link>
            </div>
        </div>
    );
};

export default TrialBanner;