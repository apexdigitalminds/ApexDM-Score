"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogoIcon } from './icons';

const SignUpPage: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    // Immediately redirect to dashboard since Whop handles auth
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center gap-3 text-2xl font-extrabold tracking-tight">
            <LogoIcon className="h-10 w-10"/>
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
                ApexDM Score
            </span>
        </div>
        
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 shadow-2xl rounded-2xl p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-bold">Setting up your profile...</h2>
            <p className="text-slate-400 mt-2 text-sm">
                Authenticating via Whop. You will be redirected shortly.
            </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;