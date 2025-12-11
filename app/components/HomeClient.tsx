"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LandingPage from './bolt/LandingPage';
import Layout from './bolt/Layout';

interface HomeClientProps {
    user: any | null; // The user object passed from the Server
}

export default function HomeClient({ user }: HomeClientProps) {
    const router = useRouter();

    useEffect(() => {
        // If we have a user (and they are not admin), send them to dashboard immediately.
        // We trust the Server Component has already fixed the DB.
        if (user && user.role !== 'admin') {
            router.push('/dashboard');
        }
    }, [user, router]);

    // 1. If Redirecting (Member): Show Spinner
    if (user && user.role !== 'admin') {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    // 2. If Admin or Public: Show Landing Page
    return (
        <Layout>
            <LandingPage />
        </Layout>
    );
}