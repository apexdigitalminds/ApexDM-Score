"use client";
import React from 'react';
import SignUpPage from '../components/bolt/SignUpPage';
import { AppProvider } from '@/context/AppContext';

// No Layout needed here
export default function Page() {
  return (
    <AppProvider>
        <SignUpPage />
    </AppProvider>
  );
}