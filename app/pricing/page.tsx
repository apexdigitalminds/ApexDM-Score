"use client";

import React from 'react';
// Import path is '../' because we are in 'app/pricing'
import PricingPage from '../components/bolt/PricingPage';
import Layout from '../components/bolt/Layout';
import { AppProvider } from '@/context/AppContext';

const PLACEHOLDER_ID = "public-pricing";

export default function Page() {
  return (
<AppProvider 
        verifiedUserId={PLACEHOLDER_ID} 
        experienceId={PLACEHOLDER_ID}
    >
      <Layout>
        {/* We do NOT wrap this in ProtectedRoute. 
          This allows public visitors (and potential customers) to see your pricing 
          before they sign up. The Layout will handle showing "Sign In" vs "User Menu" correctly.
        */}
        <PricingPage />
      </Layout>
    </AppProvider>
  );
}