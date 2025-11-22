"use client";
import React from 'react';
import LoginPage from '../components/bolt/LoginPage';
import { AppProvider } from '@/context/AppContext';

// No Layout needed here (usually login pages stand alone)
export default function Page() {
  return (
    <AppProvider>
        <LoginPage />
    </AppProvider>
  );
}