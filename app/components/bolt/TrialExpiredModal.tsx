'use client';
import { useApp } from '@/context/AppContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Checkmark icon for positive messaging
const CheckCircleIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);

// Spinner icon for loading state
const SpinnerIcon = ({ className }: { className?: string }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export default function TrialExpiredModal() {
    const { community, getTrialStatus, adminUpdateCommunityTier, experienceId } = useApp();
    const { isActive } = getTrialStatus();
    const router = useRouter();
    const [isDowngrading, setIsDowngrading] = useState(false);

    // Show only if trial tier but expired
    const showModal = community?.tier === 'trial' && !isActive;

    if (!showModal) return null;

    // Handle downgrade to Starter (free tier)
    const handleContinueWithStarter = async () => {
        setIsDowngrading(true);
        try {
            // Update tier to 'Core' which maps to Starter/Free in the system
            // Note: The API uses 'Core' as the value for free tier
            const success = await adminUpdateCommunityTier('Core');
            if (success) {
                // Navigate to dashboard after tier update
                const dashboardPath = experienceId ? `/dashboard/${experienceId}` : '/admin';
                router.push(dashboardPath);
                router.refresh(); // Force refresh to reload community data
            } else {
                alert('Failed to update tier. Please try again or contact support.');
                setIsDowngrading(false);
            }
        } catch (error) {
            console.error('Error downgrading tier:', error);
            alert('An error occurred. Please try again.');
            setIsDowngrading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-slate-800 rounded-xl max-w-lg w-full p-8 text-center border border-slate-700 shadow-2xl">
                <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">
                    Your Elite Trial Has Ended
                </h2>
                <p className="text-slate-300 mb-4">
                    Thanks for trying out our Elite features! You can continue with the <strong className="text-green-400">Starter Plan</strong> which includes:
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
                    <button
                        onClick={handleContinueWithStarter}
                        disabled={isDowngrading}
                        className="block w-full bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-wait text-white font-bold py-3 px-6 rounded-lg transition shadow-lg flex items-center justify-center gap-2"
                    >
                        {isDowngrading ? (
                            <>
                                <SpinnerIcon className="w-5 h-5" />
                                Switching to Starter...
                            </>
                        ) : (
                            'Continue with Starter →'
                        )}
                    </button>
                    <Link
                        href="/pricing"
                        className="block w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-purple-700 transition shadow-lg text-center"
                    >
                        Upgrade for More Features
                    </Link>
                </div>

                <p className="text-xs text-slate-400 mt-4">
                    <strong>Note:</strong> If you started a trial with payment details, remember to cancel in Whop to avoid being charged.
                </p>
                <p className="text-xs text-slate-500 mt-2">
                    Need help? Contact apexdigitalminds@gmail.com
                </p>
            </div>
        </div>
    );
}
