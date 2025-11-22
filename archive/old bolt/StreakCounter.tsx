import React from 'react';
import { CometIcon } from './icons';

interface StreakCounterProps {
  streak: number;
}

const StreakCounter: React.FC<StreakCounterProps> = ({ streak }) => {
  const getStreakStyles = (currentStreak: number) => {
    if (currentStreak >= 90) {
      return {
        bg: 'bg-green-500/20',
        ping: 'bg-yellow-400/50',
        iconFill: 'url(#legendary-streak-gradient)',
        iconClass: '',
      };
    }
    if (currentStreak >= 30) {
      return {
        bg: 'bg-purple-500/20',
        ping: 'bg-purple-500/50',
        iconFill: 'url(#epic-streak-gradient)',
        iconClass: '',
      };
    }
    if (currentStreak >= 7) {
      return {
        bg: 'bg-blue-500/20',
        ping: 'bg-blue-500/50',
        iconFill: 'url(#rising-streak-gradient)',
        iconClass: '',
      };
    }
    if (currentStreak > 0) {
      return {
        bg: 'bg-orange-500/20',
        ping: 'bg-orange-500/50',
        iconFill: 'currentColor',
        iconClass: 'text-orange-500',
      };
    }
    return {
      bg: 'bg-slate-700',
      ping: null,
      iconFill: 'currentColor',
      iconClass: 'text-slate-500',
    };
  };

  const streakStyles = getStreakStyles(streak);

  return (
    <div className="bg-slate-800 p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center text-center h-full">
      <div className={`relative w-20 h-20 flex items-center justify-center rounded-full ${streakStyles.bg}`}>
        {streakStyles.ping && <div className={`absolute inset-0 ${streakStyles.ping} rounded-full animate-ping`}></div>}
        <CometIcon className={`w-10 h-10 ${streakStyles.iconClass}`} fill={streakStyles.iconFill} />
      </div>
      <p className="mt-4 text-3xl font-bold text-white">{streak}</p>
      <p className="text-sm text-slate-400">Day Streak</p>
    </div>
  );
};

export default StreakCounter;