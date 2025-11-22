"use client";

import React from 'react';
import StorePage from '../components/bolt/StorePage';
import ProtectedRoute from '../components/bolt/ProtectedRoute';
import Layout from '../components/bolt/Layout';
import { AppProvider } from '@/context/AppContext';

export default function Page() {
  return (
    <AppProvider>
      <Layout>
        <ProtectedRoute>
          <StorePage />
        </ProtectedRoute>
      </Layout>
    </AppProvider>
  );
}