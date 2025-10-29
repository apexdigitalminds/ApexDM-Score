import React, { useState } from 'react';
import { useApp } from '../App';
import type { Quest, UserQuestProgress, Badge as BadgeType } from '../types';
import { iconMap, CheckCircleIcon, TrophyIcon } from './icons';
import BadgeItem from './BadgeItem';

interface QuestCardProps {
    quest: Quest;
    progress: UserQuestProgress | undefined;
    onClaim: (questId: string) => void;
    isClaiming: boolean;
}

const QuestCard: React.FC<QuestCardProps> = ({ quest, progress, onClaim, isClaiming }) => {
    const { badgesConfig } = useApp();

    const isCompleted = progress?.completed || false;
    const isClaimed = progress?.claimed || false;
    
    const badgeRewardConfig = quest.badgeReward ? badgesConfig[quest.badgeReward] : null;
    // FIX: With `BadgeConfig` correctly defined, spreading `badgeRewardConfig` now works.
    // Added non-null assertion for `quest.badgeReward` for stricter type safety.
    const badgeReward: BadgeType | null = badgeRewardConfig ? { id: `quest_badge_${quest.id}`, name: quest.badgeReward!, ...badgeRewardConfig} : null;

    return (
        <div className={`bg-slate-800 rounded-2xl shadow-lg border border-slate-700 flex flex-col overflow-hidden transition-all duration-300 ${isClaimed ? 'opacity-50' : ''}`}>
            <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2">{quest.title}</h3>
                <p className="text-slate-400 text-sm mb-4 min-h-[40px]">{quest.description}</p>

                <div className="space-y-3">
                    {quest.tasks.map((task, index) => {
                        const currentProgress = progress?.progress[task.actionType] || 0;
                        const taskComplete = currentProgress >= task.targetCount;
                        const progressPercentage = Math.min((currentProgress / task.targetCount) * 100, 100);

                        return (
                            <div key={index}>
                                <div className="flex justify-between items-center text-sm mb-1">
                                    <div className="flex items-center gap-2">
                                        <CheckCircleIcon className={`w-5 h-5 transition-colors ${taskComplete ? 'text-green-400' : 'text-slate-600'}`} />
                                        <span className={`${taskComplete ? 'text-slate-300' : 'text-slate-400'}`}>{task.description}</span>
                                    </div>
                                    <span className="font-mono text-slate-400">{currentProgress}/{task.targetCount}</span>
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
                     {badgeReward && (
                        <div className="w-24 h-24">
                           <BadgeItem badge={badgeReward}/>
                        </div>
                    )}
                </div>
                <button
                    onClick={() => onClaim(quest.id)}
                    disabled={!isCompleted || isClaimed || isClaiming}
                    className="bg-purple-600 text-white font-semibold py-2 px-5 rounded-lg shadow-md hover:bg-purple-700 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-70"
                >
                    {isClaimed ? 'Claimed' : (isCompleted ? (isClaiming ? 'Claiming...' : 'Claim Reward') : 'In Progress')}
                </button>
            </div>
        </div>
    );
};

const QuestsPage: React.FC = () => {
    const { selectedUser, quests, userQuestProgress, claimQuestReward } = useApp();
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [claimingId, setClaimingId] = useState<string | null>(null);

    const handleClaim = async (questId: string) => {
        if (!selectedUser) return;

        const progress = userQuestProgress.find(p => p.questId === questId);

        if (!progress || !progress.id) {
            setNotification({ type: 'error', message: 'Could not find quest progress to claim.' });
            setTimeout(() => setNotification(null), 3000);
            return;
        }

        setClaimingId(questId);
        const result = await claimQuestReward(progress.id);
        setNotification({
            type: result.success ? 'success' : 'error',
            message: result.message
        });
        setClaimingId(null);
        setTimeout(() => setNotification(null), 3000);
    };

    const activeQuests = quests.filter(q => !userQuestProgress.find(p => p.questId === q.id)?.claimed);
    const completedQuests = quests.filter(q => userQuestProgress.find(p => p.questId === q.id)?.claimed);


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
                                // FIX: Corrected variable from `q` to `quest` to resolve reference error.
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