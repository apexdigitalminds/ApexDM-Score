"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    // Immediately redirect to dashboard since Whop handles auth
    router.replace('/');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-slate-400">
      <p>Authentication is handled automatically by Whop.</p>
      <p className="text-sm mt-2">Redirecting to dashboard...</p>
    </div>
  );
}