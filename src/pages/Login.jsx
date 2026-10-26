import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import { LogIn, AlertCircle, Shield, ArrowRight } from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@prisma.com.co');
  const [password, setPassword] = useState('admin123');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    try {
      const data = await authService.login(email, password);
      login(data);
    } catch (err) {
      setError(err.message || 'Error de conexión con el backend de Prisma');
    } finally {
      setCargando(false);
    }
  };

  const setCredencialPrueba = (correo, clave) => {
    setEmail(correo);
    setPassword(clave);
  };

  return (
    <div 
      className="min-h-screen w-full relative flex flex-col justify-center items-center p-4 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url('/fondo_login_reparto.png')` }}
    >
      {/* Overlay con contraste nítido y balanceado */}
      <div className="absolute inset-0 bg-slate-950/40"></div>

      <div className="relative z-10 max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <img 
            src="/logo_icono_tienda.png" 
            alt="Logo PRISMA" 
            className="w-16 h-16 mx-auto object-contain rounded-2xl p-2 bg-prisma-teal/10 shadow-sm"
          />
          <h1 className="text-2xl font-bold text-prisma-text-primary">PRISMA Web</h1>
          <p className="text-xs text-prisma-text-secondary">Portal B2B de Proveedores y Administración</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-prisma-text-primary mb-1">Correo Electrónico</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@prisma.com.co"
              className="w-full text-xs p-3 border border-prisma-border rounded-xl focus:ring-2 focus:ring-prisma-teal focus:outline-none bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-prisma-text-primary mb-1">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-xs p-3 border border-prisma-border rounded-xl focus:ring-2 focus:ring-prisma-teal focus:outline-none bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-3 bg-prisma-teal hover:bg-prisma-teal-dark text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {cargando ? 'Autenticando...' : (
              <>
                <span>Iniciar Sesión</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Acceso Rápido con Cuentas Semilla */}
        <div className="pt-4 border-t border-prisma-border/80 space-y-2">
          <p className="text-[11px] font-semibold text-prisma-text-secondary uppercase text-center">
            Cuentas Semilla de Prueba
          </p>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => setCredencialPrueba('admin@prisma.com.co', 'admin123')}
              className="p-2.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl text-left transition"
            >
              <p className="font-bold text-slate-800">Admin Prisma</p>
              <p className="text-slate-500 truncate">admin@prisma.com.co</p>
            </button>
            <button
              type="button"
              onClick={() => setCredencialPrueba('logistica@femsa.com.co', 'femsa123')}
              className="p-2.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl text-left transition"
            >
              <p className="font-bold text-slate-800">FEMSA Coca-Cola</p>
              <p className="text-slate-500 truncate">logistica@femsa...</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
