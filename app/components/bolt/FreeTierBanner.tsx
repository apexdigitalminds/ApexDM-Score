'use client';
import { useApp } from '@/context/AppContext';
import Link from 'next/link';
import { ClockIcon } from './icons';

/**
 * FreeTierBanner - Shows upgrade CTA for Free tier users
 * 
 * Displays two banners (matching trial banner style):
 * 1. Top thin bar: "You're on the Free Plan | Start Your 14-Day Elite Trial →"
 * 2. Purple gradient: "Unlock Elite Features | Get XP Store, Quests, Analytics, and more"
 */
export function FreeTierTopBanner() {
    const { community, selectedUser } = useApp();

    // Only show for admin users on Starter tier (free tier)
    // Members can't upgrade the community, so don't show them upgrade prompts
    if (selectedUser?.role !== 'admin') return null;

    // Note: Database uses 'Core' for Starter, UI shows as 'Starter'
    const currentTier = (community?.tier || 'starter').toLowerCase();
    if (currentTier !== 'starter' && currentTier !== 'free' && currentTier !== 'core') return null;


    return (
        <div className="bg-slate-800 text-white py-2 px-4 text-center text-sm shadow-lg">
            <div className="container mx-auto flex items-center justify-center gap-2">
                <ClockIcon className="w-4 h-4 text-slate-400" />
                <span>
                    You're on the <strong>Starter Plan</strong>
                </span>
                <Link
                    href="/pricing"
                    className="ml-2 text-purple-400 underline font-semibold hover:text-purple-300 transition"
                >
                    Start Your 14-Day Elite Trial →
                </Link>
            </div>
        </div>
    );
}

export function FreeTierGradientBanner() {
    const { community, selectedUser } = useApp();

    // Only show for admin users on Starter tier (free tier)
    // Members can't upgrade the community, so don't show them upgrade prompts
    if (selectedUser?.role !== 'admin') return null;

    // Note: Database uses 'Core' for Starter, UI shows as 'Starter'
    const currentTier = (community?.tier || 'starter').toLowerCase();
    if (currentTier !== 'starter' && currentTier !== 'free' && currentTier !== 'core') return null;


    return (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 shadow-md relative z-50">
            <div className="container mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-center sm:text-left">
                <div className="flex items-center gap-2">
                    <span className="text-xl">✨</span>
                    <span className="font-bold">Unlock Elite Features</span>
                </div>
                <span className="hidden sm:inline text-indigo-200">|</span>
                <p>
                    Get <span className="font-bold text-yellow-300">XP Store, Quests, Analytics</span>, and more.
                </p>
                <Link
                    href="/pricing"
                    className="mt-2 sm:mt-0 sm:ml-4 bg-white text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide transition-colors"
                >
                    Start Free Trial
                </Link>
            </div>
        </div>
    );
}

export default FreeTierGradientBanner;
