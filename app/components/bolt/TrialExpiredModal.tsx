'use client';
import { useApp } from '@/context/AppContext';
import Link from 'next/link';

// Local XCircle icon component
const XCircleIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
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
                <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">
                    Your Elite Trial Has Ended
                </h2>
                <p className="text-slate-300 mb-6">
                    Continue using ApexDM Score by selecting a paid plan that fits your community's needs.
                    All your data is safe and will be available once you upgrade.
                </p>

                <Link
                    href="/pricing"
                    className="block w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-purple-700 transition shadow-lg"
                >
                    Choose Your Plan →
                </Link>

                <p className="text-xs text-slate-500 mt-4">
                    Need help? Contact support@apexdm.com
                </p>
            </div>
        </div>
    );
}
