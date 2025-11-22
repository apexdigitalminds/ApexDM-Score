"use client";

import React from 'react';
// Use ../../../ because we are deep in [userId]
import ProfilePage from '../../components/bolt/ProfilePage';
import ProtectedRoute from '../../components/bolt/ProtectedRoute';
import Layout from '../../components/bolt/Layout';
import { AppProvider } from '@/context/AppContext';

const PLACEHOLDER_ID = "[userid]-placeholder";

export default function Page() {
  return (
<AppProvider 
        verifiedUserId={PLACEHOLDER_ID} 
        experienceId={PLACEHOLDER_ID}
    >
      <Layout>
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      </Layout>
    </AppProvider>
  );
}