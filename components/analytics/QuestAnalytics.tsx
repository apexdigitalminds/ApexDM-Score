import React from 'react';
import { TargetIcon } from '../icons';

interface QuestData {
    questId: string;
    title: string;
    participationRate: number;
    completionRate: number;
}

interface QuestAnalyticsProps {
    data: QuestData[];
}

const QuestAnalytics: React.FC<QuestAnalyticsProps> = ({ data }) => {
    return (
        <div className="bg-slate-800 p-6 rounded-2xl shadow-lg h-full">
            <div className="flex items-center gap-3 mb-4">
                <TargetIcon className="w-6 h-6 text-green-400" />
                <h3 className="text-lg font-bold text-white">Quest Funnel Analytics</h3>
            </div>
            {data.length > 0 ? (
                <div className="space-y-4">
                    {data.map(quest => (
                        <div key={quest.questId} className="bg-slate-700/50 p-4 rounded-lg">
                            <p className="font-semibold text-white truncate">{quest.title}</p>
                            <div className="flex justify-between items-center mt-2 text-sm">
                                <span className="text-slate-400">Participation Rate:</span>
                                <span className="font-bold text-white">{quest.participationRate.toFixed(1)}%</span>
                            </div>
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-400">Completion Rate:</span>
                                <span className="font-bold text-white">{quest.completionRate.toFixed(1)}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex items-center justify-center h-4/5 text-slate-500 text-center">
                    <p>No active quests to analyze.</p>
                </div>
            )}
        </div>
    );
};

export default QuestAnalytics;