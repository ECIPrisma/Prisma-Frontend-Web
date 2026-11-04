import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const normalizeUser = (raw) => {
    if (!raw) return null;
    const usuario = raw.usuario || raw;
    return {
      ...raw,
      token: raw.token || usuario.token,
      id: usuario.id,
      email: usuario.email,
      nombreCompleto: usuario.nombreCompleto,
      telefono: usuario.telefono,
      rol: usuario.rol || raw.rol,
      proveedorId: usuario.proveedorId || raw.proveedorId,
    };
  };

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('prisma_user');
      return saved ? normalizeUser(JSON.parse(saved)) : null;
    } catch {
      localStorage.removeItem('prisma_user');
      return null;
    }
  });

  const login = (userData) => {
    const normalized = normalizeUser(userData);
    setUser(normalized);
    try {
      localStorage.setItem('prisma_user', JSON.stringify(normalized));
    } catch {
      // Ignorar si cookies/storage están restringidas
    }
  };

  const logout = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem('prisma_user');
    } catch {
      // Ignorar
    }
  }, []);

  // Escuchar eventos globales de 401 (token expirado o sesión revocada)
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    };

    window.addEventListener('prisma:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('prisma:unauthorized', handleUnauthorized);
    };
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
