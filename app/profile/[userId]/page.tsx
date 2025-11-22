"use client";

import React from 'react';
// Use ../../../ because we are deep in [userId]
import ProfilePage from '../../components/bolt/ProfilePage';
import ProtectedRoute from '../../components/bolt/ProtectedRoute';
import Layout from '../../components/bolt/Layout';
import { AppProvider } from '@/context/AppContext';

export default function Page() {
  return (
    <AppProvider>
      <Layout>
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      </Layout>
    </AppProvider>
  );
}