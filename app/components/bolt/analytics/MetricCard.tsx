import React from 'react';

interface MetricCardProps {
    icon: React.ReactNode;
    value: string | number;
    label: string;
    description: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, value, label, description }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg flex items-start gap-4 border border-slate-200 dark:border-slate-700">
        <div className="bg-slate-100 dark:bg-slate-700/50 p-3 rounded-lg">
            {icon}
        </div>
        <div>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{value}</p>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{label}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
        </div>
    </div>
);

export default MetricCard;
