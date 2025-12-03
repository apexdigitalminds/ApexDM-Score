"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LandingPage from '../app/components/bolt/LandingPage';
import Layout from '../app/components/bolt/Layout';
import { AppProvider, useApp } from '@/context/AppContext';

// 🟢 INTERNAL COMPONENT: Handles the Redirect Logic
const HomeRouteHandler = () => {
    const { selectedUser, isLoading } = useApp();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        // 🔍 DEBUG: Watch the console to see what Role the app sees
        if (selectedUser) {
            console.log(`[HomeRoute] User: ${selectedUser.username} | Role: ${selectedUser.role}`);
        }

        // Logic: If Logged In AND (Not Admin), Redirect to Dashboard
        if (selectedUser && selectedUser.role !== 'admin') {
            router.push('/dashboard');
        }
    }, [selectedUser, isLoading, router]);

    // 1. Loading State
    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    // 2. 🛡️ ANTI-FLASH: If we are about to redirect a Member, 
    //    show the loader instead of rendering the Landing Page.
    if (selectedUser && selectedUser.role !== 'admin') {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    // 3. Render Landing Page (Only for Admins or Public Visitors)
    return (
        <Layout>
            <LandingPage />
        </Layout>
    );
};

const PLACEHOLDER_ID = "public-visitor";

export default function Page() {
  return (
    <AppProvider 
        verifiedUserId={PLACEHOLDER_ID} 
        experienceId={PLACEHOLDER_ID}
    >
      <HomeRouteHandler />
    </AppProvider>
  );
}