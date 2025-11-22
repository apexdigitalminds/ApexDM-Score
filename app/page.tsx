// app/page.tsx

"use client";
import React from 'react';
import LandingPage from './components/bolt/LandingPage'; 
import Layout from './components/bolt/Layout';

export default function Page() {
  return (
    // The AppProvider and all context wrappers are now handled in layout.tsx.
    // This file only renders the specific content for the route.
    <Layout>
      <LandingPage />
    </Layout>
  );
}