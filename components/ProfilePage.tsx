import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../App';
import type { User, Action, UserInventoryItem, ActiveEffect } from '../types';
import XPProgress from './XPProgress';
import BadgeItem from './BadgeItem';
import { SnowflakeIcon, WhopIcon, ArrowTrendingUpIcon, CometIcon, CameraIcon, iconMap, SparklesIcon } from './icons';
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

export const Countdown: React.FC<{ expiry: string }> = ({ expiry }) => {
    const calculateTimeLeft = () => {
        // FIX: Add type annotation to `difference` to ensure it is treated as a number.
        const difference: number = +new Date(expiry) - +new Date();
        let timeLeft: { [key: string]: number } = {};

        // FIX: The result of date subtraction is always a number.
        // The `difference` variable was being incorrectly inferred as `unknown`, causing a type error in the comparison.
        // Ensured the logic correctly handles the numeric result.
        if (difference > 0) {
            timeLeft = {
                d: Math.floor(difference / (1000 * 60 * 60 * 24)),
                h: Math.floor((difference / (1000 * 60 * 60)) % 24),
                m: Math.floor((difference / 1000 / 60) % 60),
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000 * 60); // Update every minute
        return () => clearTimeout(timer);
    });

    const timerComponents = Object.entries(timeLeft)
        .filter(([_, value]) => value > 0)
        .map(([interval, value]) => `${value}${interval}`)
        .join(' ');

    return <>{timerComponents.length ? timerComponents : 'Expired'}</>;
}

const ProfilePage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const { getUserById, getUserActions, getUserInventory, getActiveEffects, activateInventoryItem, selectedUser } = useApp();
    const [profileUser, setProfileUser] = useState<User | null>(null);
    const [userActions, setUserActions] = useState<Action[]>([]);
    const [inventory, setInventory] = useState<UserInventoryItem[]>([]);
    const [activeEffects, setActiveEffects] = useState<ActiveEffect[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [notification, setNotification] = useState('');

    const fetchData = React.useCallback(async () => {
        if (!userId) return;
        setIsLoading(true);
        try {
            const [user, actions, inv, effects] = await Promise.all([
                getUserById(userId),
                getUserActions(userId),
                getUserInventory(userId),
                getActiveEffects(userId)
            ]);
            setProfileUser(user);
            setUserActions(actions);
            setInventory(inv);
            setActiveEffects(effects);
        } catch (error) {
            console.error("Failed to fetch profile data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [userId, getUserById, getUserActions, getUserInventory, getActiveEffects]);

    useEffect(() => {
        fetchData();
    }, [fetchData, selectedUser]); // Re-fetch if selectedUser changes (e.g., after avatar update)
    
    const showNotification = (message: string) => {
        setNotification(message);
        setTimeout(() => setNotification(''), 3000);
    };

    const handleActivate = async (inventoryId: string) => {
        const result = await activateInventoryItem(inventoryId);
        showNotification(result.message);
        if (result.success) {
            fetchData(); // Refresh all profile data
        }
    };

    if (isLoading) {
        return <div className="text-center p-8">Loading profile...</div>;
    }

    if (!profileUser) {
        return <div className="text-center p-8">User profile not found.</div>;
    }
    
    const isOwnProfile = selectedUser?.id === profileUser.id;

    return (
        <div className="space-y-6">
            {notification && (
                <div className="fixed top-20 right-8 bg-slate-700 text-white px-4 py-2 rounded-lg shadow-lg z-20 border border-slate-600">
                {notification}
                </div>
            )}
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
                    
                    {/* Inventory & Effects */}
                     <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
                        <h3 className="text-lg font-bold text-white mb-4">Inventory & Active Effects</h3>
                        <div className="space-y-4">
                             {activeEffects.map(effect => {
                                const Icon = SparklesIcon; // Assuming all are XP boosts for now
                                return (
                                    <div key={effect.id} className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                                        <div className="flex items-center gap-3">
                                            <Icon className="w-6 h-6 text-green-400"/>
                                            <p className="font-semibold text-white">XP Boost Active</p>
                                        </div>
                                        <div className="text-sm text-slate-300">
                                            Expires in: <span className="font-bold"><Countdown expiry={effect.expiresAt} /></span>
                                        </div>
                                    </div>
                                );
                             })}
                            {inventory.map(invItem => {
                                const Icon = iconMap[invItem.itemDetails.icon] || SparklesIcon;
                                return (
                                <div key={invItem.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Icon className="w-6 h-6 text-purple-400"/>
                                        <div>
                                            <p className="font-semibold text-white">{invItem.itemDetails.name}</p>

                                            <p className="text-xs text-slate-400">Purchased: {new Date(invItem.purchasedAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    {isOwnProfile && (
                                         <button onClick={() => handleActivate(invItem.id)} className="text-sm bg-purple-600 hover:bg-purple-700 text-white font-semibold py-1.5 px-3 rounded-md">Activate</button>
                                    )}
                                </div>
                            )})}
                            {inventory.length === 0 && activeEffects.length === 0 && (
                                <p className="text-slate-500 text-center py-4">No inventory items or active effects.</p>
                            )}
                        </div>
                     </div>

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