"use client";

import React from 'react';
import QuestsPage from '../components/bolt/QuestsPage';
import ProtectedRoute from '../components/bolt/ProtectedRoute';
import Layout from '../components/bolt/Layout';
import { AppProvider } from '@/context/AppContext';

export default function Page() {
  return (
    <AppProvider>
      <Layout>
        <ProtectedRoute>
          <QuestsPage />
        </ProtectedRoute>
      </Layout>
    </AppProvider>
  );
}