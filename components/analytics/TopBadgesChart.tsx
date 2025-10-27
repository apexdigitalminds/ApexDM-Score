import React from 'react';
import type { Badge } from '../../types';
import { iconMap, CrownIcon } from '../icons';

interface BadgeStat extends Badge {
    count: number;
}

interface TopBadgesChartProps {
    data: {
        name: string;
        count: number;
        icon: string;
        color: string;
    }[];
}

const BadgeStatItem: React.FC<{ badge: BadgeStat }> = ({ badge }) => {
    const IconComponent = iconMap[badge.icon] || iconMap['Star'];

    return (
        <div className="relative bg-slate-700/50 p-3 rounded-xl flex flex-col items-center justify-center text-center aspect-square">
            <div className="absolute top-1 right-1 bg-purple-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {badge.count}
            </div>
            <IconComponent 
                className="w-8 h-8 mb-1" 
                style={{ color: badge.color }}
            />
            <p className="font-semibold text-xs text-slate-300">{badge.name}</p>
        </div>
    );
};


const TopBadgesChart: React.FC<TopBadgesChartProps> = ({ data }) => {
     if (data.length === 0) {
        return (
             <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8">
                <CrownIcon className="w-10 h-10 mb-2 text-slate-600"/>
                <p className="font-semibold">No Badges Awarded</p>
                <p className="text-sm">Members will earn badges as they gain XP.</p>
            </div>
        );
    }
    return (
        <div>
            <div className="flex items-center gap-3 mb-4">
                <CrownIcon className="w-6 h-6 text-green-400" />
                <h3 className="text-lg font-bold text-white">Most Awarded Badges</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
                {data.map(badgeData => (
                    <BadgeStatItem 
                        key={badgeData.name} 
                        badge={{
                            id: badgeData.name,
                            name: badgeData.name,
                            description: '', // Not needed for this display
                            ...badgeData
                        }} 
                    />
                ))}
            </div>
        </div>
    );
};

export default TopBadgesChart;