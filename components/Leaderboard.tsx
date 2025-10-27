

import React from 'react';
import { Link } from 'react-router-dom';
import type { User } from '../types';
import Avatar from './Avatar';

interface LeaderboardProps {
  users: User[];
  currentUserId: string;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ users, currentUserId }) => {
  return (
    <div className="bg-slate-800 p-6 rounded-2xl shadow-lg h-full flex flex-col">
      <h3 className="text-lg font-bold text-white mb-4">Leaderboard</h3>
      <div className="flex-grow space-y-3 overflow-y-auto pr-2">
        {users.map((user, index) => (
          <Link
            to={`/profile/${user.id}`}
            key={user.id}
            className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
              user.id === currentUserId 
                ? 'bg-purple-500/20 ring-2 ring-purple-500' 
                : 'bg-slate-700/50 hover:bg-slate-700'
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="font-bold text-slate-400 w-6 text-center">{index + 1}</span>
              <Avatar src={user.avatarUrl} alt={user.username} className="w-10 h-10 rounded-full" />
              <span className="font-medium text-white">{user.username}</span>
            </div>
            <span className="font-bold text-blue-400">{user.xp.toLocaleString()} XP</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;