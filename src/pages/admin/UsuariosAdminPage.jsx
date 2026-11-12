import React, { useEffect, useState, useMemo } from 'react';
import { adminService } from '../../services/api';
import { 
  Users, 
  ShieldCheck, 
  ShieldOff, 
  Search, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  KeyRound, 
  X
} from 'lucide-react';

export const UsuariosAdminPage = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtro2FA, setFiltro2FA] = useState('TODOS'); // 'TODOS', 'ACTIVO', 'INACTIVO'
  
  // Modal de confirmación para restablecer 2FA
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [procesandoReset, setProcesandoReset] = useState(false);

  const cargarUsuarios = async () => {
    setCargando(true);
    setError('');
    try {
      const data = await adminService.getUsuariosAdmin();
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'No fue posible cargar el directorio de usuarios.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      const coincideTexto = 
        (u.nombreCompleto || '').toLowerCase().includes(busqueda.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(busqueda.toLowerCase()) ||
        (u.rol || '').toLowerCase().includes(busqueda.toLowerCase()) ||
        (u.proveedorNombre || '').toLowerCase().includes(busqueda.toLowerCase());

      if (!coincideTexto) return false;

      if (filtro2FA === 'ACTIVO') return u.totpEnabled === true;
      if (filtro2FA === 'INACTIVO') return u.totpEnabled !== true;
      return true;
    });
  }, [usuarios, busqueda, filtro2FA]);

  const handleConfirmarReset = async () => {
    if (!usuarioSeleccionado) return;
    setProcesandoReset(true);
    setError('');
    setMensajeExito('');
    try {
      await adminService.resetTotpUsuario(usuarioSeleccionado.id);
      setMensajeExito(`Se desactivó exitosamente el 2FA para ${usuarioSeleccionado.nombreCompleto} (${usuarioSeleccionado.email}). El usuario ahora puede ingresar solo con su contraseña.`);
      setUsuarioSeleccionado(null);
      await cargarUsuarios();
    } catch (err) {
      setError(err.message || 'Ocurrió un error al intentar restablecer el 2FA del usuario.');
    } finally {
      setProcesandoReset(false);
    }
  };

  const getRolBadgeClass = (rol) => {
    switch (rol) {
      case 'ROLE_PLATFORM_ADMIN':
      case 'ROLE_ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ROLE_PROVEEDOR_ADMIN':
      case 'ROLE_PROVEEDOR':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ROLE_REPARTIDOR':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'ROLE_TENDERO':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-prisma-text-primary flex items-center gap-2">
            <Users className="w-7 h-7 text-prisma-teal" />
            Gestión de Usuarios y Seguridad (2FA)
          </h1>
          <p className="text-sm text-prisma-text-secondary mt-1">
            Directorio de personal operativo y administrativo. En caso de pérdida o robo de celular, puedes restablecer el doble factor de cualquier cuenta.
          </p>
        </div>

        <button
          onClick={cargarUsuarios}
          disabled={cargando}
          className="inline-flex items-center gap-2 px-4 py-2 border border-prisma-border rounded-xl text-sm font-medium text-prisma-text-primary bg-white hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
          Refrescar
        </button>
      </div>

      {/* Alertas */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
          <div className="flex-1">{error}</div>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {mensajeExito && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 mt-0.5" />
          <div className="flex-1">{mensajeExito}</div>
          <button onClick={() => setMensajeExito('')} className="text-emerald-400 hover:text-emerald-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white p-4 rounded-2xl border border-prisma-border shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, correo, rol o empresa..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-prisma-border rounded-xl focus:ring-2 focus:ring-prisma-teal focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-semibold text-prisma-text-secondary whitespace-nowrap">Estado 2FA:</span>
          <div className="inline-flex rounded-xl p-1 bg-gray-100 border border-prisma-border">
            <button
              onClick={() => setFiltro2FA('TODOS')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                filtro2FA === 'TODOS' ? 'bg-white text-prisma-text-primary shadow-sm font-bold' : 'text-prisma-text-secondary hover:text-prisma-text-primary'
              }`}
            >
              Todos ({usuarios.length})
            </button>
            <button
              onClick={() => setFiltro2FA('ACTIVO')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                filtro2FA === 'ACTIVO' ? 'bg-white text-prisma-text-primary shadow-sm font-bold' : 'text-prisma-text-secondary hover:text-prisma-text-primary'
              }`}
            >
              Con 2FA ({usuarios.filter((u) => u.totpEnabled).length})
            </button>
            <button
              onClick={() => setFiltro2FA('INACTIVO')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                filtro2FA === 'INACTIVO' ? 'bg-white text-prisma-text-primary shadow-sm font-bold' : 'text-prisma-text-secondary hover:text-prisma-text-primary'
              }`}
            >
              Sin 2FA ({usuarios.filter((u) => !u.totpEnabled).length})
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="bg-white rounded-2xl border border-prisma-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-prisma-text-primary">
            <thead className="bg-gray-50 border-b border-prisma-border text-xs uppercase text-prisma-text-secondary font-semibold">
              <tr>
                <th className="px-6 py-3.5">Usuario</th>
                <th className="px-6 py-3.5">Rol y Empresa</th>
                <th className="px-6 py-3.5">Teléfono</th>
                <th className="px-6 py-3.5">Estado 2FA</th>
                <th className="px-6 py-3.5 text-right">Acciones de Soporte</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-prisma-border">
              {cargando ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-prisma-text-secondary">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-prisma-teal" />
                    Cargando directorio de usuarios...
                  </td>
                </tr>
              ) : usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-prisma-text-secondary">
                    No se encontraron usuarios que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/80 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-prisma-text-primary">{u.nombreCompleto}</div>
                      <div className="text-xs text-prisma-text-secondary">{u.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full border ${getRolBadgeClass(u.rol)}`}>
                        {u.rol?.replace('ROLE_', '')}
                      </span>
                      {u.proveedorNombre && (
                        <div className="text-xs text-prisma-text-secondary mt-1">{u.proveedorNombre}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-prisma-text-secondary">
                      {u.telefono || 'No registrado'}
                    </td>
                    <td className="px-6 py-4">
                      {u.totpEnabled ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          2FA Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-gray-50 text-gray-500 border border-gray-200">
                          <ShieldOff className="w-3.5 h-3.5 text-gray-400" />
                          2FA Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {u.totpEnabled ? (
                        <button
                          onClick={() => setUsuarioSeleccionado(u)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold transition shadow-sm hover:shadow"
                          title="Restablecer 2FA por pérdida de celular"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                          Restablecer 2FA
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Sin bloqueo 2FA</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Confirmación para Restablecer 2FA */}
      {usuarioSeleccionado && (
        <div 
          role="dialog" 
          aria-modal="true" 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-prisma-border space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-prisma-text-primary">
                  ¿Restablecer Doble Factor (2FA)?
                </h3>
                <p className="text-sm text-prisma-text-secondary mt-1">
                  Estás a punto de desactivar la autenticación en dos pasos para el usuario:
                </p>
                <div className="mt-3 p-3 bg-gray-50 border border-prisma-border rounded-xl text-xs space-y-1">
                  <div><strong>Nombre:</strong> {usuarioSeleccionado.nombreCompleto}</div>
                  <div><strong>Correo:</strong> {usuarioSeleccionado.email}</div>
                  <div><strong>Rol:</strong> {usuarioSeleccionado.rol}</div>
                </div>
                <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 mt-3">
                  ⚠️ Esta acción revocará todas las sesiones activas del usuario y le permitirá iniciar sesión inmediatamente solo con su correo y contraseña.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-prisma-border">
              <button
                type="button"
                onClick={() => setUsuarioSeleccionado(null)}
                disabled={procesandoReset}
                className="px-4 py-2 text-sm font-medium text-prisma-text-secondary hover:text-prisma-text-primary bg-white hover:bg-gray-100 rounded-xl transition border border-prisma-border"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarReset}
                disabled={procesandoReset}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition shadow-sm disabled:opacity-50"
              >
                {procesandoReset ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Restableciendo...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    Sí, Desactivar 2FA
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
