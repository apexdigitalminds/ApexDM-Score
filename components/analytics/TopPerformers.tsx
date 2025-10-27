import React from 'react';
import { Link } from 'react-router-dom';
import type { User } from '../../types';
import { TrophyIcon, FireIcon } from '../icons';
import Avatar from '../Avatar';

interface UserPerformanceChartProps {
    title: string;
    icon: React.ReactNode;
    users: User[];
    metricLabel: string;
    valueAccessor: (user: User) => number;
}

const UserPerformanceChart: React.FC<UserPerformanceChartProps> = ({ title, icon, users, metricLabel, valueAccessor }) => {
    const topUserValue = users.length > 0 ? valueAccessor(users[0]) : 0;

    if (users.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8">
                {icon}
                <p className="font-semibold mt-2">No Performance Data</p>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center gap-3 mb-4">
                {icon}
                <h3 className="text-lg font-bold text-white">{title}</h3>
            </div>
            <div className="space-y-3">
                {users.map((user, index) => {
                    const value = valueAccessor(user);
                    const barWidth = topUserValue > 0 ? (value / topUserValue) * 100 : 0;
                    return (
                        <div key={user.id} className="grid grid-cols-12 items-center gap-2 text-sm">
                            <div className="col-span-1 text-slate-400 font-semibold text-center">{index + 1}</div>
                            <div className="col-span-4 flex items-center gap-2 overflow-hidden">
                                <Link to={`/profile/${user.id}`}>
                                    <Avatar src={user.avatarUrl} alt={user.username} className="w-8 h-8 rounded-full flex-shrink-0" />
                                </Link>
                                <Link to={`/profile/${user.id}`} className="text-white hover:underline truncate">
                                    {user.username}
                                </Link>
                            </div>
                            <div className="col-span-7 flex items-center gap-2">
                                <div className="w-full bg-slate-700 rounded-full h-4">
                                    <div
                                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-500"
                                        style={{ width: `${barWidth}%` }}
                                    ></div>
                                </div>
                                <div className="font-bold text-white w-24 text-right">
                                    {value.toLocaleString()} {metricLabel}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


interface TopPerformersProps {
    usersByXp: User[];
    usersByStreak: User[];
}

const TopPerformers: React.FC<TopPerformersProps> = ({ usersByXp, usersByStreak }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
            <UserPerformanceChart 
                title="Top 10 by Total XP"
                icon={<TrophyIcon className="w-6 h-6 text-yellow-400" />}
                users={usersByXp}
                metricLabel="XP"
                valueAccessor={(user) => user.xp}
            />
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
            <UserPerformanceChart 
                title="Top 10 by Longest Streak"
                icon={<FireIcon className="w-6 h-6 text-orange-400" />}
                users={usersByStreak}
                metricLabel="Days"
                valueAccessor={(user) => user.streak}
            />
        </div>
    </div>
);

export default TopPerformers;
