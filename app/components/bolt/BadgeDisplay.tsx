import React from 'react';
import type { Badge } from '@/types';
import BadgeItem from './BadgeItem';

interface BadgeDisplayProps {
  badges: Badge[];
}

const BadgeDisplay: React.FC<BadgeDisplayProps> = ({ badges }) => {
  return (
    <div className="bg-slate-800 p-6 rounded-2xl shadow-lg h-full">
      <h3 className="text-lg font-bold text-white mb-4">Earned Badges</h3>
      {badges.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
          {badges.map((badge) => (
            <BadgeItem key={badge.id} badge={badge} />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-4/5 text-slate-500 text-center">
            <p>No badges earned yet. <br/>Keep engaging to unlock them!</p>
        </div>
      )}
    </div>
  );
};

export default BadgeDisplay;