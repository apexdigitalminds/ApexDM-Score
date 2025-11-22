"use client";

import React from 'react';
import AnalyticsPage from '../components/bolt/AnalyticsPage';
import AdminRoute from '../components/bolt/AdminRoute';
import Layout from '../components/bolt/Layout';
import { AppProvider } from '@/context/AppContext';

const PLACEHOLDER_ID = "analytics-placeholder";

export default function Page() {
  return (
<AppProvider 
        verifiedUserId={PLACEHOLDER_ID} 
        experienceId={PLACEHOLDER_ID}
    >
      <Layout>
        <AdminRoute>
          <AnalyticsPage />
        </AdminRoute>
      </Layout>
    </AppProvider>
  );
}