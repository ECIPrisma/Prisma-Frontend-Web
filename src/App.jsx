import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { DisputasPage } from './pages/admin/DisputasPage';
import { AuditoriaPage } from './pages/admin/AuditoriaPage';
import { ProveedoresAdminPage } from './pages/admin/ProveedoresAdminPage';
import { ConfiguracionPage } from './pages/admin/ConfiguracionPage';
import { ProveedorDashboard } from './pages/proveedor/ProveedorDashboard';
import { DespachosPage } from './pages/proveedor/DespachosPage';
import { FlotaPage } from './pages/proveedor/FlotaPage';
import { EstadisticasEconomicasPage } from './pages/proveedor/EstadisticasEconomicasPage';
import { TiendasProveedorPage } from './pages/proveedor/TiendasProveedorPage';
import { PqrsProveedorPage } from './pages/proveedor/PqrsProveedorPage';
import { LiquidacionesPage } from './pages/proveedor/LiquidacionesPage';
import { PedidosSoportePage } from './pages/admin/PedidosSoportePage';

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] relative overflow-x-hidden">
      <Navbar />
      <div className="flex flex-1 relative">
        <Sidebar />
        <main className="flex-1 overflow-y-auto relative min-h-[calc(100vh-4rem)]">
          {/* Fondo ilustrado temático de la red de tiendas y camiones */}
          <div 
            className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat opacity-20"
            style={{ 
              backgroundImage: `url('/fondo_prisma_red.jpg')`,
              backgroundAttachment: 'fixed'
            }}
          />
          {/* Contenido en primer plano */}
          <div className="relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

const RoleRoute = ({ allowedRoles, userRol, children }) => {
  if (!allowedRoles.includes(userRol)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const ProtectedRoutes = () => {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  const rol = user?.rol || user?.usuario?.rol;
  const isPlatformAdmin = rol === 'ROLE_PLATFORM_ADMIN' || rol === 'ROLE_ADMIN' || rol === 'ROLE_SOPORTE';
  const adminRoles = ['ROLE_PLATFORM_ADMIN', 'ROLE_ADMIN', 'ROLE_SOPORTE'];
  const proveedorRoles = ['ROLE_PROVEEDOR_ADMIN', 'ROLE_PROVEEDOR', 'ROLE_PLATFORM_ADMIN'];

  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={isPlatformAdmin ? <AdminDashboard /> : <ProveedorDashboard />} />

        {/* Rutas exclusivas Admin - Si un proveedor cambia la URL a estas páginas, es redirigido */}
        <Route path="/pedidos-soporte" element={<RoleRoute allowedRoles={adminRoles} userRol={rol}><PedidosSoportePage /></RoleRoute>} />
        <Route path="/disputas" element={<RoleRoute allowedRoles={adminRoles} userRol={rol}><DisputasPage /></RoleRoute>} />
        <Route path="/auditoria" element={<RoleRoute allowedRoles={adminRoles} userRol={rol}><AuditoriaPage /></RoleRoute>} />
        <Route path="/proveedores" element={<RoleRoute allowedRoles={adminRoles} userRol={rol}><ProveedoresAdminPage /></RoleRoute>} />
        <Route path="/configuracion" element={<RoleRoute allowedRoles={adminRoles} userRol={rol}><ConfiguracionPage /></RoleRoute>} />

        {/* Rutas de Proveedor */}
        <Route path="/catalogo" element={<RoleRoute allowedRoles={proveedorRoles} userRol={rol}><ProveedorDashboard /></RoleRoute>} />
        <Route path="/tiendas" element={<RoleRoute allowedRoles={proveedorRoles} userRol={rol}><TiendasProveedorPage /></RoleRoute>} />
        <Route path="/despachos" element={<RoleRoute allowedRoles={proveedorRoles} userRol={rol}><DespachosPage /></RoleRoute>} />
        <Route path="/flota" element={<RoleRoute allowedRoles={proveedorRoles} userRol={rol}><FlotaPage /></RoleRoute>} />
        <Route path="/estadisticas" element={<RoleRoute allowedRoles={proveedorRoles} userRol={rol}><EstadisticasEconomicasPage /></RoleRoute>} />
        <Route path="/liquidaciones" element={<RoleRoute allowedRoles={proveedorRoles} userRol={rol}><LiquidacionesPage /></RoleRoute>} />
        <Route path="/pqrs" element={<RoleRoute allowedRoles={proveedorRoles} userRol={rol}><PqrsProveedorPage /></RoleRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MainLayout>
  );
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ProtectedRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
