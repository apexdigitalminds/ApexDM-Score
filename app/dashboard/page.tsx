"use client";

import React from 'react';
import DashboardPage from '../components/bolt/DashboardPage';
import ProtectedRoute from '../components/bolt/ProtectedRoute';
import Layout from '../components/bolt/Layout';
import { AppProvider } from '@/context/AppContext';

export default function Page() {
  return (
    <AppProvider>
      <Layout>
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      </Layout>
    </AppProvider>
  );
}