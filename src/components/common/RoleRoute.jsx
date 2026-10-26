import React from 'react';
import { Navigate } from 'react-router-dom';

export const RoleRoute = ({ allowedRoles, userRol, children }) => {
  if (!allowedRoles.includes(userRol)) {
    return <Navigate to="/" replace />;
  }
  return children;
};
