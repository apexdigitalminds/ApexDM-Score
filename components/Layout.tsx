import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { ChartBarIcon, UserGroupIcon, LogoIcon, ShoppingCartIcon, TargetIcon, AccountIcon, ChartPieIcon } from './icons';
import { useApp } from '../App';
import Avatar from './Avatar';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { selectedUser, signOut } = useApp();
    const navigate = useNavigate();
    
    const navLinkClasses = "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors";
    const activeClass = "bg-slate-700 text-white";
    const inactiveClass = "text-slate-400 hover:bg-slate-800 hover:text-white";

    const handleLogout = async () => {
        await signOut();
        // Navigate to the landing page after sign-out.
        // The `onAuthStateChange` listener in App.tsx updates the state,
        // ensuring the UI reflects the logged-out status.
        // This is a smoother experience than a full page reload.
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
            <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-10">
                <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <Link to="/" className="flex items-center gap-3 text-2xl font-extrabold tracking-tight">
                                <LogoIcon className="h-8 w-8"/>
                                <span className="bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
                                    ApexDM Score
                                </span>
                            </Link>
                        </div>
                        <div className="flex items-center gap-2">
                            {selectedUser ? (
                                <>
                                    <NavLink 
                                        to={`/profile/${selectedUser.id}`} 
                                        end 
                                        className={({isActive}) => `flex items-center gap-3 px-3 py-1.5 rounded-lg transition-colors ${isActive ? activeClass : inactiveClass}`}
                                    >
                                        <Avatar src={selectedUser.avatarUrl} alt={selectedUser.username} className="w-8 h-8 rounded-full" />
                                        <span className="font-semibold text-white hidden sm:inline">{selectedUser.username}</span>
                                    </NavLink>
                                    <NavLink to="/dashboard" className={({isActive}) => `${navLinkClasses} ${isActive ? activeClass : inactiveClass}`}>
                                        <ChartBarIcon className="h-5 w-5" />
                                        <span className="hidden sm:inline">Dashboard</span>
                                    </NavLink>
                                    <NavLink to="/quests" className={({isActive}) => `${navLinkClasses} ${isActive ? activeClass : inactiveClass}`}>
                                        <TargetIcon className="h-5 w-5" />
                                        <span className="hidden sm:inline">Quests</span>
                                    </NavLink>
                                    <NavLink to="/store" className={({isActive}) => `${navLinkClasses} ${isActive ? activeClass : inactiveClass}`}>
                                        <ShoppingCartIcon className="h-5 w-5" />
                                        <span className="hidden sm:inline">XP Store</span>
                                    </NavLink>
                                    {selectedUser.role === 'admin' && (
                                        <>
                                            <NavLink to="/analytics" className={({isActive}) => `${navLinkClasses} ${isActive ? activeClass : inactiveClass}`}>
                                                <ChartPieIcon className="h-5 w-5" />
                                                <span className="hidden sm:inline">Analytics</span>
                                            </NavLink>
                                            <NavLink to="/admin" className={({isActive}) => `${navLinkClasses} ${isActive ? activeClass : inactiveClass}`}>
                                                <UserGroupIcon className="h-5 w-5" />
                                                <span className="hidden sm:inline">Admin</span>
                                            </NavLink>
                                        </>
                                    )}
                                    <button onClick={handleLogout} className="ml-2 px-4 py-2 text-sm font-medium text-slate-300 rounded-lg hover:bg-slate-700 transition-colors">
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" className={`${navLinkClasses} ${inactiveClass}`}>
                                        Sign In
                                    </Link>
                                    <Link to="/signup" className="bg-purple-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                                        Sign Up
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </nav>
            </header>
            <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
                {children}
            </main>
        </div>
    );
};

export default Layout;