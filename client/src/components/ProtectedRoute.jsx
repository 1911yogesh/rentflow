import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from './UI';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f0ede8]">
        <Spinner size={36} />
      </div>
    );
  }

  return user ? (children || <Outlet />) : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
