import React from 'react';
import type { Badge } from '@/types';
import { iconMap } from './icons';

const BadgeItem: React.FC<{ badge: Badge }> = ({ badge }) => {
    const IconComponent = iconMap[badge.icon] || iconMap['Star'];

    return (
        <div className="group relative bg-slate-800 p-4 rounded-xl flex flex-col items-center justify-center text-center aspect-square transition-all hover:bg-slate-700 shadow-lg">
            <IconComponent 
                className="w-10 h-10 mb-2" 
                style={{ color: badge.color }}
            />
            <p className="font-semibold text-sm text-white">{badge.name}</p>
            <div className="absolute bottom-full mb-2 w-max px-3 py-1.5 bg-slate-900 text-slate-200 text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {badge.description}
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-900"></div>
            </div>
        </div>
    );
};

export default BadgeItem;