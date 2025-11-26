"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link'; 
import { useParams } from 'next/navigation'; 
import { useApp } from '@/context/AppContext';
import type { Profile, Action } from '@/types'; 
import XPProgress from './XPProgress';
import StreakCounter from './StreakCounter';
import BadgeDisplay from './BadgeDisplay';
import Avatar from './Avatar';
import AvatarUpdateModal from './AvatarUpdateModal';
import { CameraIcon } from './icons';

const ProfilePage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const { selectedUser, getUserById, getUserActions } = useApp();
    
    const [profile, setProfile] = useState<Profile | null>(null);
    const [actions, setActions] = useState<Action[]>([]);
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    
    const isOwnProfile = selectedUser?.id === userId || (!userId && selectedUser);

    useEffect(() => {
        const fetchProfileData = async () => {
            const targetId = userId || selectedUser?.id;
            
            if (targetId) {
                if (selectedUser?.id === targetId) {
                    setProfile(selectedUser);
                } else {
                    const userProfile = await getUserById(targetId);
                    setProfile(userProfile);
                }
                const userActions = await getUserActions(targetId);
                setActions(userActions);
            }
        };
        fetchProfileData();
    }, [userId, selectedUser, getUserById, getUserActions]);

    if (!profile) {
        return <div className="text-center p-8 text-slate-400">Loading profile...</div>;
    }
    
    const registrationDate = profile.joinedAt
        ? new Date(profile.joinedAt).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        })
        : null;

    // COSMETIC LOGIC
const nameColor = profile.metadata?.nameColor || '#FFFFFF';
    const title = profile.metadata?.title;
    const titlePos = profile.metadata?.titlePosition || 'prefix'; // Default to prefix
    const bannerUrl = profile.metadata?.bannerUrl;
    const pulseColor = profile.metadata?.avatarPulseColor;

    return (
        <div className="space-y-6">
            <AvatarUpdateModal 
                isOpen={isAvatarModalOpen}
                onClose={() => setIsAvatarModalOpen(false)}
            />
            
            <div className={`relative bg-slate-800 rounded-2xl shadow-lg overflow-hidden ${bannerUrl ? 'pt-32' : 'p-6'}`}>
                {bannerUrl && (
                    <div 
                        className="absolute inset-0 h-32 bg-cover bg-center"
                        style={{ backgroundImage: `url(${bannerUrl})` }}
                    />
                )}
                
                <div className={`relative flex flex-col sm:flex-row items-center gap-6 ${bannerUrl ? 'px-6 pb-6' : ''}`}>
                    <div className="relative group">
                        {/* 🟢 FIX: Applied Pulse Wrapper */}
                        <div 
                            className={`relative rounded-full ${pulseColor ? 'animate-pulse' : ''}`}
                            style={pulseColor ? { boxShadow: `0 0 15px ${pulseColor}` } : {}}
                        >
                            <Avatar 
                                src={profile.avatarUrl} 
                                alt={profile.username}
                                className="w-32 h-32 rounded-full border-4 border-slate-700 object-cover bg-slate-800"
                            />
                        </div>
                        
                        {isOwnProfile && (
                            <button 
                                onClick={() => setIsAvatarModalOpen(true)}
                                className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            >
                                <CameraIcon className="w-8 h-8 text-white" />
                            </button>
                        )}
                    </div>
                    
<div className="text-center sm:text-left">
                        <h1 className="text-3xl font-bold flex items-center gap-2 justify-center sm:justify-start" style={{ color: nameColor }}>
                            {/* 🟢 FIX: Handle Suffix Logic */}
                            {title && titlePos === 'prefix' && (
                                <span className="text-xl opacity-70 font-normal text-slate-300">[{title}]</span>
                            )}
                            
                            {profile.username}
                            
                            {title && titlePos === 'suffix' && (
                                <span className="text-xl opacity-70 font-normal text-slate-300">[{title}]</span>
                            )}
                        </h1>
                        
                        {registrationDate && <p className="text-slate-400">Member since {registrationDate}</p>}
                        
                        <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                            {profile.role === 'admin' && (
                                <span className="text-xs font-bold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                                    Admin
                                </span>
                            )}
                            <span className="text-xs font-bold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">
                                Level {profile.level}
                            </span>
                        </div>

                        {profile.bannedUntil && new Date(profile.bannedUntil) > new Date() && (
                            <div className="mt-2 text-sm bg-red-500/20 text-red-300 p-2 rounded-lg">
                                <b>Banned until:</b> {new Date(profile.bannedUntil).toLocaleString()}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                <div className="lg:col-span-2 h-full">
                    <XPProgress xp={profile.xp} />
                </div>
                <div className="h-full">
                    <StreakCounter streak={profile.streak} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                <div className="lg:col-span-2 h-full">
                    <BadgeDisplay badges={profile.badges ?? []} />
                </div>
                <div className="bg-slate-800 p-6 rounded-2xl shadow-lg h-full flex flex-col">
                    <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2 flex-grow">
                        {actions.slice(0, 10).map(action => (
                            <div key={action.id} className="flex justify-between items-center text-sm">
                                <div>
                                    <p className="text-slate-300 capitalize">{action.actionType.replace(/_/g, ' ')}</p>
                                    <p className="text-xs text-slate-500">
                                        {action.createdAt ? new Date(action.createdAt).toLocaleDateString() : 'Date unknown'}
                                    </p>
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