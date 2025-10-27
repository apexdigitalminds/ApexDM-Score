import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../App';
import type { User, Action } from '../types';
import XPProgress from './XPProgress';
import BadgeItem from './BadgeItem';
import { SnowflakeIcon, WhopIcon, ArrowTrendingUpIcon, CometIcon, CameraIcon } from './icons';
import Avatar from './Avatar';
import AvatarUpdateModal from './AvatarUpdateModal';

const StatCard: React.FC<{ icon: React.ReactNode, value: number, label: string }> = ({ icon, value, label }) => (
    <div className="bg-slate-800 p-4 rounded-xl flex items-center gap-4">
        {icon}
        <div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-sm text-slate-400">{label}</p>
        </div>
    </div>
);


const ProfilePage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const { getUserById, getUserActions, selectedUser } = useApp();
    const [profileUser, setProfileUser] = useState<User | null>(null);
    const [userActions, setUserActions] = useState<Action[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (userId) {
            setIsLoading(true);
            Promise.all([
                getUserById(userId),
                getUserActions(userId)
            ]).then(([user, actions]) => {
                setProfileUser(user);
                setUserActions(actions);
                setIsLoading(false);
            }).catch(() => setIsLoading(false));
        }
    }, [userId, getUserById, getUserActions, selectedUser]); // Re-fetch if selectedUser changes

    if (isLoading) {
        return <div className="text-center p-8">Loading profile...</div>;
    }

    if (!profileUser) {
        return <div className="text-center p-8">User profile not found.</div>;
    }
    
    const isOwnProfile = selectedUser?.id === profileUser.id;

    return (
        <div className="space-y-6">
            {isOwnProfile && (
                <AvatarUpdateModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
            {/* Profile Header */}
            <div className="bg-slate-800 p-6 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center gap-6">
                 <div className="relative group">
                    <Avatar 
                        src={profileUser.avatarUrl} 
                        alt={profileUser.username} 
                        className="w-24 h-24 rounded-full border-4 border-slate-700"
                    />
                    {isOwnProfile && (
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Change profile picture"
                        >
                            <CameraIcon className="w-8 h-8"/>
                        </button>
                    )}
                </div>

                <div className="text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-3">
                        <h1 className="text-3xl font-bold text-white">{profileUser.username}</h1>
                        {profileUser.whop_user_id && (
                            <div className="group relative flex items-center">
                                <WhopIcon className="w-6 h-6 text-blue-400" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-slate-900 text-slate-200 text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                    Verified Member
                                </div>
                            </div>
                        )}
                    </div>
                    <p className="text-slate-400">
                        {isOwnProfile ? "This is your public profile." : `Viewing ${profileUser.username}'s profile.`}
                    </p>
                </div>
                {isOwnProfile && (
                    <Link to="/dashboard" className="sm:ml-auto bg-slate-700 text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-600 transition-colors">
                        Go to Your Dashboard
                    </Link>
                )}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column (Stats & Badges) */}
                <div className="lg:col-span-1 space-y-6">
                     <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
                        <h3 className="text-lg font-bold text-white mb-4">Stats</h3>
                        <div className="space-y-3">
                            <StatCard 
                                icon={<ArrowTrendingUpIcon className="w-8 h-8 text-blue-400" />}
                                value={profileUser.xp}
                                label="Total XP"
                            />
                            <StatCard 
                                icon={<CometIcon className="w-8 h-8 text-orange-400" />}
                                value={profileUser.streak}
                                label="Day Streak"
                            />
                            <StatCard 
                                icon={<SnowflakeIcon className="w-8 h-8 text-cyan-400" />}
                                value={profileUser.streakFreezes}
                                label="Streak Freezes"
                            />
                        </div>
                     </div>

                    <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
                        <h3 className="text-lg font-bold text-white mb-4">Earned Badges ({profileUser.badges.length})</h3>
                        {profileUser.badges.length > 0 ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                                {profileUser.badges.map((badge) => (
                                    <BadgeItem key={badge.id} badge={badge} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-500 text-center py-4">No badges earned yet.</p>
                        )}
                    </div>
                </div>

                {/* Right Column (XP & Activity) */}
                <div className="lg:col-span-2 space-y-6">
                    <XPProgress xp={profileUser.xp} />
                     <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
                        <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
                        {userActions.length > 0 ? (
                            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                {userActions.map(action => (
                                    <div key={action.id} className="flex justify-between items-center text-sm p-3 bg-slate-700/50 rounded-lg">
                                        <p className="text-slate-300">
                                            <span className="font-semibold text-white capitalize">{action.actionType ? action.actionType.replace(/_/g, ' ') : 'Unknown Action'}</span>
                                        </p>
                                        <div className="flex items-center gap-4">
                                            <span className="text-slate-400">{new Date(action.timestamp).toLocaleDateString()}</span>
                                            <span className="font-bold text-blue-400 text-right w-16">+{action.xpGained} XP</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-500 text-center py-4">No recent activity to show.</p>
                        )}
                     </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;