"use client";

import React from 'react';
import { useParams } from 'next/navigation';
// FIX: Adjust import path to match your structure
import AdminDashboard from '../../components/bolt/AdminDashboard';
import AdminRoute from '../../components/bolt/AdminRoute';

export default function Page() {
  const params = useParams();
  
  // Helper to ensure companyId is a string (Next.js params can sometimes be arrays)
  const companyId = Array.isArray(params?.companyId) 
    ? params.companyId[0] 
    : params?.companyId;

  if (!companyId) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">Error: No Company ID found in URL.</div>;
  }

  return (
    <AdminRoute>
      <AdminDashboard companyId={companyId} />
    </AdminRoute>
  );
}