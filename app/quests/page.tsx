"use client";

import React from 'react';
import QuestsPage from '../components/bolt/QuestsPage';
import ProtectedRoute from '../components/bolt/ProtectedRoute';
import Layout from '../components/bolt/Layout';
import { AppProvider } from '@/context/AppContext';

const PLACEHOLDER_ID = "quests-placeholder";
export default function Page() {
  return (
<AppProvider 
        verifiedUserId={PLACEHOLDER_ID} 
        experienceId={PLACEHOLDER_ID}
    >
      <Layout>
        <ProtectedRoute>
          <QuestsPage />
        </ProtectedRoute>
      </Layout>
    </AppProvider>
  );
}