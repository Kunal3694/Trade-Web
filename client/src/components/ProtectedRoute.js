import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, adminOnly = false }) => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    if (!userInfo || !userInfo.token) {
        // Not logged in
        return <Navigate to="/login" replace />;
    }

    if (adminOnly && userInfo.user.role !== 'admin') {
        // Trying to access admin page as a regular user
        return <Navigate to="/Dashboard" replace />;
    }

    if (!adminOnly && userInfo.user.role === 'admin') {
        // Admin trying to access user pages (optional: redirect to admin dashboard or allow)
        // For now, let's allow admins to see user pages if they want, or redirect them to admin dashboard
        // return <Navigate to="/admin-dashboard" replace />;
    }

    return children;
};

export default ProtectedRoute;
