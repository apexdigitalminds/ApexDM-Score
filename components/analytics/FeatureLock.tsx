import React from 'react';
import { Link } from 'react-router-dom';
import { LockClosedIcon } from '../icons';

interface FeatureLockProps {
    title: string;
    description: string;
    requiredTier: 'Core' | 'Pro';
    children?: React.ReactNode;
}

const FeatureLock: React.FC<FeatureLockProps> = ({ title, description, requiredTier, children }) => (
    <div className="relative bg-slate-800 p-6 rounded-2xl shadow-lg overflow-hidden">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 rounded-2xl z-10">
            <LockClosedIcon className="w-12 h-12 text-yellow-400 mb-4" />
            <p className="text-xl font-bold text-white">Upgrade to Unlock</p>
            <p className="text-sm text-slate-300">
                This feature is available on the <span className="font-bold">{requiredTier}</span> plan.
            </p>
            <Link 
                to="/pricing"
                className="mt-4 bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
            >
                View Plans
            </Link>
        </div>
        <div className="opacity-30">
            <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
            {children ? (
                <div>{children}</div>
            ) : (
                <>
                    <p className="text-sm text-slate-400">{description}</p>
                    <div className="mt-4 h-48 bg-slate-700/50 rounded-lg flex items-center justify-center">
                        <p className="text-slate-500">Chart data would appear here.</p>
                    </div>
                </>
            )}
        </div>
    </div>
);

export default FeatureLock;