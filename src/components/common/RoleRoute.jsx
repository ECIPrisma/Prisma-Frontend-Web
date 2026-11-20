import React from 'react';
import { Navigate } from 'react-router-dom';

export const RoleRoute = ({ allowedRoles, userRol, children }) => {
  const normUserRol = userRol?.startsWith('ROLE_') ? userRol : `ROLE_${userRol}`;
  const matches = allowedRoles.some(r => r === userRol || r === normUserRol || r.replace('ROLE_', '') === userRol);
  if (!matches) {
    return <Navigate to="/" replace />;
  }
  return children;
};
