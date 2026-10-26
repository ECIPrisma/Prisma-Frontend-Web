import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MainLayout } from '../components/layout/MainLayout';
import { RoleRoute } from '../components/common/RoleRoute';
import { Login } from '../pages/Login';
import { ADMIN_ROLES, PROVEEDOR_ROLES } from '../constants/roles';

// Páginas de Administrador
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { DisputasPage } from '../pages/admin/DisputasPage';
import { AuditoriaPage } from '../pages/admin/AuditoriaPage';
import { ProveedoresAdminPage } from '../pages/admin/ProveedoresAdminPage';
import { ConfiguracionPage } from '../pages/admin/ConfiguracionPage';
import { PedidosSoportePage } from '../pages/admin/PedidosSoportePage';

// Páginas de Proveedor Distribuidor
import { ProveedorDashboard } from '../pages/proveedor/ProveedorDashboard';
import { DespachosPage } from '../pages/proveedor/DespachosPage';
import { FlotaPage } from '../pages/proveedor/FlotaPage';
import { EstadisticasEconomicasPage } from '../pages/proveedor/EstadisticasEconomicasPage';
import { TiendasProveedorPage } from '../pages/proveedor/TiendasProveedorPage';
import { PqrsProveedorPage } from '../pages/proveedor/PqrsProveedorPage';
import { LiquidacionesPage } from '../pages/proveedor/LiquidacionesPage';

export const AppRoutes = () => {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  const rol = user?.rol || user?.usuario?.rol;
  const isPlatformAdmin = rol === 'ROLE_PLATFORM_ADMIN' || rol === 'ROLE_ADMIN' || rol === 'ROLE_SOPORTE';

  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={isPlatformAdmin ? <AdminDashboard /> : <ProveedorDashboard />} />

        {/* Rutas exclusivas de Administración */}
        <Route path="/pedidos-soporte" element={<RoleRoute allowedRoles={ADMIN_ROLES} userRol={rol}><PedidosSoportePage /></RoleRoute>} />
        <Route path="/disputas" element={<RoleRoute allowedRoles={ADMIN_ROLES} userRol={rol}><DisputasPage /></RoleRoute>} />
        <Route path="/auditoria" element={<RoleRoute allowedRoles={ADMIN_ROLES} userRol={rol}><AuditoriaPage /></RoleRoute>} />
        <Route path="/proveedores" element={<RoleRoute allowedRoles={ADMIN_ROLES} userRol={rol}><ProveedoresAdminPage /></RoleRoute>} />
        <Route path="/configuracion" element={<RoleRoute allowedRoles={ADMIN_ROLES} userRol={rol}><ConfiguracionPage /></RoleRoute>} />

        {/* Rutas exclusivas de Proveedor / Distribuidor */}
        <Route path="/catalogo" element={<RoleRoute allowedRoles={PROVEEDOR_ROLES} userRol={rol}><ProveedorDashboard /></RoleRoute>} />
        <Route path="/tiendas" element={<RoleRoute allowedRoles={PROVEEDOR_ROLES} userRol={rol}><TiendasProveedorPage /></RoleRoute>} />
        <Route path="/despachos" element={<RoleRoute allowedRoles={PROVEEDOR_ROLES} userRol={rol}><DespachosPage /></RoleRoute>} />
        <Route path="/flota" element={<RoleRoute allowedRoles={PROVEEDOR_ROLES} userRol={rol}><FlotaPage /></RoleRoute>} />
        <Route path="/estadisticas" element={<RoleRoute allowedRoles={PROVEEDOR_ROLES} userRol={rol}><EstadisticasEconomicasPage /></RoleRoute>} />
        <Route path="/liquidaciones" element={<RoleRoute allowedRoles={PROVEEDOR_ROLES} userRol={rol}><LiquidacionesPage /></RoleRoute>} />
        <Route path="/pqrs" element={<RoleRoute allowedRoles={PROVEEDOR_ROLES} userRol={rol}><PqrsProveedorPage /></RoleRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MainLayout>
  );
};
