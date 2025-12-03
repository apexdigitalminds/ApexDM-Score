"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LandingPage from '../app/components/bolt/LandingPage';
import Layout from '../app/components/bolt/Layout';
import { useApp } from '@/context/AppContext'; 

const HomeRouteHandler = () => {
    const { selectedUser, isLoading } = useApp();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        // 🔍 Debug: Confirm the Root Layout passed the correct user
        if (selectedUser) {
             console.log(`[HomeRoute] User: ${selectedUser.username} | Role: ${selectedUser.role}`);
        }

        // 1. If Admin: Do nothing. Stay here. Render Landing Page.
        if (selectedUser?.role === 'admin') return;

        // 2. If Member: Redirect to Dashboard immediately.
        if (selectedUser) {
            router.push('/dashboard');
        }
        
        // 3. If Public (No User): Stay here. Render Landing Page.
    }, [selectedUser, isLoading, router]);

    // 🛡️ LOADING STATE
    // If we are loading, OR if we are a Member (who is about to be redirected),
    // show the spinner to prevent the Landing Page from "flashing" on screen.
    if (isLoading || (selectedUser && selectedUser.role !== 'admin')) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    // 🟢 RENDER LANDING PAGE (Admins & Public only)
    return (
        <Layout>
            <LandingPage />
        </Layout>
    );
};

// DIRECT EXPORT - Rely on the RootLayout's AppProvider
export default function Page() {
  return <HomeRouteHandler />;
}