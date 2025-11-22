"use client";

import React from 'react';
import DashboardPage from '../components/bolt/DashboardPage';
import ProtectedRoute from '../components/bolt/ProtectedRoute';
import Layout from '../components/bolt/Layout';
import { AppProvider } from '@/context/AppContext';

const PLACEHOLDER_ID = "dashboard-placeholder";

export default function Page() {
  return (
<AppProvider 
        verifiedUserId={PLACEHOLDER_ID} 
        experienceId={PLACEHOLDER_ID}
    >
      <Layout>
        <ProtectedRoute>
          <DashboardPage /> 
        </ProtectedRoute>
      </Layout>
    </AppProvider>
  );
}