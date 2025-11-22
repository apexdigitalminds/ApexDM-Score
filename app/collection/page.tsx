"use client";

import React from 'react';
import BadgeShowcase from '../components/bolt/BadgeShowcase';
import ProtectedRoute from '../components/bolt/ProtectedRoute';
import Layout from '../components/bolt/Layout';
import { AppProvider } from '@/context/AppContext';

const PLACEHOLDER_ID = "collection-placeholder";

export default function Page() {
  return (
<AppProvider 
        verifiedUserId={PLACEHOLDER_ID} 
        experienceId={PLACEHOLDER_ID}
    >
      <Layout>
        <ProtectedRoute>
          <BadgeShowcase /> 
        </ProtectedRoute>
      </Layout>
    </AppProvider>
  );
}