"use client";

import React, { useState, useEffect } from 'react';
import { Link } from 'next/link';
import { useApp } from '@/context/AppContext';
import type { User, Action, UserInventoryItem, ActiveEffect } from '@/types';
import XPProgress from './XPProgress';
import StreakCounter from './StreakCounter';
import BadgeDisplay from './BadgeDisplay';
import Avatar from './Avatar';
import AvatarUpdateModal from './AvatarUpdateModal';
import { CameraIcon, SparklesIcon } from './icons';

// This component was moved here to fix a bug where it was causing a circular dependency.
export const Countdown: React.FC<{ expiry: string }> = ({ expiry }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference: number = new Date(expiry).getTime() - Date.now();
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        return `${days}d ${hours}h ${minutes}m`;
      }
      return 'Expired';
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 60000); // Update every minute

    return () => clearInterval(timer);
  }, [expiry]);

  return <span>{timeLeft}</span>;
};

const ProfilePage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const { selectedUser, getUserById, getUserActions } = useApp();
    
    const [profile, setProfile] = useState<User | null>(null);
    const [actions, setActions] = useState<Action[]>([]);
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    
    const isOwnProfile = selectedUser?.id === userId;

    useEffect(() => {
        const fetchProfileData = async () => {
            if (userId) {
                if (isOwnProfile) {
                    setProfile(selectedUser);
                } else {
                    const userProfile = await getUserById(userId);
                    setProfile(userProfile);
                }
                const userActions = await getUserActions(userId);
                setActions(userActions);
            }
        };
        fetchProfileData();
    }, [userId, isOwnProfile, selectedUser, getUserById, getUserActions]);

    if (!profile) {
        return <div className="text-center p-8">Loading profile...</div>;
    }
    
    const registrationDate = profile.created_at
        ? new Date(profile.created_at).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        })
        : null;

    return (
        <div className="space-y-6">
            <AvatarUpdateModal 
                isOpen={isAvatarModalOpen}
                onClose={() => setIsAvatarModalOpen(false)}
            />
            <div className="bg-slate-800 p-6 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center gap-6">
                <div className="relative group">
                    <Avatar 
                        src={profile.avatarUrl} 
                        alt={profile.username}
                        className="w-32 h-32 rounded-full border-4 border-slate-700 object-cover"
                    />
                    {isOwnProfile && (
                        <button 
                            onClick={() => setIsAvatarModalOpen(true)}
                            className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <CameraIcon className="w-8 h-8 text-white" />
                        </button>
                    )}
                </div>
                <div>
                    <h1 className="text-3xl font-bold">{profile.username}</h1>
                    {registrationDate && <p className="text-slate-400">Member since {registrationDate}</p>}
                    {profile.role === 'admin' && (
                        <span className="text-xs font-bold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full mt-2 inline-block">
                            Admin
                        </span>
                    )}
                     {profile.bannedUntil && new Date(profile.bannedUntil) > new Date() && (
                        <div className="mt-2 text-sm bg-red-500/20 text-red-300 p-2 rounded-lg">
                            <b>Banned until:</b> {new Date(profile.bannedUntil).toLocaleString()}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <XPProgress xp={profile.xp} />
                </div>
                <div>
                    <StreakCounter streak={profile.streak} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <BadgeDisplay badges={profile.badges} />
                </div>
                <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                        {actions.slice(0, 10).map(action => (
                            <div key={action.id} className="flex justify-between items-center text-sm">
                                <div>
                                    <p className="text-slate-300 capitalize">{action.actionType.replace(/_/g, ' ')}</p>
                                    <p className="text-xs text-slate-500">{new Date(action.timestamp).toLocaleDateString()}</p>
                                </div>
                                <span className="font-bold text-blue-400">+{action.xpGained} XP</span>
                            </div>
                        ))}
                         {actions.length === 0 && (
                            <p className="text-slate-500 text-center py-4">No recent activity.</p>
                        )}
                    </div>
                </div>
            </div>
            
             {!isOwnProfile && (
                 <div className="text-center mt-6">
                     <Link href="/dashboard" className="text-purple-400 hover:text-purple-300 font-semibold">
                         &larr; Return to Your Dashboard
                     </Link>
                 </div>
             )}
        </div>
    );
};

export default ProfilePage;