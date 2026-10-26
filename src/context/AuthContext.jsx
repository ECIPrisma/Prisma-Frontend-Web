import React, { createContext, useContext, useState, useEffect } from 'react';

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
      rol: usuario.rol || raw.rol,
      proveedorId: usuario.proveedorId || raw.proveedorId,
      ...raw,
      rol: usuario.rol || raw.rol, // Asegurar que rol quede en la raíz
    };
  };

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('prisma_user');
    return saved ? normalizeUser(JSON.parse(saved)) : null;
  });

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
