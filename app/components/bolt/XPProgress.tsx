import React from 'react';
import { getLevelDetails } from '@/lib/config/levels';

interface XPProgressProps {
  xp: number;
}

const XPProgress: React.FC<XPProgressProps> = ({ xp }) => {
  const levelInfo = getLevelDetails(xp);
  const { level, minXp, nextLevelXp, name } = levelInfo;

  const isMaxLevel = nextLevelXp === Infinity;

  const progressPercentage = isMaxLevel
    ? 100
    : ((xp - minXp) / (nextLevelXp - minXp)) * 100;
  
  const xpToNextLevel = isMaxLevel ? 0 : nextLevelXp - xp;

  return (
    <div className="bg-slate-800 p-6 rounded-2xl shadow-lg w-full h-full flex flex-col justify-center">
      <div className="flex justify-between items-center mb-4">
        {/* FIX: Updated classes to match 'Earned Badges' header size/color */}
        <span className="text-lg font-bold text-white">Level {level} ({name})</span>
        
        <span className="text-lg font-bold text-white">{xp.toLocaleString()} XP</span>
      </div>
      
      <div className="w-full bg-slate-700 rounded-full h-4 relative overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progressPercentage}%` }}
        >
        </div>
        <div className="absolute inset-0 bg-purple-500/30 rounded-full animate-pulse"></div>
      </div>
      
      <div className="text-right text-sm text-slate-400 mt-2">
        {isMaxLevel ? 'You have reached the max level!' : `${xpToNextLevel.toLocaleString()} XP to next level`}
      </div>
    </div>
  );
};

export default XPProgress;