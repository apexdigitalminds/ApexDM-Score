"use client"; 

import React from 'react';
import Layout from './bolt/Layout'; // Adjusted to match likely folder structure (app/components/bolt/...)
import ProtectedRoute from './bolt/ProtectedRoute'; 
import DashboardPage from './bolt/DashboardPage'; 

// 1. Define the props we expect from the Server
interface DashboardClientProps {
  user: any;       // Using 'any' to prevent type conflicts for now
  actions: any[];
  community: any;
  companyId: string;
}

// 2. Accept the props in the function signature
export default function DashboardClient({ user, actions, community, companyId }: DashboardClientProps) {
  
  // Note: We are receiving fresh data (user, community) from the server here.
  // If your 'DashboardPage' can accept these as props, pass them down like:
  // <DashboardPage user={user} actions={actions} />
  // For now, we render it as is to match your existing UI setup.

  return (
    <Layout>
      <ProtectedRoute>
        <DashboardPage /> 
      </ProtectedRoute>
    </Layout>
  );
}