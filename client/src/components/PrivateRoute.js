import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FullPageLoader } from './Loader';

// Protect any authenticated route
const PrivateRoute = ({ children, role }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoader />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role && user.role !== role) {
    // Redirect to correct dashboard
    const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default PrivateRoute;
