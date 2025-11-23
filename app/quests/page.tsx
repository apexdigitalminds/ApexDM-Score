"use client"; 

import React from 'react';
import Layout from '../components/bolt/Layout'; // Adjust path if needed
import ProtectedRoute from '../components/bolt/ProtectedRoute'; 
import QuestsPage from '../components/bolt/QuestsPage'; 

export default function Page() {
  return (
    // FIX: Removed local AppProvider. Now uses global auth from layout.tsx.
    <Layout>
      <ProtectedRoute>
        <QuestsPage /> 
      </ProtectedRoute>
    </Layout>
  );
}