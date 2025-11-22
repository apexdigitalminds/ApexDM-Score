"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";

interface AdminRouteProps {
  children: React.ReactElement;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { selectedUser, isLoading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!selectedUser || selectedUser.role !== "admin")) {
      router.replace("/login");
    }
  }, [isLoading, selectedUser, router]);

  if (isLoading) {
    return <div className="text-center p-8">Loading...</div>;
  }

  if (!selectedUser || selectedUser.role !== "admin") {
    return null;
  }

  return children;
};

export default AdminRoute;
