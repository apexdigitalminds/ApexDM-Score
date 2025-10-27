import React from 'react';

interface ChartData {
    actionType: string;
    count: number;
    color?: string;
}

interface ActivityBreakdownChartProps {
    data: ChartData[];
}

const ActivityBreakdownChart: React.FC<ActivityBreakdownChartProps> = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.count, 0);
    if (total === 0) {
        return (
            <div className="flex items-center justify-center h-full text-slate-500">
                <p>No activity data yet.</p>
            </div>
        );
    }
    
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    const segments = data.map(item => {
        const percentage = item.count / total;
        const strokeDasharray = `${percentage * circumference} ${circumference}`;
        const segmentOffset = offset;
        offset += percentage * circumference;

        return (
            <circle
                key={item.actionType}
                className="transition-all duration-1000"
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke={item.color || '#475569'}
                strokeWidth="20"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={-segmentOffset}
                transform="rotate(-90 100 100)"
            />
        );
    });

    return (
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 h-full">
            <div className="relative w-52 h-52">
                <svg viewBox="0 0 200 200" className="w-full h-full">
                    <circle cx="100" cy="100" r={radius} fill="none" stroke="#334155" strokeWidth="20" />
                    {segments}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-white">{total}</span>
                    <span className="text-sm text-slate-400">Total Actions</span>
                </div>
            </div>
            <div className="space-y-2 text-sm">
                {data.map(item => (
                    <div key={item.actionType} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                            <span className="text-slate-300">{item.actionType}</span>
                        </div>
                        <span className="font-semibold text-white">{item.count} ({(item.count/total * 100).toFixed(1)}%)</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ActivityBreakdownChart;
