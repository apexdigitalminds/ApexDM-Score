"use client";
import React from 'react';
import SignUpPage from '../components/bolt/SignUpPage';
import { AppProvider } from '@/context/AppContext';

// No Layout needed here
const PLACEHOLDER_ID = "signup-placeholder";
export default function Page() {
  return (
<AppProvider 
        verifiedUserId={PLACEHOLDER_ID} 
        experienceId={PLACEHOLDER_ID}
    >
        <SignUpPage />
    </AppProvider>
  );
}