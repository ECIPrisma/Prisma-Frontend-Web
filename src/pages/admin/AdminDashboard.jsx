import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { TrendingUp, ShoppingBag, Truck, AlertTriangle, RefreshCw, AlertCircle, Users } from 'lucide-react';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [proveedores, setProveedores] = useState([]);
  const [disputas, setDisputas] = useState([]);
  const [configuraciones, setConfiguraciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorApi, setErrorApi] = useState('');

  const [ultimaSync, setUltimaSync] = useState(0);

  const cargarDatos = async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    setErrorApi('');
    try {
      const [provs, disps, configs] = await Promise.allSettled([
        adminService.getProveedores(),
        adminService.getDisputas(),
        adminService.getConfiguraciones()
      ]);

      if (provs.status === 'fulfilled') setProveedores(provs.value || []);
      if (disps.status === 'fulfilled') setDisputas(disps.value || []);
      if (configs.status === 'fulfilled') setConfiguraciones(configs.value || []);

      if (provs.status === 'rejected' && disps.status === 'rejected') {
        throw new Error(provs.reason?.message || 'Error de conexión con la API de Spring Boot');
      }
      setUltimaSync(0);
    } catch (err) {
      if (!silencioso) {
        setErrorApi(err.message || 'Error al conectar con el backend de Prisma');
      }
    } finally {
      if (!silencioso) setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    const interval = setInterval(() => {
      cargarDatos(true);
    }, 4000);
    const timer = setInterval(() => {
      setUltimaSync(s => s + 1);
    }, 1000);
    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, []);

  const disputasAbiertas = disputas.filter(d => d.estado === 'ABIERTO').length;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Encabezado Profesional */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Panel de Administración</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              En Línea
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Supervisión operativa, cartera y soporte de la red nacional de distribución B2B.
          </p>
        </div>

        <button
          onClick={() => cargarDatos()}
          disabled={cargando}
          className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${cargando ? 'animate-spin' : ''}`} />
          <span>Actualizar Datos</span>
        </button>
      </div>

      {errorApi && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-center gap-3 text-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <span>{errorApi}</span>
        </div>
      )}

      {/* Métricas Reales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-prisma-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-prisma-text-secondary uppercase">Empresas Proveedoras</p>
            <p className="text-2xl font-bold text-prisma-text-primary mt-1">{cargando ? '...' : proveedores.length}</p>
            <p className="text-xs text-prisma-text-secondary mt-1">Tenants B2B activos</p>
          </div>
          <div className="p-3.5 rounded-xl bg-blue-50">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-prisma-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-prisma-text-secondary uppercase">Mesa de Disputas</p>
            <p className="text-2xl font-bold text-prisma-text-primary mt-1">{cargando ? '...' : disputasAbiertas}</p>
            <p className="text-xs text-prisma-text-secondary mt-1">Requieren atención</p>
          </div>
          <div className="p-3.5 rounded-xl bg-rose-50">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-prisma-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-prisma-text-secondary uppercase">Comisión Pactada</p>
            <p className="text-2xl font-bold text-prisma-text-primary mt-1">2.50%</p>
            <p className="text-xs text-prisma-text-secondary mt-1">Parámetro base quincenal</p>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-50">
            <ShoppingBag className="w-6 h-6 text-prisma-orange-dark" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-prisma-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-prisma-text-secondary uppercase">Feature Flags</p>
            <p className="text-2xl font-bold text-prisma-text-primary mt-1">{cargando ? '...' : configuraciones.length}</p>
            <p className="text-xs text-prisma-text-secondary mt-1">Parámetros en caliente</p>
          </div>
          <div className="p-3.5 rounded-xl bg-teal-50">
            <Truck className="w-6 h-6 text-prisma-teal" />
          </div>
        </div>
      </div>

      {/* Proveedores Registrados */}
      <div className="bg-white rounded-2xl border border-prisma-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-prisma-border flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-prisma-text-primary">Proveedores Registrados en Base de Datos</h2>
            <p className="text-xs text-prisma-text-secondary">Distribuidores mayoristas autorizados a operar en PRISMA</p>
          </div>
          <span className="text-xs font-semibold text-prisma-text-secondary">{proveedores.length} Empresas</span>
        </div>

        {cargando ? (
          <div className="p-12 text-center text-xs text-prisma-text-secondary space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-prisma-teal" />
            <p>Cargando empresas desde la API...</p>
          </div>
        ) : proveedores.length === 0 ? (
          <div className="p-12 text-center text-xs text-prisma-text-secondary space-y-1">
            <p className="font-bold text-prisma-text-primary">Sin proveedores en base de datos</p>
            <p>Ejecuta seed_data.sql o crea nuevos proveedores desde la API.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-prisma-surface text-prisma-text-secondary text-xs font-semibold border-b border-prisma-border">
                <tr>
                  <th className="px-6 py-3.5">NIT</th>
                  <th className="px-6 py-3.5">Razón Social</th>
                  <th className="px-6 py-3.5">Contacto</th>
                  <th className="px-6 py-3.5">Comisión (%)</th>
                  <th className="px-6 py-3.5">Ciudad</th>
                  <th className="px-6 py-3.5">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-prisma-border">
                {proveedores.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-mono font-medium text-xs text-prisma-teal">{p.nit}</td>
                    <td className="px-6 py-4 font-semibold text-prisma-text-primary">{p.razonSocial}</td>
                    <td className="px-6 py-4 text-xs text-prisma-text-secondary">
                      <p className="font-medium text-prisma-text-primary">{p.contactoNombre}</p>
                      <p>{p.contactoEmail}</p>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-prisma-orange-dark">{p.comisionPorcentaje}%</td>
                    <td className="px-6 py-4 text-xs text-prisma-text-secondary">{p.ciudad}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        {p.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
