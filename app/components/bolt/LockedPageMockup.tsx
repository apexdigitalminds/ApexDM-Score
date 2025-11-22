import React from 'react';
import FeatureLock from './analytics/FeatureLock';

interface LockedPageMockupProps {
    title: string;
    description: string;
    requiredTier: 'Pro' | 'Elite';
    mockType: 'charts' | 'grid' | 'list'| 'form'; // Choose a visual style
}

const LockedPageMockup: React.FC<LockedPageMockupProps> = ({ title, description, requiredTier, mockType }) => {
    return (
        <div className="h-[80vh] w-full">
            <FeatureLock 
                title={title} 
                description={description} 
                requiredTier={requiredTier}
            >
                {/* DYNAMIC SKELETON UI based on type */}
                <div className="space-y-6 pt-4">
                    
                    {/* Fake Filters */}
                    <div className="flex gap-4">
                        <div className="h-10 w-32 bg-slate-700/50 rounded-lg"></div>
                        <div className="h-10 w-48 bg-slate-700/50 rounded-lg"></div>
                        <div className="flex-grow"></div>
                        <div className="h-10 w-24 bg-purple-600/20 rounded-lg"></div>
                    </div>

                    {/* Mock Content */}
                    {mockType === 'charts' && (
                        <div className="grid grid-cols-2 gap-6">
                            <div className="h-64 bg-slate-700/30 rounded-xl border border-slate-700/50"></div>
                            <div className="h-64 bg-slate-700/30 rounded-xl border border-slate-700/50"></div>
                            <div className="h-64 col-span-2 bg-slate-700/30 rounded-xl border border-slate-700/50"></div>
                        </div>
                    )}

                    {mockType === 'grid' && (
                        <div className="grid grid-cols-3 gap-6">
                            {[1,2,3,4,5,6].map(i => (
                                <div key={i} className="h-48 bg-slate-700/30 rounded-xl border border-slate-700/50 flex flex-col p-4 gap-3">
                                    <div className="h-8 w-8 rounded-full bg-slate-600/50"></div>
                                    <div className="h-4 w-3/4 bg-slate-600/50 rounded"></div>
                                    <div className="h-20 w-full bg-slate-600/20 rounded mt-auto"></div>
                                </div>
                            ))}
                        </div>
                    )}

mockType === 'form' && (
    <div className="max-w-2xl space-y-8">
        {[1, 2, 3].map(i => (
            <div key={i} className="space-y-3">
                <div className="h-4 w-32 bg-slate-600/50 rounded"></div>
                <div className="h-12 w-full bg-slate-700/30 rounded-lg border border-slate-700/50"></div>
            </div>
        ))}
        <div className="h-10 w-32 bg-purple-600/20 rounded-lg mt-8"></div>
    </div>
){'}'}
                </div>
            </FeatureLock>
        </div>
    );
};

export default LockedPageMockup;