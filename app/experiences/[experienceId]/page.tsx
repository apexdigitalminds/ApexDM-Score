import React from 'react';
import Layout from '../../components/bolt/Layout'; // Adjust path ../../ to go up two levels
import ProtectedRoute from '../../components/bolt/ProtectedRoute';
import DashboardPage from '../../components/bolt/DashboardPage'; // Or whichever component this view should show

export default function Page() {
  return (
    // FIX: Removed local AppProvider. Now uses global auth from layout.tsx.
    <Layout>
      <ProtectedRoute>
        {/* Usually the experience view shows the Dashboard */}
        <DashboardPage />
      </ProtectedRoute>
    </Layout>
  );
}