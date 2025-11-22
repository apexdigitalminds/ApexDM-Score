"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";

interface ProtectedRouteProps {
  children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { selectedUser, isLoading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !selectedUser) {
      router.replace("/login");
    }
  }, [isLoading, selectedUser, router]);

  if (isLoading) {
    return <div className="text-center p-8">Initializing...</div>;
  }

  if (!selectedUser) {
    return null;
  }

  return children;
};

export default ProtectedRoute;
