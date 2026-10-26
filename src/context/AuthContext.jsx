import React, { createContext, useContext, useState, useEffect } from 'react';
import { EVENTO_SESION_EXPIRADA } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const normalizeUser = (raw) => {
    if (!raw) return null;
    const usuario = raw.usuario || raw;
    return {
      token: raw.token || usuario.token,
      id: usuario.id,
      email: usuario.email,
      nombreCompleto: usuario.nombreCompleto,
      telefono: usuario.telefono,
      ...raw,
      // Asegurar que rol y proveedorId queden en la raíz
      rol: usuario.rol || raw.rol,
      proveedorId: usuario.proveedorId || raw.proveedorId,
    };
  };

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('prisma_user');
      return saved ? normalizeUser(JSON.parse(saved)) : null;
    } catch {
      // Sesión guardada corrupta: se descarta en vez de dejar la app en blanco.
      localStorage.removeItem('prisma_user');
      return null;
    }
  });

  useEffect(() => {
    const cerrar = () => setUser(null);
    window.addEventListener(EVENTO_SESION_EXPIRADA, cerrar);
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, cerrar);
  }, []);

  const login = (userData) => {
    const normalized = normalizeUser(userData);
    setUser(normalized);
    localStorage.setItem('prisma_user', JSON.stringify(normalized));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('prisma_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
