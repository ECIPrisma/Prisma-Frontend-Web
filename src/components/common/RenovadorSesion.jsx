import { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';

// HU-03: renovar el JWT un minuto antes de que expire
const MARGEN_RENOVACION_MS = 60 * 1000;
const REINTENTO_RENOVACION_MS = 30 * 1000;
const MAX_TIMEOUT_MS = 2147483647;

const getTokenExpiration = (token) => {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(payload));
    return exp ? exp * 1000 : null;
  } catch {
    return null;
  }
};

/**
 * Programa la renovación del JWT antes de su expiración usando el refresh token de la cookie.
 * Si el backend responde 401 (refresh expirado o revocado) cierra la sesión y AppRoutes redirige a /login.
 */
export const RenovadorSesion = () => {
  const { user, login, logout } = useAuth();
  const token = user?.token;

  // login/logout se recrean en cada render del AuthProvider; se leen desde una ref
  // para reprogramar la renovación solo cuando cambia el token
  const accionesRef = useRef({ login, logout });
  useEffect(() => {
    accionesRef.current = { login, logout };
  });

  useEffect(() => {
    const expiraEn = token ? getTokenExpiration(token) : null;
    if (!expiraEn) return undefined;

    let cancelado = false;
    let timer;

    const renovar = async () => {
      try {
        const data = await authService.refresh();
        if (!cancelado) accionesRef.current.login(data);
      } catch (err) {
        if (cancelado) return;
        if (err.status === 401) {
          accionesRef.current.logout();
        } else {
          timer = setTimeout(renovar, REINTENTO_RENOVACION_MS);
        }
      }
    };

    const espera = Math.min(Math.max(expiraEn - Date.now() - MARGEN_RENOVACION_MS, 0), MAX_TIMEOUT_MS);
    timer = setTimeout(renovar, espera);

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [token]);

  return null;
};
