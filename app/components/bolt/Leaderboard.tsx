import React, { useState } from 'react';
import Link from 'next/link';
import type { Profile } from '@/types';
import Avatar from './Avatar';
import { useApp } from '@/context/AppContext';
import { FireIcon, StarIcon } from './icons'; // Ensure FireIcon is exported from icons

interface LeaderboardProps {
  users: Profile[];
  currentUserId: string;
}

const UserRow: React.FC<{ 
    user: Profile; 
    index: number; 
    isCurrent: boolean;
    mode: 'xp' | 'streak';
}> = ({ user, index, isCurrent, mode }) => (
  <Link
    href={`/profile/${user.id}`}
    className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
      isCurrent 
        ? 'bg-purple-500/20 ring-2 ring-purple-500' 
        : 'bg-slate-700/50 hover:bg-slate-700'
    }`}
  >
    <div className="flex items-center gap-4">
      <span className={`font-bold w-6 text-center ${index < 3 ? 'text-yellow-400' : 'text-slate-400'}`}>
        {index + 1}
      </span>
      <Avatar src={user.avatarUrl} alt={user.username} className="w-8 h-8 rounded-full" />
      <span className={`font-medium ${isCurrent ? 'text-white' : 'text-slate-300'}`}>
        {user.username} {isCurrent && '(You)'}
      </span>
    </div>
    
    {/* Dynamic Value Display */}
    {mode === 'xp' ? (
        <span className="font-bold text-blue-400 text-sm">{user.xp.toLocaleString()} XP</span>
    ) : (
        <span className="font-bold text-orange-400 text-sm flex items-center gap-1">
            <FireIcon className="w-4 h-4" />
            {user.streak} Days
        </span>
    )}
  </Link>
);

const Leaderboard: React.FC<LeaderboardProps> = ({ users, currentUserId }) => {
  const { isFeatureEnabled } = useApp();
  
  // Two State Toggles: Time Range (Pro) AND Metric (XP/Streak)
  const [timeRange, setTimeRange] = useState<'all_time' | 'monthly'>('all_time');
  const [metric, setMetric] = useState<'xp' | 'streak'>('xp');
  
  const showSeasonal = isFeatureEnabled('seasonal_leaderboards');

  // Filter & Sort Logic
  const filteredUsers = React.useMemo(() => {
    let result = [...users];

    // 1. Filter by Time (If Monthly Selected)
    if (timeRange === 'monthly') {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        result = result.filter(u => {
            if (!u.last_action_date) return false;
            const actionDate = new Date(u.last_action_date);
            return actionDate.getMonth() === currentMonth && actionDate.getFullYear() === currentYear;
        });
    }

    // 2. Sort by Metric
    if (metric === 'streak') {
        // Sort by Streak High -> Low
        return result.sort((a, b) => b.streak - a.streak);
    } else {
        // Sort by XP High -> Low (Default)
        return result.sort((a, b) => b.xp - a.xp);
    }
  }, [users, timeRange, metric]);
  
  const topUsers = filteredUsers.slice(0, 10);
  const currentUserIndex = filteredUsers.findIndex(u => u.id === currentUserId);
  const currentUser = filteredUsers[currentUserIndex];
  
  const showStickyUser = currentUserIndex >= 10;

  return (
    <div className="bg-slate-800 p-6 rounded-2xl shadow-lg h-full flex flex-col">
      
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 mb-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {metric === 'xp' ? <span>🏆 XP Leaderboard</span> : <span className="text-orange-400">🔥 Streak Leaders</span>}
            </h3>
          </div>

          {/* Toggle Row */}
          <div className="flex justify-between items-center bg-slate-900/30 p-1 rounded-lg">
              
              {/* Left: Metric Toggle (XP vs Streak) */}
              <div className="flex gap-1">
                  <button 
                    onClick={() => setMetric('xp')}
                    className={`px-3 py-1 text-xs font-bold rounded transition-colors ${metric === 'xp' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    XP
                  </button>
                  <button 
                    onClick={() => setMetric('streak')}
                    className={`px-3 py-1 text-xs font-bold rounded transition-colors ${metric === 'streak' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Streak
                  </button>
              </div>

              {/* Right: Seasonal Toggle (Pro Only) */}
              {showSeasonal && (
                  <div className="flex gap-1 border-l border-slate-700 pl-2 ml-2">
                      <button 
                        onClick={() => setTimeRange('monthly')}
                        className={`px-2 py-1 text-xs font-bold rounded ${timeRange === 'monthly' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:text-white'}`}
                      >
                        Month
                      </button>
                      <button 
                        onClick={() => setTimeRange('all_time')}
                        className={`px-2 py-1 text-xs font-bold rounded ${timeRange === 'all_time' ? 'bg-slate-600 text-white' : 'text-slate-500 hover:text-white'}`}
                      >
                        All
                      </button>
                  </div>
              )}
          </div>
      </div>
      
      <div className="flex-grow space-y-3 overflow-y-auto pr-2 min-h-[300px]">
        {topUsers.map((user, index) => (
          <UserRow 
            key={user.id} 
            user={user} 
            index={index} 
            isCurrent={user.id === currentUserId}
            mode={metric} 
          />
        ))}
        
        {topUsers.length === 0 && (
            <div className="text-center py-10">
                <p className="text-slate-500">No active users found.</p>
            </div>
        )}
      </div>

      {/* Pinned User Row */}
      {showStickyUser && currentUser && (
        <div className="mt-2 pt-2 border-t border-slate-700">
             <div className="text-center text-slate-600 text-xs mb-1">• • •</div>
             <UserRow 
                user={currentUser} 
                index={currentUserIndex} 
                isCurrent={true}
                mode={metric}
             />
        </div>
      )}
    </div>
  );
};

export default Leaderboard;