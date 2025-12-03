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
        // If done loading, and we have a user who is NOT an admin...
        if (!isLoading && selectedUser && selectedUser.role !== 'admin') {
            // ...Redirect them straight to the Dashboard.
            router.push('/dashboard');
        }
    }, [selectedUser, isLoading, router]);

    // Optional: Show a loader while checking roles to prevent "flash" of content
    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    // If we are here, the user is either an Admin or (rarely) unauthenticated.
    // In both cases, showing the Landing Page is the safe/correct behavior.
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