"use client";
import React from 'react';
import LoginPage from '../components/bolt/LoginPage';
import { AppProvider } from '@/context/AppContext';

// No Layout needed here (usually login pages stand alone)
const PLACEHOLDER_ID = "login-placeholder";

export default function Page() {
  return (
<AppProvider 
        verifiedUserId={PLACEHOLDER_ID} 
        experienceId={PLACEHOLDER_ID}
    >
      <LoginPage /> 
    </AppProvider>
  );
}