"use client";

import React from 'react';
import ProfilePage from '../../components/bolt/ProfilePage';
import ProtectedRoute from '../../components/bolt/ProtectedRoute';
import Layout from '../../components/bolt/Layout';

export default function Page() {
  return (
    // FIX: Removed AppProvider wrapper. Using global context from layout.tsx
    <Layout>
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    </Layout>
  );
}