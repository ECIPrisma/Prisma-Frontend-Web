import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import { AlertCircle, ArrowRight } from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    try {
      const data = await authService.login(email.trim(), password);
      login(data);
    } catch (err) {
      setError(err.message || 'Error de conexión con el backend de Prisma');
    } finally {
      setCargando(false);
    }
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
            <label htmlFor="email" className="block text-xs font-bold text-prisma-text-primary mb-1">Correo Electrónico</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@empresa.com"
              className="w-full text-xs p-3 border border-prisma-border rounded-xl focus:ring-2 focus:ring-prisma-teal focus:outline-none bg-white"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-bold text-prisma-text-primary mb-1">Contraseña</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              autoComplete="current-password"
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

        <div className="pt-2 text-center text-[11px] text-prisma-text-secondary">
          <span>Acceso seguro protegido mediante cifrado JWT y SSL</span>
        </div>
      </div>
    </div>
  );
};
