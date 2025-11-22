"use client";

import React from 'react';
import AnalyticsPage from '../components/bolt/AnalyticsPage';
import AdminRoute from '../components/bolt/AdminRoute';
import Layout from '../components/bolt/Layout';
import { AppProvider } from '@/context/AppContext';

export default function Page() {
  return (
    <AppProvider>
      <Layout>
        <AdminRoute>
          <AnalyticsPage />
        </AdminRoute>
      </Layout>
    </AppProvider>
  );
}