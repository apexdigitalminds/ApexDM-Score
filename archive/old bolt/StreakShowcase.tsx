import React from 'react';
import { CometIcon } from './icons';

const ShowcaseItem: React.FC<{ iconClass?: string, iconFill?: string, label: string, days: string }> = ({ iconClass = '', iconFill = 'currentColor', label, days }) => (
    <div className="flex flex-col items-center text-center">
        <div className={`w-16 h-16 flex items-center justify-center rounded-full bg-slate-700/50 mb-2`}>
            <CometIcon className={`w-8 h-8 ${iconClass}`} fill={iconFill} />
        </div>
        <p className="font-semibold text-sm text-white">{label}</p>
        <p className="text-xs text-slate-400">{days}</p>
    </div>
);

const StreakShowcase: React.FC = () => {
  return (
    <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
      <h3 className="text-lg font-bold text-white mb-4 text-center">Streak Tiers</h3>
      <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
        <ShowcaseItem iconClass="text-slate-500" label="Inactive" days="0 Days" />
        <ShowcaseItem iconClass="text-orange-500" label="Active" days="1-6 Days" />
        <ShowcaseItem iconFill="url(#rising-streak-gradient)" label="Rising" days="7-29 Days" />
        <ShowcaseItem iconFill="url(#epic-streak-gradient)" label="Epic" days="30-89 Days" />
        <ShowcaseItem iconFill="url(#legendary-streak-gradient)" label="Legendary" days="90+ Days" />
      </div>
    </div>
  );
};

export default StreakShowcase;