// app/store/page.tsx

"use client"; 

import React from 'react';
// ⚠️ Ensure these imports are present and point to the correct files ⚠️
import { AppProvider } from "@/context/AppContext"; 
import Layout from '../components/bolt/Layout';
import ProtectedRoute from '../components/bolt/ProtectedRoute'; // or similar path
import StorePage from '../components/bolt/StorePage'; // or similar path

// Define simple placeholder IDs for the build process
const PLACEHOLDER_ID = "store-placeholder";

export default function Page() {
  return (
    // Pass the required placeholders to satisfy the AppProvider signature
    <AppProvider 
        verifiedUserId={PLACEHOLDER_ID} 
        experienceId={PLACEHOLDER_ID}
    >
      <Layout>
        <ProtectedRoute>
          <StorePage /> 
        </ProtectedRoute>
      </Layout>
    </AppProvider>
  );
}