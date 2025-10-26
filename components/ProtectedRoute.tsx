import React from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../App';

interface ProtectedRouteProps {
    children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { selectedUser, isLoading } = useApp();

    // While the app is loading and we don't know if a user is selected yet,
    // we can show a loading indicator or null to prevent a premature redirect.
    if (isLoading) {
        return <div className="text-center p-8">Initializing...</div>;
    }

    // If loading is finished and there's still no user, redirect to login.
    if (!selectedUser) {
        return <Navigate to="/login" replace />;
    }
    
    // If a user is selected, render the requested component.
    return children;
};

export default ProtectedRoute;
