"use client";
import React from 'react';
import LandingPage from './components/bolt/LandingPage'; // Direct import from app root
import Layout from './components/bolt/Layout';
import { AppProvider } from '@/context/AppContext';

export default function Page() {
  return (
    <AppProvider>
      <Layout>
        <LandingPage />
      </Layout>
    </AppProvider>
  );
}