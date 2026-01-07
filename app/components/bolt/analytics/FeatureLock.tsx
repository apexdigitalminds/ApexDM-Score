import React from 'react';
import Link from 'next/link';
import { LockClosedIcon, InformationCircleIcon } from '../icons';
import { useApp } from '@/context/AppContext';



interface FeatureLockProps {
    title: string;
    description: string;
    requiredTier: 'Starter' | 'Pro' | 'Elite';
    children?: React.ReactNode;
}

const FeatureLock: React.FC<FeatureLockProps> = ({ title, description, requiredTier, children }) => {
    const { selectedUser } = useApp();
    const isAdmin = selectedUser?.role === 'admin';

    return (
        <div className="relative bg-slate-800 rounded-2xl shadow-lg overflow-hidden h-full flex flex-col border border-slate-700">
            {/* 1. Plan Badge (Top Right) - Only show tier info for admins */}
            {isAdmin && (
                <div className="absolute top-4 right-4 z-30">
                    <span className="text-[10px] bg-slate-900/80 px-2 py-1 rounded text-slate-300 font-bold border border-slate-600 uppercase tracking-wide backdrop-blur-md">
                        Requires {requiredTier}
                    </span>
                </div>
            )}

            {/* 2. Lock Overlay - Different content for admins vs members */}
            <div className={`absolute inset-0 ${isAdmin ? 'bg-slate-900/40' : 'bg-slate-900/50'} backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-6 z-20`}>
                {isAdmin ? (
                    /* Admin View: Upgrade CTA */
                    <>
                        <div className="bg-slate-800 p-3 rounded-full mb-4 shadow-xl ring-1 ring-white/10">
                            <LockClosedIcon className="w-8 h-8 text-yellow-400" />
                        </div>
                        <p className="text-xl font-bold text-white mb-2">Upgrade to Unlock</p>
                        <p className="text-sm text-slate-300 max-w-xs mb-6">
                            {description}
                        </p>
                        <Link
                            href="/pricing"
                            className="bg-purple-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-purple-700 transition-all transform hover:scale-105 shadow-lg"
                        >
                            View Plans
                        </Link>
                    </>
                ) : (
                    /* Member View: Subtle, friendly message */
                    <>
                        <div className="bg-slate-700/50 p-3 rounded-full mb-4 shadow-lg ring-1 ring-white/5">
                            <InformationCircleIcon className="w-7 h-7 text-slate-400" />
                        </div>
                        <p className="text-lg font-semibold text-slate-200 mb-2">This feature isn't enabled yet</p>
                        <p className="text-sm text-slate-400 max-w-xs">
                            Your community hasn't unlocked this feature. If you'd like access, let your community admin know!
                        </p>
                    </>
                )}
            </div>

            {/* 3. Content Container */}
            <div className="flex flex-col h-full">
                {/* A. Visible Header (Not Blurred) */}
                <div className="p-6 pb-2 z-10 border-b border-white/5">
                    <h3 className="text-lg font-bold text-slate-200">{title}</h3>
                </div>

                {/* B. Blurred Content Preview */}
                <div className="p-6 pt-4 opacity-50 flex-grow select-none pointer-events-none blur-[1px]">
                    {children ? (
                        <div>{children}</div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-slate-400">Sample configuration options would appear here...</p>
                            {/* Generic Skeleton UI */}
                            <div className="h-32 bg-slate-700/50 rounded-lg animate-pulse"></div>
                            <div className="flex gap-4">
                                <div className="h-10 w-1/3 bg-slate-700/50 rounded-lg"></div>
                                <div className="h-10 w-2/3 bg-slate-700/50 rounded-lg"></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FeatureLock;
