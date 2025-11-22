"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { LogoIcon } from "./icons";

const WhopConnectPage: React.FC = () => {
  // FIX: Removed 'connectWhop' as it no longer exists in AppContext
  const { community, isWhopConnected, isLoading } = useApp();
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (isWhopConnected) {
      router.push("/admin");
    } else {
      // If not connected, auto-attempt to go to admin where Server Auth happens
      // router.push("/admin"); 
    }
  }, [isWhopConnected, router]);

  const handleAuthorize = async () => {
    setIsConnecting(true);
    // FIX: Removed manual auth call. Redirect to admin to trigger Server Auth.
    router.push("/admin");
  };

  if (isLoading && !community) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <p>Loading community information...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-lg p-8 border border-slate-700 text-center">
        <div className="flex justify-center items-center gap-4 mb-6">
          {community?.logoUrl && (
             <img
                src={community.logoUrl}
                alt={community.name}
                className="w-16 h-16 rounded-lg object-cover"
             />
          )}
          <LogoIcon className="h-16 w-16" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          Connect to Whop
        </h1>
        <p className="text-slate-400 mb-6">
          Authentication is handled automatically via Whop. 
          Click below to enter your dashboard.
        </p>

        <button
          onClick={handleAuthorize}
          disabled={isConnecting}
          className="w-full bg-blue-600 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:bg-slate-600 disabled:cursor-wait"
        >
          {isConnecting ? "Connecting..." : "Enter Dashboard"}
        </button>
      </div>
    </div>
  );
};

export default WhopConnectPage;