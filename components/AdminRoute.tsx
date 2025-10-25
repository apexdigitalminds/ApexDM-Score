import React from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../App';

interface AdminRouteProps {
    children: React.ReactElement;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
    const { selectedUser, isLoading } = useApp();

    if (isLoading) {
        return <div className="text-center p-8">Initializing...</div>;
    }

    // If no user is logged in OR the user is not an admin, redirect.
    if (!selectedUser || selectedUser.role !== 'admin') {
        return <Navigate to="/dashboard" replace />;
    }
    
    // If a user is an admin, render the requested component.
    return children;
};

export default AdminRoute;