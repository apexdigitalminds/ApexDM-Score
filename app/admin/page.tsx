"use client";

import React from 'react';
import AdminPage from '../components/bolt/AdminPage';
import AdminRoute from '../components/bolt/AdminRoute';
import Layout from '../components/bolt/Layout';
import { AppProvider } from '@/context/AppContext';

const PLACEHOLDER_ID = "admin-placeholder";

export default function Page() {
  return (
<AppProvider 
        verifiedUserId={PLACEHOLDER_ID} 
        experienceId={PLACEHOLDER_ID}
    >
      <Layout>
        <AdminRoute>
          <AdminPage />
        </AdminRoute>
      </Layout>
    </AppProvider>
  );
}