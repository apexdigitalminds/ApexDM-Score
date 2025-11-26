"use client";

import React, { useEffect } from 'react';
import Link from 'next/link'; 
import { useRouter, usePathname } from 'next/navigation'; 
import { ChartBarIcon, UserGroupIcon, LogoIcon, ShoppingCartIcon, TargetIcon, ChartPieIcon, SparklesIcon, LockClosedIcon } from './icons';
import { useApp } from '@/context/AppContext';
import Avatar from './Avatar';
import TrialBanner from './TrialBanner';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    // FIX: Single destructuring line including activeEffects
    const { selectedUser, isFeatureEnabled, community, isLoading, activeEffects } = useApp();
    const router = useRouter();
    const pathname = usePathname(); 
    
    const navLinkClasses = "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors";
    const activeClass = "bg-slate-700 text-white";
    const inactiveClass = "text-slate-400 hover:bg-slate-800 hover:text-white";

    // FIX: Check if any active effect is an XP Boost
    const hasPulse = activeEffects && activeEffects.length > 0 && activeEffects.some(e => e.effectType === 'XP_BOOST');
    const isBoosted = activeEffects ? activeEffects.some(e => e.effectType === 'XP_BOOST') : false;

    const showQuests = isFeatureEnabled('quests');
    const showStore = isFeatureEnabled('store');
    const showAnalytics = isFeatureEnabled('analytics');
    
    const canWhiteLabel = isFeatureEnabled('white_label');
    const isWhiteLabelActive = canWhiteLabel && (community?.whiteLabelEnabled ?? false);

    useEffect(() => {
        const updateBrandAssets = () => {
            let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.getElementsByTagName('head')[0].appendChild(link);
            }

            if (isWhiteLabelActive && community) {
                if (community.logoUrl) link.href = community.logoUrl;
                if (community.name) document.title = community.name;
            } else {
                link.href = '/favicon.ico';
                document.title = 'ApexDM Score';
            }
        };

        if (!isLoading) {
            updateBrandAssets();
        }
    }, [isWhiteLabelActive, community, isLoading]);

    const isDev = process.env.NODE_ENV === 'development';

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
            <TrialBanner />

            <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-10">
                <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <Link href="/" className="flex items-center gap-3 text-2xl font-extrabold tracking-tight">
                                {!isLoading && isWhiteLabelActive && community?.logoUrl ? (
                                    <>
                                        <img src={community.logoUrl} alt={community.name} className="h-8 w-8 rounded-lg object-cover" />
                                        <span className="text-white">{community.name}</span>
                                    </>
                                ) : (
                                    <>
                                        <LogoIcon className="h-8 w-8"/>
                                        <span className="bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">ApexDM Score</span>
                                    </>
                                )}
                            </Link>
                        </div>
                        <div className="flex items-center gap-2">
                            {selectedUser ? (
                                <>
                                    <Link 
                                        href={`/profile/${selectedUser.id}`} 
                                        className={`flex items-center gap-3 px-3 py-1.5 rounded-lg transition-colors ${pathname === `/profile/${selectedUser.id}` ? activeClass : inactiveClass}`}
                                    >
                                        {/* FIX: Visual Pulse Wrapper */}
                                        <div className={`relative rounded-full ${isBoosted ? 'ring-2 ring-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)] animate-pulse' : ''}`}>
                                            <Avatar 
                                                src={selectedUser.avatarUrl} 
                                                alt={selectedUser.username || "User"} 
                                                className="w-8 h-8 rounded-full" 
                                            />
                                        </div>
                                        <span className="font-semibold text-white hidden sm:inline">{selectedUser.username}</span>
                                    </Link>
                                    <Link href="/dashboard" className={`${navLinkClasses} ${pathname === '/dashboard' ? activeClass : inactiveClass}`}>
                                        <ChartBarIcon className="h-5 w-5" />
                                        <span className="hidden sm:inline">Dashboard</span>
                                    </Link>
                                    <Link href="/collection" className={`${navLinkClasses} ${pathname === '/collection' ? activeClass : inactiveClass}`}>
                                        <SparklesIcon className="h-5 w-5" />
                                        <span className="hidden sm:inline">Collection</span>
                                    </Link>
                                    
                                    <Link href="/quests" className={`${navLinkClasses} ${pathname === '/quests' ? activeClass : inactiveClass}`}>
                                        <TargetIcon className="h-5 w-5" />
                                        <span className="hidden sm:inline">Quests</span>
                                        {!showQuests && <LockClosedIcon className="w-3 h-3 text-yellow-400" />} 
                                    </Link>
                                    
                                    <Link href="/store" className={`${navLinkClasses} ${pathname === '/store' ? activeClass : inactiveClass}`}>
                                        <ShoppingCartIcon className="h-5 w-5" />
                                        <span className="hidden sm:inline">XP Store</span>
                                        {!showStore && <LockClosedIcon className="w-3 h-3 text-yellow-400" />}
                                    </Link>

                                    {selectedUser.role === 'admin' && (
                                        <>
                                            <Link href="/analytics" className={`${navLinkClasses} ${pathname === '/analytics' ? activeClass : inactiveClass}`}>
                                                <ChartPieIcon className="h-5 w-5" />
                                                <span className="hidden sm:inline">Analytics</span>
                                                {!showAnalytics && <LockClosedIcon className="w-3 h-3 text-yellow-400" />}
                                            </Link>
                                            
                                            <Link href="/admin" className={`${navLinkClasses} ${pathname === '/admin' ? activeClass : inactiveClass}`}>
                                                <UserGroupIcon className="h-5 w-5" />
                                                <span className="hidden sm:inline">Admin</span>
                                            </Link>
                                        </>
                                    )}
                                </>
                            ) : (
                                <span className="text-sm text-slate-500 italic px-4">Connecting...</span>
                            )}
                        </div>
                    </div>
                </nav>
            </header>

            <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
                {children}
            </main>

            {!isLoading && !isWhiteLabelActive && (
                <footer className="py-8 text-center border-t border-slate-800/50 mt-8">
                    <p className="text-slate-500 text-sm flex items-center justify-center gap-2">
                        Powered by 
                        <a href="https://apexdm.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors font-semibold">
                            <LogoIcon className="w-4 h-4 text-purple-500" />
                            <span>ApexDM Score</span>
                        </a>
                    </p>
                </footer>
            )}
        </div>
    );
};

export default Layout;