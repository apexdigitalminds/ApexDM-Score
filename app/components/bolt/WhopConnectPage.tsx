"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { LogoIcon } from "./icons";

const WhopConnectPage: React.FC = () => {
  const { community, connectWhop, isWhopConnected, isLoading } = useApp();
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (isWhopConnected) {
      router.push("/admin");
    }
  }, [isWhopConnected, router]);

  const handleAuthorize = async () => {
    setIsConnecting(true);
    await connectWhop();
    // Navigation will happen automatically once isWhopConnected becomes true
  };

  if (isLoading && !community) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <p>Loading community information...</p>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white text-center">
        <div>
          <p className="mb-4">
            Could not load community data. Please log in again.
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-lg p-8 border border-slate-700 text-center">
        <div className="flex justify-center items-center gap-4 mb-6">
          <img
            src={community.logoUrl}
            alt={community.name}
            className="w-16 h-16 rounded-lg object-cover"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          <LogoIcon className="h-16 w-16" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          Connect to Whop
        </h1>
        <p className="text-slate-400 mb-6">
          <span className="font-semibold text-white">ApexDM Score</span> is
          requesting permission to access your{" "}
          <span className="font-semibold text-white">{community.name}</span> Whop
          store data.
        </p>

        <ul className="text-left text-slate-400 text-sm space-y-2 mb-8 list-disc list-inside bg-slate-700/50 p-4 rounded-lg">
          <li>Read member information and subscription status.</li>
          <li>Listen for new subscription and renewal events.</li>
          <li>This will allow automated XP and badge awards.</li>
        </ul>

        <button
          onClick={handleAuthorize}
          disabled={isConnecting}
          className="w-full bg-blue-600 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:bg-slate-600 disabled:cursor-wait"
        >
          {isConnecting ? "Connecting..." : "Authorize Access"}
        </button>

        <button
          onClick={() => router.push("/admin")}
          disabled={isConnecting}
          className="w-full mt-3 text-slate-400 text-sm hover:text-white transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default WhopConnectPage;
