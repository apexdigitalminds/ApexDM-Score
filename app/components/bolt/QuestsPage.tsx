"use client";

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import type { Quest, UserQuestProgress, Badge as BadgeType } from '@/types';
import { iconMap, iconMapKeys, CheckCircleIcon, TrophyIcon } from './icons';
import LockedPageMockup from './LockedPageMockup';

interface QuestCardProps {
    quest: Quest;
    progress: UserQuestProgress | undefined;
    onClaim: (questId: string) => void;
    isClaiming: boolean;
}

const QuestCard: React.FC<QuestCardProps> = ({ quest, progress, onClaim, isClaiming }) => {
    const { badgesConfig } = useApp();

    const isCompleted = progress?.completed || false;
    const isClaimed = progress?.isClaimed || false; 
    
    const badgeRewardName = quest.badgeReward;
    const badgeRewardConfig = badgeRewardName ? badgesConfig[badgeRewardName] : null;
    
    // 🟢 Helper to render mini badge icon
    const renderMiniBadge = () => {
        if (!badgeRewardConfig) return null;
        
        const iconName = badgeRewardConfig.icon;
        const color = badgeRewardConfig.color;
        const isPreset = iconMapKeys.includes(iconName);
        const IconComponent = isPreset ? iconMap[iconName] : null;

        return (
            <div className="w-5 h-5 rounded flex items-center justify-center border border-white/20 bg-slate-900" style={{ borderColor: color }}>
                 {isPreset && IconComponent ? (
                    <IconComponent className="w-3 h-3" style={{ color }} />
                ) : (
                    <span className="text-[10px] leading-none">{iconName || "🏆"}</span>
                )}
            </div>
        );
    };

    return (
        <div className={`bg-slate-800 rounded-2xl shadow-lg border border-slate-700 flex flex-col overflow-hidden transition-all duration-300 ${isClaimed ? 'opacity-50' : ''}`}>
            <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2">{quest.title}</h3>
                <p className="text-slate-400 text-sm mb-4 min-h-[40px]">{quest.description}</p>

                <div className="space-y-3">
                    {(quest.tasks || []).map((task, index) => {
                        const safeActionType = task.actionType || 'unknown';
                        const safeTarget = task.targetCount || 1;
                        
                        const description = task.description || `${safeActionType.replace(/_/g, ' ')} (${safeTarget}x)`;

                        const currentProgress = progress?.progress?.[safeActionType] || 0;
                        const taskComplete = currentProgress >= safeTarget;
                        const progressPercentage = Math.min((currentProgress / safeTarget) * 100, 100);

                        return (
                            <div key={index}>
                                <div className="flex justify-between items-center text-sm mb-1">
                                    <div className="flex items-center gap-2">
                                        <CheckCircleIcon className={`w-5 h-5 transition-colors ${taskComplete ? 'text-green-400' : 'text-slate-600'}`} />
                                        <span className={`${taskComplete ? 'text-slate-300' : 'text-slate-400'}`}>{description}</span>
                                    </div>
                                    <span className="font-mono text-slate-400">{currentProgress}/{safeTarget}</span>
                                </div>
                                <div className="w-full bg-slate-700 rounded-full h-2">
                                    <div 
                                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${progressPercentage}%`}}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            <div className="bg-slate-700/50 mt-auto p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-yellow-400">
                        <TrophyIcon className="w-5 h-5" />
                        <span className="font-bold text-lg">{quest.xpReward} XP</span>
                    </div>
                    
                     {badgeRewardConfig && (
                        <div className="flex items-center gap-2 bg-slate-800 px-2 py-1 rounded border border-slate-600">
                           {renderMiniBadge()}
                           <span className="text-xs font-bold text-slate-300 truncate max-w-[100px]">{badgeRewardName}</span>
                        </div>
                    )}
                </div>
                <button
                    onClick={() => onClaim(quest.id)}
                    disabled={!isCompleted || isClaimed || isClaiming}
                    className={`
                        font-semibold py-2 px-5 rounded-lg shadow-md transition-colors 
                        ${isClaimed 
                            ? 'bg-green-600/20 text-green-400 cursor-default border border-green-600/50' 
                            : 'bg-purple-600 text-white hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-70'
                        }
                    `}
                >
                    {isClaimed ? 'Claimed' : (isCompleted ? (isClaiming ? 'Claiming...' : 'Claim Reward') : 'In Progress')}
                </button>
            </div>
        </div>
    );
};

const QuestsPage: React.FC = () => {
    const { selectedUser, questsAdmin, userQuestProgress, claimQuestReward, isFeatureEnabled } = useApp();
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [claimingId, setClaimingId] = useState<string | null>(null);

    if (!isFeatureEnabled('quests')) {
        return (
            <LockedPageMockup 
                title="Quests System" 
                description="Create engaging quests to automate member participation and rewards." 
                requiredTier="Pro"
                mockType="list"
            />
        );
    }

    const handleClaim = async (questId: string) => {
        if (!selectedUser) return;

        const progress = userQuestProgress.find(p => p.questId === questId);

        if (!progress || !progress.id) {
            setNotification({ type: 'error', message: 'Could not find quest progress to claim.' });
            setTimeout(() => setNotification(null), 3000);
            return;
        }
        
        setClaimingId(questId);
        const result = await claimQuestReward(Number(progress.id));
        setNotification({
            type: result.success ? 'success' : 'error',
            message: result.message
        });
        setClaimingId(null);
        setTimeout(() => setNotification(null), 3000);
    };

    const activeQuests = questsAdmin.filter(q => 
        q.isActive && 
        !userQuestProgress.find(p => p.questId === q.id)?.isClaimed
    );
    
    const completedQuests = questsAdmin.filter(q => 
        userQuestProgress.find(p => p.questId === q.id)?.isClaimed
    );

    return (
        <div className="space-y-8">
             {notification && (
                <div className={`fixed top-20 right-8 text-white px-4 py-2 rounded-lg shadow-lg z-20 border ${notification.type === 'success' ? 'bg-green-600 border-green-500' : 'bg-red-600 border-red-500'}`}>
                {notification.message}
                </div>
            )}
            <div>
                <h1 className="text-3xl font-bold">Active Quests</h1>
                <p className="text-slate-400">Complete these challenges to earn XP and unique badges.</p>
            </div>

            {activeQuests.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeQuests.map(quest => (
                        <QuestCard 
                            key={quest.id} 
                            quest={quest} 
                            progress={userQuestProgress.find(p => p.questId === quest.id)}
                            onClaim={handleClaim}
                            isClaiming={claimingId === quest.id}
                        />
                    ))}
                </div>
            ): (
                <div className="text-center py-12 bg-slate-800 rounded-2xl">
                    <p className="text-slate-500">No active quests right now. Check back soon!</p>
                </div>
            )}
            
            {completedQuests.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold mt-12 mb-4">Completed Quests</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {completedQuests.map(quest => (
                            <QuestCard 
                                key={quest.id} 
                                quest={quest} 
                                progress={userQuestProgress.find(p => p.questId === quest.id)}
                                onClaim={() => {}}
                                isClaiming={false}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuestsPage;