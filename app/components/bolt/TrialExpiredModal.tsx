'use client';
import { useApp } from '@/context/AppContext';
import Link from 'next/link';

// Checkmark icon for positive messaging
const CheckCircleIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);

export default function TrialExpiredModal() {
    const { community, getTrialStatus } = useApp();
    const { isActive } = getTrialStatus();

    // Show only if trial tier but expired
    const showModal = community?.tier === 'trial' && !isActive;

    if (!showModal) return null;

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-slate-800 rounded-xl max-w-lg w-full p-8 text-center border border-slate-700 shadow-2xl">
                <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">
                    Your Elite Trial Has Ended
                </h2>
                <p className="text-slate-300 mb-4">
                    Thanks for trying out our Elite features! You're now on the <strong className="text-green-400">Starter Plan</strong> with full access to:
                </p>

                {/* Starter features list */}
                <ul className="text-left text-sm text-slate-300 mb-6 space-y-2 bg-slate-700/50 rounded-lg p-4">
                    <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span> XP & Leveling System
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span> Daily Streaks & Badges
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span> Leaderboards
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span> Manual Action Tracking
                    </li>
                </ul>

                <div className="flex flex-col gap-3">
                    <Link
                        href="/dashboard"
                        className="block w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition shadow-lg"
                    >
                        Continue with Starter →
                    </Link>
                    <Link
                        href="/pricing"
                        className="block w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-purple-700 transition shadow-lg"
                    >
                        Upgrade for More Features
                    </Link>
                </div>

                <p className="text-xs text-slate-500 mt-4">
                    Need help? Contact apexdigitalminds@gmail.com
                </p>
            </div>
        </div>
    );
}
