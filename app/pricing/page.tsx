"use client";

import React from 'react';
// Import path is '../' because we are in 'app/pricing'
import PricingPage from '../components/bolt/PricingPage';

export default function Page() {
  return (
    /* 🟢 FIX: Removed <AppProvider> and <Layout>. 
      This page is already wrapped by the Root Layout in app/layout.tsx.
      Adding them again caused the "Double Header" and session loss issue.
    */
    <PricingPage />
  );
}