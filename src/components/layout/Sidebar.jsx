import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  FileText, 
  Sliders, 
  Package, 
  Truck, 
  DollarSign, 
  Building2,
  Navigation,
  ShoppingBag,
  Store,
  MessageSquareWarning,
  Receipt,
  ShieldCheck,
  Users,
  X
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const rol = user?.rol || user?.usuario?.rol;
  const isAdmin = rol === 'ROLE_PLATFORM_ADMIN' || rol === 'ROLE_ADMIN' || rol === 'ROLE_SOPORTE';

  const adminLinks = [
    { to: '/', label: 'Panel Principal', icon: LayoutDashboard },
    { to: '/pedidos-soporte', label: 'Soporte de Pedidos', icon: ShoppingBag },
    { to: '/proveedores', label: 'Empresas y Cartera', icon: Building2 },
    { to: '/usuarios-soporte', label: 'Usuarios y 2FA', icon: Users },
    { to: '/disputas', label: 'Reclamos y Disputas', icon: AlertTriangle },
    { to: '/auditoria', label: 'Historial de Actividad', icon: FileText },
    { to: '/configuracion', label: 'Configuración del Sistema', icon: Sliders },
  ];

  const proveedorLinks = [
    { to: '/', label: 'Catálogo y Publicidad', icon: Package },
    { to: '/tiendas', label: 'Mis Tiendas Clientes', icon: Store },
    { to: '/despachos', label: 'Despachos y Rutas', icon: Truck },
    { to: '/flota', label: 'Flota de Camiones', icon: Navigation },
    { to: '/estadisticas', label: 'Estadísticas Económicas', icon: DollarSign },
    { to: '/liquidaciones', label: 'Liquidaciones', icon: Receipt },
    { to: '/pqrs', label: 'Reclamos y PQRS', icon: MessageSquareWarning },
    { to: '/perfil', label: 'Perfil Comercial', icon: Building2 },
  ];

  const links = isAdmin ? adminLinks : proveedorLinks;

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {/* Backdrop oscuro para pantallas móviles cuando el drawer está abierto */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* Contenedor del Sidebar: Fixed Drawer en móviles / Estático en Desktop */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-prisma-border flex flex-col justify-between p-4 shadow-2xl transition-transform duration-300 ease-in-out
          md:static md:translate-x-0 md:w-64 md:shadow-none md:z-auto md:min-h-[calc(100vh-4rem)] md:shrink-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Cabecera solo visible en móviles dentro del Drawer */}
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-100 md:hidden">
          <div className="flex items-center gap-2">
            <img 
              src="/logo_icono_tienda.png" 
              alt="PRISMA Logo" 
              className="h-8 w-8 object-contain rounded p-1 bg-prisma-teal/10" 
            />
            <span className="font-bold text-base text-prisma-text-primary">Navegación PRISMA</span>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="space-y-1 overflow-y-auto flex-1">
          <div className="px-3 py-2 text-xs font-semibold text-prisma-text-secondary uppercase tracking-wider">
            {isAdmin ? 'Administración' : 'Distribución'}
          </div>
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-prisma-teal text-white shadow-sm'
                      : 'text-prisma-text-secondary hover:text-prisma-text-primary hover:bg-gray-100'
                  }`
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-prisma-border shrink-0">
          <NavLink
            to="/seguridad"
            onClick={handleLinkClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive
                  ? 'bg-prisma-teal text-white shadow-sm'
                  : 'text-prisma-text-secondary hover:text-prisma-text-primary hover:bg-gray-100'
              }`
            }
          >
            <ShieldCheck className="w-5 h-5 flex-shrink-0" />
            <span>Seguridad (2FA)</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
};
