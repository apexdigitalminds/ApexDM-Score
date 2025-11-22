"use client";

import React from 'react';
import AdminPage from '../components/bolt/AdminPage';
import AdminRoute from '../components/bolt/AdminRoute';
import Layout from '../components/bolt/Layout';
import { AppProvider } from '@/context/AppContext';

export default function Page() {
  return (
    <AppProvider>
      <Layout>
        <AdminRoute>
          <AdminPage />
        </AdminRoute>
      </Layout>
    </AppProvider>
  );
}