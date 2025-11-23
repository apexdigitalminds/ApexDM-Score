"use client"; 

import React from 'react';
import Layout from '../components/bolt/Layout'; // Adjust path ../components/bolt/Layout if needed
import ProtectedRoute from '../components/bolt/ProtectedRoute'; 
import DashboardPage from '../components/bolt/DashboardPage'; 

export default function Page() {
  return (
    // FIX: Removed AppProvider wrapper. Using global context from layout.tsx
    <Layout>
      <ProtectedRoute>
        <DashboardPage /> 
      </ProtectedRoute>
    </Layout>
  );
}