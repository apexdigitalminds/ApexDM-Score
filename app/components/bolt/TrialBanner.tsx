"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';

const TrialBanner = () => {
    const { community, adminUpdateCommunityTier, experienceId } = useApp();
    const router = useRouter();
    const [showConfirm, setShowConfirm] = useState(false);
    const [isDowngrading, setIsDowngrading] = useState(false);

    if (!community?.trialEndsAt) return null;

    const now = new Date();
    const trialEnd = new Date(community.trialEndsAt);
    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft <= 0) return null;

    // 🔧 FIX: Only show trial banner if tier is EXPLICITLY 'trial'
    const currentTier = (community.tier || "starter").toLowerCase();
    if (currentTier !== 'trial') return null;

    // Handle early downgrade to Starter
    const handleDowngrade = async () => {
        setIsDowngrading(true);
        try {
            const success = await adminUpdateCommunityTier('Core' as any);
            if (success) {
                setShowConfirm(false);
                const dashboardPath = experienceId ? `/dashboard/${experienceId}` : '/admin';
                router.push(dashboardPath);
                router.refresh();
            }
        } catch (error) {
            console.error('Downgrade failed:', error);
            alert('Failed to switch to Starter. Please try again.');
        } finally {
            setIsDowngrading(false);
        }
    };

    return (
        <>
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 shadow-md relative z-50">
                <div className="container mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-center sm:text-left">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">💎</span>
                        <span className="font-bold">Elite Trial Active</span>
                    </div>
                    <span className="hidden sm:inline text-indigo-200">|</span>
                    <p>
                        You have <span className="font-bold text-yellow-300">{daysLeft} days</span> left to enjoy all features.
                    </p>
                    <div className="flex gap-2 mt-2 sm:mt-0 sm:ml-4">
                        <Link
                            href="/pricing"
                            className="bg-white text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide transition-colors"
                        >
                            Upgrade Now
                        </Link>
                        <button
                            onClick={() => setShowConfirm(true)}
                            className="bg-transparent text-white/80 hover:text-white border border-white/30 hover:border-white px-3 py-1 rounded-full text-xs font-medium transition-colors"
                        >
                            Switch to Starter
                        </button>
                    </div>
                </div>
            </div>

            {/* Downgrade Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-xl max-w-md w-full p-6 border border-slate-700 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-3">Switch to Starter Plan?</h3>
                        <p className="text-slate-300 text-sm mb-4">
                            You'll lose access to Elite features like:
                        </p>
                        <ul className="text-sm text-slate-400 mb-4 space-y-1">
                            <li>• XP Store & Item Inventory</li>
                            <li>• Advanced Analytics</li>
                            <li>• Quests & Challenges</li>
                            <li>• White-label Branding</li>
                        </ul>
                        <p className="text-slate-300 text-sm mb-4">
                            You'll keep basic features: XP, Streaks, Badges, and Leaderboards.
                        </p>
                        <div className="bg-amber-900/30 border border-amber-600/50 rounded-lg p-3 mb-6">
                            <p className="text-amber-400 text-sm font-medium flex items-start gap-2">
                                <span className="text-lg leading-none">⚠️</span>
                                <span>Your free trial will expire immediately and <strong>cannot be claimed again</strong>. This action is permanent.</span>
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                disabled={isDowngrading}
                                className="flex-1 py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                            >
                                Keep Trial
                            </button>
                            <button
                                onClick={handleDowngrade}
                                disabled={isDowngrading}
                                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                {isDowngrading ? (
                                    <>
                                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Switching...
                                    </>
                                ) : (
                                    'Switch to Starter'
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-4 text-center">
                            You can upgrade anytime from the Pricing page.
                        </p>
                    </div>
                </div>
            )}
        </>
    );
};

export default TrialBanner;