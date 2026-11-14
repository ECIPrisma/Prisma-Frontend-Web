import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Login } from '../../pages/Login';

export const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Login />;
  }
  return children;
};
