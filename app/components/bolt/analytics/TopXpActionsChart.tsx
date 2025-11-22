import React from 'react';
import { TrophyIcon } from '../icons';

interface ChartData {
    actionType: string;
    totalXp: number;
}

interface TopXpActionsChartProps {
    data: ChartData[];
}

const TopXpActionsChart: React.FC<TopXpActionsChartProps> = ({ data }) => {
    const maxTotalXp = Math.max(...data.map(item => item.totalXp), 0);

    if (data.length === 0) {
        return (
             <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8">
                <TrophyIcon className="w-10 h-10 mb-2 text-slate-600"/>
                <p className="font-semibold">No XP Data Available</p>
                <p className="text-sm">Perform some actions to see data here.</p>
            </div>
        );
    }
    
    return (
        <div>
            <div className="flex items-center gap-3 mb-4">
                <TrophyIcon className="w-6 h-6 text-yellow-400" />
                <h3 className="text-lg font-bold text-white">Top XP-Generating Actions</h3>
            </div>
            <div className="space-y-3">
                {data.map(item => (
                    <div key={item.actionType} className="grid grid-cols-4 items-center gap-4 text-sm">
                        <div className="col-span-1 text-slate-300 truncate">{item.actionType}</div>
                        <div className="col-span-3 flex items-center gap-2">
                             <div className="w-full bg-slate-700 rounded-full h-4">
                                <div
                                    className="bg-gradient-to-r from-yellow-500 to-orange-500 h-4 rounded-full"
                                    style={{ width: `${maxTotalXp > 0 ? (item.totalXp / maxTotalXp) * 100 : 0}%` }}
                                ></div>
                            </div>
                            <div className="font-bold text-white w-16 text-right">{item.totalXp.toLocaleString()} XP</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TopXpActionsChart;