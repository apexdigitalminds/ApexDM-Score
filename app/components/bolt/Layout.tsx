"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ChartBarIcon, UserGroupIcon, LogoIcon, ShoppingCartIcon, TargetIcon, ChartPieIcon, SparklesIcon, LockClosedIcon } from './icons';
import { useApp } from '@/context/AppContext';
import Avatar from './Avatar';
import TrialBanner from './TrialBanner';

// ... (Keep existing MenuIcon / XMarkIcon definitions) ...
// Local Icons for Menu
const MenuIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
);

const XMarkIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { selectedUser, isFeatureEnabled, community, isLoading } = useApp();
    const router = useRouter();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    const navLinkClasses = "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors font-medium";
    const activeClass = "bg-slate-700 text-white";
    const inactiveClass = "text-slate-400 hover:bg-slate-800 hover:text-white";

    const pulseColor = selectedUser?.metadata?.avatarPulseColor;
    const isBoosted = !!pulseColor;

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
                link.href = '/favicon.png';
                document.title = 'ApexDM Score';
            }
        };

        if (!isLoading) {
            updateBrandAssets();
        }
    }, [isWhiteLabelActive, community, isLoading]);

    // 🟢 FIX: Use community.id (which IS the companyId) for dashboard navigation
    // No fallback needed - we always get community ID from user profile via setApiContext
    const dashboardPath = community?.id ? `/dashboard/${community.id}` : '#';

    // 🟢 UPDATED: Home link (logo click) - everyone goes to their dashboard
    const homeHref = dashboardPath;

    // 🟢 Navigation items - Dashboard visible to all, Admin Panel only for admins
    const navItems = [
        { href: dashboardPath, label: 'Dashboard', icon: ChartBarIcon, show: true },
        { href: '/collection', label: 'Collection', icon: SparklesIcon, show: true },
        { href: '/quests', label: 'Quests', icon: TargetIcon, show: true, locked: !showQuests },
        { href: '/store', label: 'XP Store', icon: ShoppingCartIcon, show: true, locked: !showStore },
        { href: '/analytics', label: 'Analytics', icon: ChartPieIcon, show: selectedUser?.role === 'admin', locked: !showAnalytics },
        { href: '/admin', label: 'Admin Panel', icon: UserGroupIcon, show: selectedUser?.role === 'admin' },
    ];

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
            <TrialBanner />

            <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
                <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">

                        {/* LEFT: Branding with Logic */}
                        <div className="flex items-center gap-4">
                            <Link href={homeHref} className="flex items-center gap-3 text-2xl font-extrabold tracking-tight">
                                {!isLoading && isWhiteLabelActive && community?.logoUrl ? (
                                    <>
                                        <img src={community.logoUrl} alt={community.name} className="h-8 w-8 rounded-lg object-cover" />
                                        <span className="text-white hidden sm:block">{community.name}</span>
                                    </>
                                ) : (
                                    <>
                                        <LogoIcon className="h-8 w-8" />
                                        <span className="bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text hidden sm:block">ApexDM Score</span>
                                        <span className="bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text sm:hidden">ApexDM</span>
                                    </>
                                )}
                            </Link>
                        </div>

                        {/* CENTER: Desktop Navigation */}
                        <div className="hidden lg:flex items-center gap-1">
                            {navItems.filter(i => i.show).map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === item.href ? activeClass : inactiveClass}`}
                                >
                                    <item.icon className="h-4 w-4" />
                                    <span>{item.label}</span>
                                    {item.locked && <LockClosedIcon className="w-3 h-3 text-yellow-400" />}
                                </Link>
                            ))}
                        </div>

                        {/* RIGHT: User Profile & Mobile Toggle */}
                        <div className="flex items-center gap-3">
                            {selectedUser ? (
                                <>
                                    <Link
                                        href={`/profile/${selectedUser.id}`}
                                        className={`hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-lg transition-colors ${pathname === `/profile/${selectedUser.id}` ? activeClass : inactiveClass}`}
                                    >
                                        <div
                                            className="relative rounded-full transition-all duration-300 p-0.5"
                                            style={isBoosted ? {
                                                boxShadow: `0 0 10px 2px ${pulseColor}`,
                                                border: `2px solid ${pulseColor}`,
                                                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                                            } : { border: '2px solid transparent' }}
                                        >
                                            <Avatar
                                                src={selectedUser.avatarUrl}
                                                alt={selectedUser.username || "User"}
                                                className="w-8 h-8 rounded-full bg-slate-700 object-cover"
                                            />
                                        </div>
                                        <span className="font-semibold text-white text-sm max-w-[100px] truncate">{selectedUser.username}</span>
                                    </Link>

                                    <button
                                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                        className="lg:hidden p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 focus:outline-none"
                                    >
                                        {isMobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
                                    </button>
                                </>
                            ) : (
                                <span className="text-sm text-slate-500 italic px-4">Connecting...</span>
                            )}
                        </div>
                    </div>
                </nav>

                {/* MOBILE MENU DRAWER */}
                {isMobileMenuOpen && selectedUser && (
                    <div className="lg:hidden border-t border-slate-700 bg-slate-800 absolute w-full left-0 z-50 shadow-2xl">
                        <div className="p-4 space-y-4">
                            <Link
                                href={`/profile/${selectedUser.id}`}
                                className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-xl"
                            >
                                <div
                                    className="relative rounded-full p-0.5"
                                    style={isBoosted ? {
                                        boxShadow: `0 0 10px 2px ${pulseColor}`,
                                        border: `2px solid ${pulseColor}`
                                    } : { border: '2px solid transparent' }}
                                >
                                    <Avatar src={selectedUser.avatarUrl} alt={selectedUser.username} className="w-10 h-10 rounded-full" />
                                </div>
                                <div>
                                    <p className="font-bold text-white">{selectedUser.username}</p>
                                    <p className="text-xs text-slate-400">{selectedUser.xp.toLocaleString()} XP</p>
                                </div>
                            </Link>

                            <div className="space-y-1">
                                {navItems.filter(i => i.show).map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`${navLinkClasses} ${pathname === item.href ? activeClass : 'text-slate-300 hover:bg-slate-700'}`}
                                    >
                                        <item.icon className="h-5 w-5" />
                                        <span className="flex-grow">{item.label}</span>
                                        {item.locked && <LockClosedIcon className="w-4 h-4 text-yellow-400" />}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
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