import React from 'react';
import { formatearComision } from '../config/comision';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  Receipt
} from 'lucide-react';

export const Sidebar = () => {
  const { user } = useAuth();
  const rol = user?.rol || user?.usuario?.rol;
  const isAdmin = rol === 'ROLE_PLATFORM_ADMIN' || rol === 'ROLE_ADMIN' || rol === 'ROLE_SOPORTE';

  const adminLinks = [
    { to: '/', label: 'Panel Principal', icon: LayoutDashboard },
    { to: '/pedidos-soporte', label: 'Soporte de Pedidos', icon: ShoppingBag },
    { to: '/proveedores', label: 'Empresas y Cartera', icon: Building2 },
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
    { to: '/liquidaciones', label: `Liquidaciones (${formatearComision()})`, icon: Receipt },
    { to: '/pqrs', label: 'Reclamos y PQRS', icon: MessageSquareWarning },
  ];

  const links = isAdmin ? adminLinks : proveedorLinks;

  return (
    <aside className="w-64 bg-white border-r border-prisma-border flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)]">
      <nav className="space-y-1">
        <div className="px-3 py-2 text-xs font-semibold text-prisma-text-secondary uppercase tracking-wider">
          {isAdmin ? 'Administración' : 'Distribución'}
        </div>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
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
    </aside>
  );
};
