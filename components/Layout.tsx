import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { ChartBarIcon, UserGroupIcon, LogoIcon } from './icons';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    
    const navLinkClasses = "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors";
    const activeClass = "bg-slate-700 text-white";
    const inactiveClass = "text-slate-400 hover:bg-slate-800 hover:text-white";

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
                             <NavLink to="/dashboard" className={({isActive}) => `${navLinkClasses} ${isActive ? activeClass : inactiveClass}`}>
                                <ChartBarIcon className="h-5 w-5" />
                                <span className="hidden sm:inline">Dashboard</span>
                            </NavLink>
                             <NavLink to="/admin" className={({isActive}) => `${navLinkClasses} ${isActive ? activeClass : inactiveClass}`}>
                                <UserGroupIcon className="h-5 w-5" />
                                <span className="hidden sm:inline">Admin</span>
                            </NavLink>
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