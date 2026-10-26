import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { 
  Building2, 
  Plus, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  X, 
  Edit2, 
  Trash2, 
  Check, 
  Store, 
  DollarSign, 
  Truck, 
  AlertTriangle, 
  LifeBuoy, 
  Eye, 
  MapPin, 
  Phone, 
  User,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';

export const ProveedoresAdminPage = () => {
  const [carteraEmpresas, setCarteraEmpresas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Modal Ver Tiendas de la Empresa
  const [modalTiendas, setModalTiendas] = useState(null);
  const [tiendasEmpresa, setTiendasEmpresa] = useState([]);
  const [cargandoTiendas, setCargandoTiendas] = useState(false);

  // Modal Auxilio / Asistencia de Soporte
  const [modalAuxilio, setModalAuxilio] = useState(null);
  const [accionAuxilio, setAccionAuxilio] = useState('DESBLOQUEAR_RUTA');
  const [notasAuxilio, setNotasAuxilio] = useState('Asistencia técnica y logística brindada por soporte Prisma.');
  const [enviandoAuxilio, setEnviandoAuxilio] = useState(false);

  // Modal Crear Proveedor
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [nuevoProv, setNuevoProv] = useState({
    nit: '',
    razonSocial: '',
    nombreComercial: '',
    contactoNombre: '',
    contactoEmail: '',
    contactoTelefono: '',
    direccionSede: '',
    ciudad: 'Bogotá',
    comisionPorcentaje: '2.50'
  });

  // Modal Editar Proveedor
  const [modalEditar, setModalEditar] = useState(false);
  const [guardandoEditar, setGuardandoEditar] = useState(false);
  const [provEnEdicion, setProvEnEdicion] = useState(null);

  const cargarDatos = async (silencioso = false) => {
    try {
      if (!silencioso && carteraEmpresas.length === 0) setCargando(true);
      const data = await adminService.getCarteraEmpresas();
      setCarteraEmpresas(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      if (!silencioso && carteraEmpresas.length === 0) {
        setError(err.message || 'Error al consultar la cartera de empresas');
      }
    } finally {
      if (!silencioso && carteraEmpresas.length === 0) setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    const interval = setInterval(() => {
      cargarDatos(true);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleVerTiendas = async (empresa) => {
    try {
      setModalTiendas(empresa);
      setCargandoTiendas(true);
      const provId = empresa.proveedorId || empresa.id;
      const tiendas = await adminService.getTiendasProveedorAdmin(provId);
      setTiendasEmpresa(Array.isArray(tiendas) ? tiendas : []);
    } catch (err) {
      alert('Error al consultar tiendas de la empresa: ' + (err.message || err));
    } finally {
      setCargandoTiendas(false);
    }
  };

  const handleCrearProveedor = async (e) => {
    e.preventDefault();
    try {
      setGuardando(true);
      await adminService.crearProveedor({
        ...nuevoProv,
        comisionPorcentaje: parseFloat(nuevoProv.comisionPorcentaje)
      });
      setModalAbierto(false);
      setNuevoProv({
        nit: '',
        razonSocial: '',
        nombreComercial: '',
        contactoNombre: '',
        contactoEmail: '',
        contactoTelefono: '',
        direccionSede: '',
        ciudad: 'Bogotá',
        comisionPorcentaje: '2.50'
      });
      await cargarDatos();
    } catch (err) {
      alert('Error al registrar proveedor: ' + err.message);
    } finally {
      setGuardando(false);
    }
  };

  const handleToggleEstado = async (id, estadoActual) => {
    const nuevoEstado = estadoActual === 'ACTIVO' ? 'SUSPENDIDO' : 'ACTIVO';
    if (!confirm(`¿Estás seguro de cambiar el estado de la empresa a ${nuevoEstado}?`)) return;

    try {
      await adminService.cambiarEstadoProveedor(id, nuevoEstado);
      await cargarDatos(true);
    } catch (err) {
      alert('Error al cambiar estado: ' + err.message);
    }
  };

  const handleAbrirEditar = (prov) => {
    setProvEnEdicion({
      id: prov.proveedorId || prov.id,
      nit: prov.nit,
      razonSocial: prov.razonSocial || '',
      nombreComercial: prov.nombreComercial || '',
      contactoNombre: prov.contactoNombre || '',
      contactoEmail: prov.contactoEmail || '',
      contactoTelefono: prov.contactoTelefono || '',
      direccionSede: prov.direccionSede || '',
      ciudad: prov.ciudad || 'Bogotá',
      comisionPorcentaje: (prov.porcentajeComision || prov.comisionPorcentaje || 2.5).toString()
    });
    setModalEditar(true);
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    if (!provEnEdicion) return;
    try {
      setGuardandoEditar(true);
      await adminService.actualizarProveedor(provEnEdicion.id, {
        razonSocial: provEnEdicion.razonSocial,
        nombreComercial: provEnEdicion.nombreComercial,
        contactoNombre: provEnEdicion.contactoNombre,
        contactoEmail: provEnEdicion.contactoEmail,
        contactoTelefono: provEnEdicion.contactoTelefono,
        direccionSede: provEnEdicion.direccionSede,
        ciudad: provEnEdicion.ciudad,
        comisionPorcentaje: parseFloat(provEnEdicion.comisionPorcentaje)
      });
      setModalEditar(false);
      setProvEnEdicion(null);
      await cargarDatos(true);
    } catch (err) {
      alert('Error al actualizar empresa: ' + err.message);
    } finally {
      setGuardandoEditar(false);
    }
  };

  const handleEliminarProveedor = async (id, nombre) => {
    if (!confirm(`¿Estás seguro de dar de baja a "${nombre}"? Sus pedidos históricos se mantendrán archivados.`)) {
      return;
    }
    try {
      await adminService.eliminarProveedor(id);
      await cargarDatos(true);
    } catch (err) {
      alert('Error al eliminar empresa: ' + err.message);
    }
  };

  const handleEjecutarAuxilio = async (e) => {
    e.preventDefault();
    if (!modalAuxilio) return;
    try {
      setEnviandoAuxilio(true);
      await adminService.auxilioRutaSoporte(modalAuxilio.rutaId || 1, accionAuxilio, notasAuxilio);
      alert('Auxilio de soporte Prisma ejecutado exitosamente.');
      setModalAuxilio(null);
      await cargarDatos(true);
    } catch (err) {
      alert('Error al enviar auxilio de soporte: ' + (err.message || err));
    } finally {
      setEnviandoAuxilio(false);
    }
  };

  // Cálculos consolidados para el Administrador
  const totalEmpresas = carteraEmpresas.length;
  const totalTiendasRed = carteraEmpresas.reduce((acc, e) => acc + (Number(e.totalTiendas) || 0), 0);
  const totalVentasRed = carteraEmpresas.reduce((acc, e) => acc + (Number(e.ventasTotales) || 0), 0);
  const totalCarteraPrisma = carteraEmpresas.reduce((acc, e) => acc + (Number(e.deudaComisionPrisma) || 0), 0);
  const totalRutasVaradas = carteraEmpresas.reduce((acc, e) => acc + (Number(e.rutasVaradas) || 0), 0);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Cabecera Principal */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-prisma-text-primary flex items-center gap-2">
            <Building2 className="w-7 h-7 text-prisma-teal" />
            Empresas Productoras & Cartera Prisma
          </h1>
          <p className="text-xs text-prisma-text-secondary mt-1">
            Supervisión integral de empresas aliadas, balance de comisiones adeudadas a la plataforma y auxilio operativo.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setModalAbierto(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-prisma-teal hover:bg-prisma-teal-dark text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Vincular Nueva Empresa</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards de Control de Cartera y Plataforma */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-prisma-border shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-sky-50 text-sky-700 rounded-2xl">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-prisma-text-secondary">Empresas Aliadas</p>
            <h3 className="text-xl font-bold text-prisma-text-primary mt-0.5">{totalEmpresas}</h3>
            <p className="text-[10px] text-sky-600 mt-0.5 font-medium">Compañías proveedoras</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-prisma-border shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-blue-50 text-blue-700 rounded-2xl">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-prisma-text-secondary">Tiendas en Cobertura</p>
            <h3 className="text-xl font-bold text-prisma-text-primary mt-0.5">{totalTiendasRed}</h3>
            <p className="text-[10px] text-blue-600 mt-0.5 font-medium">Puntos atendidos</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-prisma-border shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-purple-50 text-purple-700 rounded-2xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-prisma-text-secondary">Ventas Consolidadas</p>
            <h3 className="text-xl font-bold text-prisma-text-primary mt-0.5">
              ${totalVentasRed.toLocaleString('es-CO')}
            </h3>
            <p className="text-[10px] text-purple-600 mt-0.5 font-medium">Volumen total canal B2B</p>
          </div>
        </div>

        {/* Tarjeta Destacada: Cartera de Comisiones de Prisma */}
        <div className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white p-5 rounded-2xl shadow-md flex items-center gap-4">
          <div className="p-3.5 bg-white/20 text-white rounded-2xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-emerald-100 uppercase tracking-wider">Cartera Prisma (2.5%)</p>
            <h3 className="text-2xl font-black mt-0.5">
              ${totalCarteraPrisma.toLocaleString('es-CO')}
            </h3>
            <p className="text-[10px] text-emerald-100 mt-0.5 font-medium">Total por cobrar a empresas</p>
          </div>
        </div>
      </div>

      {/* Alerta de Rutas con Percance o Varadas si existen */}
      {totalRutasVaradas > 0 && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 flex items-center justify-between gap-4 text-rose-900 shadow-sm animate-pulse">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm">Alerta: {totalRutasVaradas} Ruta(s) con Percance o Camión Varado en la Red</p>
              <p className="text-xs text-rose-700">Algunas empresas tienen vehículos detenidos. Como Administrador Prisma puedes brindar auxilio y reasignación.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de Empresas y su Cartera */}
      <div className="bg-white rounded-2xl border border-prisma-border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-prisma-border flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-sm font-bold text-prisma-text-primary">Detalle de Empresas y Cuentas de Cobro</h2>
            <p className="text-xs text-prisma-text-secondary mt-0.5">Control de cobertura de tiendas y deudas por comisión a la plataforma</p>
          </div>
          <span className="text-xs font-semibold text-prisma-text-secondary bg-white px-3 py-1 rounded-xl border border-prisma-border">
            {carteraEmpresas.length} Empresas Vinculadas
          </span>
        </div>

        {cargando ? (
          <div className="p-12 text-center text-xs text-prisma-text-secondary">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-prisma-teal" />
            Cargando cartera de empresas y balances...
          </div>
        ) : carteraEmpresas.length === 0 ? (
          <div className="p-12 text-center text-xs text-prisma-text-secondary space-y-2">
            <Building2 className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="font-bold text-prisma-text-primary text-sm">No hay empresas vinculadas</p>
            <p>Registra la primera empresa distribuidora con el botón superior.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-prisma-surface text-prisma-text-secondary border-b border-prisma-border uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4">Empresa / NIT</th>
                  <th className="p-4">Contacto</th>
                  <th className="p-4 text-center">Tiendas Atendidas</th>
                  <th className="p-4 text-center">Flota Camiones</th>
                  <th className="p-4 text-right">Ventas Totales</th>
                  <th className="p-4 text-right bg-amber-50/40 text-amber-900">Deuda a Prisma (2.5%)</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-prisma-border">
                {carteraEmpresas.map((prov) => {
                  const tieneVaradas = Number(prov.rutasVaradas || 0) > 0;
                  const deuda = Number(prov.deudaComisionPrisma || 0);

                  return (
                    <tr key={prov.proveedorId || prov.id} className="hover:bg-gray-50/60 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-gray-100 rounded-xl text-gray-700 flex-shrink-0">
                            <Building2 className="w-5 h-5 text-prisma-teal" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-prisma-text-primary">
                              {prov.nombreComercial || prov.razonSocial}
                            </p>
                            <p className="text-[11px] text-gray-500 font-mono">NIT: {prov.nit}</p>
                            <p className="text-[10px] text-gray-400">{prov.razonSocial}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-prisma-text-secondary">
                        <p className="font-semibold text-prisma-text-primary flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span>{prov.contactoNombre}</span>
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{prov.contactoEmail}</p>
                        <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span>{prov.contactoTelefono}</span>
                        </p>
                      </td>

                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleVerTiendas(prov)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold border border-blue-200 transition"
                          title="Hacer clic para ver las tienditas"
                        >
                          <Store className="w-3.5 h-3.5" />
                          <span>{prov.totalTiendas} Tiendas</span>
                          <Eye className="w-3 h-3 text-blue-500 ml-0.5" />
                        </button>
                      </td>

                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-xl">
                          <Truck className="w-3.5 h-3.5 text-gray-500" />
                          <span>{prov.totalCamiones}</span>
                        </span>
                      </td>

                      <td className="p-4 text-right font-bold text-prisma-text-primary">
                        ${Number(prov.ventasTotales || 0).toLocaleString('es-CO')}
                      </td>

                      {/* Monto de Deuda de la Empresa hacia Prisma */}
                      <td className="p-4 text-right bg-amber-50/40">
                        <div className="inline-block text-right">
                          <p className="font-black text-sm text-amber-900">
                            ${deuda.toLocaleString('es-CO')}
                          </p>
                          <p className="text-[10px] text-amber-700 font-medium">
                            Tarifa: {prov.porcentajeComision || 2.5}%
                          </p>
                        </div>
                      </td>

                      <td className="p-4 text-center">
                        <div className="space-y-1">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            prov.estado === 'ACTIVO'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {prov.estado}
                          </span>
                          {tieneVaradas && (
                            <span className="block px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 text-rose-800 animate-pulse">
                              Auxilio ({prov.rutasVaradas})
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botón de Auxilio de Emergencia */}
                          <button
                            onClick={() => {
                              setModalAuxilio(prov);
                              setNotasAuxilio(`Asistencia brindada a la empresa ${prov.nombreComercial}.`);
                            }}
                            className={`p-2 rounded-xl transition ${
                              tieneVaradas
                                ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 animate-bounce'
                                : 'bg-gray-100 hover:bg-amber-50 text-gray-600 hover:text-amber-700'
                            }`}
                            title="Auxilio de Soporte / Intervención Prisma"
                          >
                            <LifeBuoy className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleAbrirEditar(prov)}
                            className="p-2 text-gray-500 hover:text-prisma-teal hover:bg-gray-100 rounded-xl transition"
                            title="Editar empresa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleToggleEstado(prov.proveedorId || prov.id, prov.estado)}
                            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition ${
                              prov.estado === 'ACTIVO'
                                ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                                : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {prov.estado === 'ACTIVO' ? 'Suspender' : 'Activar'}
                          </button>

                          <button
                            onClick={() => handleEliminarProveedor(prov.proveedorId || prov.id, prov.nombreComercial || prov.razonSocial)}
                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                            title="Eliminar registro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: VER TIENDAS ATENDIDAS POR LA EMPRESA (REQUERIMIENTO DEL USUARIO) */}
      {modalTiendas && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-prisma-border pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 text-blue-700 rounded-2xl">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-prisma-text-primary">
                    Tiendas Atendidas por: {modalTiendas.nombreComercial || modalTiendas.razonSocial}
                  </h3>
                  <p className="text-xs text-prisma-text-secondary mt-0.5">
                    Red de clientes y tiendas de barrio registradas bajo la cobertura de esta distribuidora
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setModalTiendas(null)} 
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cargandoTiendas ? (
              <div className="p-12 text-center text-xs text-prisma-text-secondary">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-prisma-teal" />
                Cargando tienditas vinculadas...
              </div>
            ) : tiendasEmpresa.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500 space-y-2">
                <Store className="w-10 h-10 text-gray-300 mx-auto" />
                <p className="font-bold">Esta empresa aún no tiene tiendas asignadas en el sistema.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {tiendasEmpresa.map((tienda) => (
                    <div 
                      key={tienda.id}
                      className="p-4 rounded-2xl border border-prisma-border bg-gray-50/50 hover:bg-white hover:shadow-sm transition space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-sm text-prisma-text-primary">{tienda.nombreTienda}</h4>
                          <p className="text-[11px] text-gray-500 font-mono">CC/NIT: {tienda.nitOCedula || 'N/A'}</p>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-lg">
                          {tienda.estado || 'ACTIVA'}
                        </span>
                      </div>

                      <div className="text-xs text-prisma-text-secondary space-y-1 pt-1 border-t border-gray-200/60">
                        <p className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          <span>{tienda.direccion} • {tienda.barrio || tienda.ciudad}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span>Tendero: {tienda.tendero ? tienda.tendero.nombreCompleto : 'Doña Marta'}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span>{tienda.telefonoTienda || '3205551234'}</span>
                        </p>
                      </div>

                      {tienda.diaPreferidoEntrega && (
                        <p className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg">
                          Día de entrega preferido: {tienda.diaPreferidoEntrega}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-prisma-border">
              <button
                type="button"
                onClick={() => setModalTiendas(null)}
                className="px-5 py-2.5 bg-prisma-teal hover:bg-prisma-teal/90 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                Cerrar Tiendas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AUXILIO Y ASISTENCIA DE SOPORTE PRISMA (SI EL PRODUCTOR NO PUEDE) */}
      {modalAuxilio && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in duration-200">
            <div className="flex justify-between items-start border-b border-prisma-border pb-3">
              <div>
                <h3 className="font-bold text-base text-amber-700 flex items-center gap-2">
                  <LifeBuoy className="w-5 h-5" />
                  Auxilio y Soporte de Emergencia Prisma
                </h3>
                <p className="text-xs text-prisma-text-secondary mt-0.5">
                  Intervención para: <strong>{modalAuxilio.nombreComercial || modalAuxilio.razonSocial}</strong>
                </p>
              </div>
              <button onClick={() => setModalAuxilio(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEjecutarAuxilio} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-prisma-text-primary mb-2">
                  Tipo de Asistencia Administrativa:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'DESBLOQUEAR_RUTA', label: 'Destrabar Ruta Varada' },
                    { id: 'REASIGNAR_PEDIDOS', label: 'Auxilio de Reparto' },
                    { id: 'SOPORTE_TECNICO', label: 'Soporte Plataforma' },
                    { id: 'CONTACTAR_TENDEROS', label: 'Notificar Tenderos' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setAccionAuxilio(item.id)}
                      className={`p-2.5 rounded-xl border text-center font-bold transition ${
                        accionAuxilio === item.id
                          ? 'border-amber-500 bg-amber-50 text-amber-800'
                          : 'border-prisma-border bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-prisma-text-primary mb-1">
                  Bitácora de Soporte / Instrucciones de Intervención:
                </label>
                <textarea
                  rows={3}
                  value={notasAuxilio}
                  onChange={(e) => setNotasAuxilio(e.target.value)}
                  className="w-full p-2.5 border border-prisma-border rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-prisma-border">
                <button
                  type="button"
                  onClick={() => setModalAuxilio(null)}
                  className="px-4 py-2 border border-prisma-border rounded-xl font-semibold hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviandoAuxilio}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {enviandoAuxilio ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LifeBuoy className="w-4 h-4" />}
                  <span>Ejecutar Auxilio Prisma</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Proveedor */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-prisma-border shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-prisma-border pb-3">
              <h3 className="font-bold text-base text-prisma-text-primary flex items-center gap-2">
                <Building2 className="w-5 h-5 text-prisma-teal" />
                Registrar Nueva Empresa Proveedora
              </h3>
              <button onClick={() => setModalAbierto(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearProveedor} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-prisma-text-primary mb-1">NIT</label>
                  <input
                    type="text"
                    required
                    placeholder="860.000.123-1"
                    value={nuevoProv.nit}
                    onChange={(e) => setNuevoProv({ ...nuevoProv, nit: e.target.value })}
                    className="w-full p-2.5 border border-prisma-border rounded-xl focus:ring-2 focus:ring-prisma-teal font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-prisma-text-primary mb-1">Nombre Comercial</label>
                  <input
                    type="text"
                    required
                    placeholder="Coca-Cola FEMSA"
                    value={nuevoProv.nombreComercial}
                    onChange={(e) => setNuevoProv({ ...nuevoProv, nombreComercial: e.target.value })}
                    className="w-full p-2.5 border border-prisma-border rounded-xl focus:ring-2 focus:ring-prisma-teal"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-prisma-text-primary mb-1">Razón Social</label>
                <input
                  type="text"
                  required
                  placeholder="Industria Nacional de Gaseosas S.A.S."
                  value={nuevoProv.razonSocial}
                  onChange={(e) => setNuevoProv({ ...nuevoProv, razonSocial: e.target.value })}
                  className="w-full p-2.5 border border-prisma-border rounded-xl focus:ring-2 focus:ring-prisma-teal"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-prisma-text-primary mb-1">Contacto Nombre</label>
                  <input
                    type="text"
                    required
                    placeholder="Carlos Morales"
                    value={nuevoProv.contactoNombre}
                    onChange={(e) => setNuevoProv({ ...nuevoProv, contactoNombre: e.target.value })}
                    className="w-full p-2.5 border border-prisma-border rounded-xl focus:ring-2 focus:ring-prisma-teal"
                  />
                </div>
                <div>
                  <label className="block font-bold text-prisma-text-primary mb-1">Contacto Teléfono</label>
                  <input
                    type="text"
                    required
                    placeholder="3109876543"
                    value={nuevoProv.contactoTelefono}
                    onChange={(e) => setNuevoProv({ ...nuevoProv, contactoTelefono: e.target.value })}
                    className="w-full p-2.5 border border-prisma-border rounded-xl focus:ring-2 focus:ring-prisma-teal"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-prisma-text-primary mb-1">Contacto Email</label>
                <input
                  type="email"
                  required
                  placeholder="logistica@femsa.com.co"
                  value={nuevoProv.contactoEmail}
                  onChange={(e) => setNuevoProv({ ...nuevoProv, contactoEmail: e.target.value })}
                  className="w-full p-2.5 border border-prisma-border rounded-xl focus:ring-2 focus:ring-prisma-teal"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-prisma-text-primary mb-1">Dirección Sede</label>
                  <input
                    type="text"
                    required
                    placeholder="Calle 100 # 19-61"
                    value={nuevoProv.direccionSede}
                    onChange={(e) => setNuevoProv({ ...nuevoProv, direccionSede: e.target.value })}
                    className="w-full p-2.5 border border-prisma-border rounded-xl focus:ring-2 focus:ring-prisma-teal"
                  />
                </div>
                <div>
                  <label className="block font-bold text-prisma-text-primary mb-1">Ciudad</label>
                  <input
                    type="text"
                    required
                    placeholder="Bogotá"
                    value={nuevoProv.ciudad}
                    onChange={(e) => setNuevoProv({ ...nuevoProv, ciudad: e.target.value })}
                    className="w-full p-2.5 border border-prisma-border rounded-xl focus:ring-2 focus:ring-prisma-teal"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-prisma-text-primary mb-1">Comisión PRISMA (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  value={nuevoProv.comisionPorcentaje}
                  onChange={(e) => setNuevoProv({ ...nuevoProv, comisionPorcentaje: e.target.value })}
                  className="w-full p-2.5 border border-prisma-border rounded-xl focus:ring-2 focus:ring-prisma-teal font-semibold"
                />
              </div>

              <div className="pt-3 border-t border-prisma-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 border border-prisma-border text-prisma-text-secondary rounded-xl hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2 bg-prisma-teal hover:bg-prisma-teal-dark text-white rounded-xl font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {guardando ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Registrar Empresa</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Proveedor */}
      {modalEditar && provEnEdicion && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-prisma-border shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-prisma-border pb-3">
              <h3 className="font-bold text-base text-prisma-text-primary flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-prisma-teal" />
                Editar Distribuidora: {provEnEdicion.nombreComercial}
              </h3>
              <button onClick={() => { setModalEditar(false); setProvEnEdicion(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarEdicion} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-prisma-text-primary mb-1">Nombre Comercial</label>
                  <input
                    type="text"
                    required
                    value={provEnEdicion.nombreComercial}
                    onChange={(e) => setProvEnEdicion({ ...provEnEdicion, nombreComercial: e.target.value })}
                    className="w-full p-2.5 border border-prisma-border rounded-xl focus:ring-2 focus:ring-prisma-teal"
                  />
                </div>
                <div>
                  <label className="block font-bold text-prisma-text-primary mb-1">Razón Social</label>
                  <input
                    type="text"
                    required
                    value={provEnEdicion.razonSocial}
                    onChange={(e) => setProvEnEdicion({ ...provEnEdicion, razonSocial: e.target.value })}
                    className="w-full p-2.5 border border-prisma-border rounded-xl focus:ring-2 focus:ring-prisma-teal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-prisma-text-primary mb-1">Contacto Nombre</label>
                  <input
                    type="text"
                    required
                    value={provEnEdicion.contactoNombre}
                    onChange={(e) => setProvEnEdicion({ ...provEnEdicion, contactoNombre: e.target.value })}
                    className="w-full p-2.5 border border-prisma-border rounded-xl focus:ring-2 focus:ring-prisma-teal"
                  />
                </div>
                <div>
                  <label className="block font-bold text-prisma-text-primary mb-1">Contacto Teléfono</label>
                  <input
                    type="text"
                    required
                    value={provEnEdicion.contactoTelefono}
                    onChange={(e) => setProvEnEdicion({ ...provEnEdicion, contactoTelefono: e.target.value })}
                    className="w-full p-2.5 border border-prisma-border rounded-xl focus:ring-2 focus:ring-prisma-teal"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-prisma-text-primary mb-1">Contacto Email</label>
                <input
                  type="email"
                  required
                  value={provEnEdicion.contactoEmail}
                  onChange={(e) => setProvEnEdicion({ ...provEnEdicion, contactoEmail: e.target.value })}
                  className="w-full p-2.5 border border-prisma-border rounded-xl focus:ring-2 focus:ring-prisma-teal"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-prisma-text-primary mb-1">Dirección Sede</label>
                  <input
                    type="text"
                    required
                    value={provEnEdicion.direccionSede}
                    onChange={(e) => setProvEnEdicion({ ...provEnEdicion, direccionSede: e.target.value })}
                    className="w-full p-2.5 border border-prisma-border rounded-xl focus:ring-2 focus:ring-prisma-teal"
                  />
                </div>
                <div>
                  <label className="block font-bold text-prisma-text-primary mb-1">Ciudad</label>
                  <input
                    type="text"
                    required
                    value={provEnEdicion.ciudad}
                    onChange={(e) => setProvEnEdicion({ ...provEnEdicion, ciudad: e.target.value })}
                    className="w-full p-2.5 border border-prisma-border rounded-xl focus:ring-2 focus:ring-prisma-teal"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-prisma-text-primary mb-1">Comisión PRISMA (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  value={provEnEdicion.comisionPorcentaje}
                  onChange={(e) => setProvEnEdicion({ ...provEnEdicion, comisionPorcentaje: e.target.value })}
                  className="w-full p-2.5 border border-prisma-border rounded-xl focus:ring-2 focus:ring-prisma-teal font-semibold"
                />
              </div>

              <div className="pt-3 border-t border-prisma-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setModalEditar(false); setProvEnEdicion(null); }}
                  className="px-4 py-2 border border-prisma-border text-prisma-text-secondary rounded-xl hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoEditar}
                  className="px-5 py-2 bg-prisma-teal hover:bg-prisma-teal-dark text-white rounded-xl font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {guardandoEditar ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
