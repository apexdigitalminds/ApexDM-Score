'use client';
import { useApp } from '@/context/AppContext';
import Link from 'next/link';
import { ClockIcon } from './icons'; // Local icon

export default function TrialStatusBanner() {
    const { community, getTrialStatus } = useApp();
    const { isActive, daysRemaining } = getTrialStatus();

    if (!isActive || community?.tier !== 'trial') return null;

    const urgencyColor = daysRemaining <= 3 ? 'bg-red-500' : 'bg-blue-500';
    const pulseAnimation = daysRemaining <= 3 ? 'animate-pulse' : '';

    return (
        <div className={`${urgencyColor} ${pulseAnimation} text-white py-2 px-4 text-center text-sm shadow-lg`}>
            <div className="container mx-auto flex items-center justify-center gap-2">
                <ClockIcon className="w-4 h-4" />
                <span>
                    <strong>{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</strong> left in your Elite trial
                </span>
                <Link
                    href="/pricing"
                    className="ml-2 underline font-semibold hover:text-slate-200 transition"
                >
                    Choose Your Plan →
                </Link>
            </div>
        </div>
    );
}
