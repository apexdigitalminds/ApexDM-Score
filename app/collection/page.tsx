"use client";

import React from 'react';
import BadgeShowcase from '../components/bolt/BadgeShowcase';
import ProtectedRoute from '../components/bolt/ProtectedRoute';
import Layout from '../components/bolt/Layout';
import { AppProvider } from '@/context/AppContext';

export default function Page() {
  return (
    <AppProvider>
      <Layout>
        <ProtectedRoute>
          <BadgeShowcase />
        </ProtectedRoute>
      </Layout>
    </AppProvider>
  );
}