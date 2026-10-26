import React, { useState, useEffect } from 'react';
import { proveedorService } from '../../services/api';
import { 
  Truck, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle, 
  Navigation, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Check, 
  Smartphone, 
  Key, 
  Copy, 
  ShieldCheck, 
  Clock, 
  CheckCheck 
} from 'lucide-react';

export const FlotaPage = () => {
  const [camiones, setCamiones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [copiadoId, setCopiadoId] = useState(null);

  // Modal Crear Camión / Terminal Móvil
  const [modalCrear, setModalCrear] = useState(false);
  const [guardandoCrear, setGuardandoCrear] = useState(false);
  const [nuevoCamion, setNuevoCamion] = useState({
    placa: '',
    marcaModelo: '',
    capacidadPesoKg: '3500',
    capacidadCanastas: '120',
    pin: '123456'
  });

  // Modal Editar Camión / Clave
  const [modalEditar, setModalEditar] = useState(false);
  const [guardandoEditar, setGuardandoEditar] = useState(false);
  const [camionEnEdicion, setCamionEnEdicion] = useState(null);

  const cargarDatos = async (silencioso = false) => {
    try {
      if (!silencioso && camiones.length === 0) setCargando(true);
      const data = await proveedorService.getCamiones();
      setCamiones(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      if (!silencioso && camiones.length === 0) {
        setError(err.message || 'Error al consultar la flota de camiones');
      }
    } finally {
      if (!silencioso && camiones.length === 0) setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    const interval = setInterval(() => {
      cargarDatos(true);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleCrearCamion = async (e) => {
    e.preventDefault();
    if (!nuevoCamion.placa.trim() || !nuevoCamion.marcaModelo.trim()) {
      alert('Por favor ingrese la placa y el modelo del vehículo.');
      return;
    }
    try {
      setGuardandoCrear(true);
      await proveedorService.crearCamion({
        placa: nuevoCamion.placa.toUpperCase().trim(),
        marcaModelo: nuevoCamion.marcaModelo.trim(),
        capacidadPesoKg: parseFloat(nuevoCamion.capacidadPesoKg),
        capacidadCanastas: parseInt(nuevoCamion.capacidadCanastas),
        pin: nuevoCamion.pin.trim() || '123456'
      });
      setModalCrear(false);
      setNuevoCamion({
        placa: '',
        marcaModelo: '',
        capacidadPesoKg: '3500',
        capacidadCanastas: '120',
        pin: '123456'
      });
      await cargarDatos(true);
    } catch (err) {
      alert('Error al registrar vehículo: ' + err.message);
    } finally {
      setGuardandoCrear(false);
    }
  };

  const handleAbrirEditar = (camion) => {
    setCamionEnEdicion({
      id: camion.id,
      placa: camion.placa,
      marcaModelo: camion.marcaModelo,
      capacidadPesoKg: camion.capacidadPesoKg,
      capacidadCanastas: camion.capacidadCanastas,
      estado: camion.estado,
      pin: ''
    });
    setModalEditar(true);
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    if (!camionEnEdicion) return;
    try {
      setGuardandoEditar(true);
      const payload = {
        marcaModelo: camionEnEdicion.marcaModelo,
        capacidadPesoKg: parseFloat(camionEnEdicion.capacidadPesoKg),
        capacidadCanastas: parseInt(camionEnEdicion.capacidadCanastas),
        estado: camionEnEdicion.estado
      };
      if (camionEnEdicion.pin && camionEnEdicion.pin.trim()) {
        payload.pin = camionEnEdicion.pin.trim();
      }

      await proveedorService.actualizarCamion(camionEnEdicion.id, payload);
      setModalEditar(false);
      setCamionEnEdicion(null);
      await cargarDatos(true);
    } catch (err) {
      alert('Error al actualizar vehículo: ' + err.message);
    } finally {
      setGuardandoEditar(false);
    }
  };

  const handleEliminarCamion = async (id, placa) => {
    if (!confirm(`¿Desea enviar a mantenimiento o dar de baja el camión con placa "${placa}"?`)) {
      return;
    }
    try {
      await proveedorService.eliminarCamion(id);
      await cargarDatos(true);
    } catch (err) {
      alert('Error al cambiar estado del vehículo: ' + err.message);
    }
  };

  const copiarCredenciales = (camion) => {
    const texto = `PRISMA Logistics - Credenciales de Reparto (Camión ${camion.placa})\nUsuario: ${camion.usuarioApp || camion.repartidorEmail}\nPIN / Clave: 123456\n(Inicia sesión en el terminal móvil del vehículo para recibir la hoja de ruta)`;
    navigator.clipboard.writeText(texto);
    setCopiadoId(camion.id);
    setTimeout(() => setCopiadoId(null), 2500);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-prisma-text-primary flex items-center gap-2">
            <Truck className="w-7 h-7 text-prisma-teal" />
            Flota de Camiones y Cuentas de Entrega
          </h1>
          <p className="text-xs text-prisma-text-secondary mt-1">
            Cada vehículo cuenta con su propio usuario móvil. Los conductores de turno usan la cuenta del camión asignado sin crear cuentas individuales.
          </p>
        </div>

        <button
          onClick={() => setModalCrear(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-prisma-teal hover:bg-prisma-teal-dark text-white rounded-xl text-xs font-semibold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>+ Registrar Nuevo Camión</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Resumen Operativo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-prisma-border shadow-sm flex items-center gap-4">
          <div className="p-3 bg-prisma-teal/10 text-prisma-teal rounded-xl">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-prisma-text-secondary">Total Vehículos</p>
            <p className="text-xl font-bold text-prisma-text-primary">{camiones.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-prisma-border shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-prisma-text-secondary">Cuentas Móviles Habilitadas</p>
            <p className="text-xl font-bold text-prisma-text-primary">{camiones.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-prisma-border shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-prisma-text-secondary">En Bodega (Disponibles)</p>
            <p className="text-xl font-bold text-prisma-text-primary">
              {camiones.filter(c => c.estado === 'DISPONIBLE').length}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-prisma-border shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-prisma-text-secondary">En Ruta Activa</p>
            <p className="text-xl font-bold text-prisma-text-primary">
              {camiones.filter(c => c.estado === 'EN_RUTA').length}
            </p>
          </div>
        </div>
      </div>

      {/* Nota Explicativa para el Usuario */}
      <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 flex items-start gap-3.5 text-xs text-emerald-900">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-emerald-950">1 Camión = 1 Cuenta de Reparto</p>
          <p className="text-emerald-800 mt-0.5 leading-relaxed">
            No necesitas crear cuentas personales por cada chofer. Cada camión tiene sus credenciales únicas de acceso a la app móvil. Cuando llegue un chofer nuevo o haya cambio de turno, simplemente le entregas el celular con la cuenta del camión para que despache sus pedidos sin conflictos.
          </p>
        </div>
      </div>

      {/* Listado de Camiones */}
      <div className="bg-white rounded-2xl border border-prisma-border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-prisma-border flex justify-between items-center">
          <h2 className="text-sm font-bold text-prisma-text-primary">Vehículos y Terminales de Reparto</h2>
          <span className="text-xs font-semibold text-prisma-text-secondary">{camiones.length} Vehículos</span>
        </div>

        {cargando ? (
          <div className="p-12 text-center text-xs text-prisma-text-secondary">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-prisma-teal" />
            Cargando vehículos y cuentas...
          </div>
        ) : camiones.length === 0 ? (
          <div className="p-12 text-center text-xs text-prisma-text-secondary space-y-2">
            <Truck className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="font-bold text-prisma-text-primary text-sm">No hay vehículos registrados en la flota</p>
            <p>Registra el primer camión para activar su cuenta de reparto en la app móvil.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-prisma-surface text-prisma-text-secondary border-b border-prisma-border uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4">Placa</th>
                  <th className="p-4">Marca y Modelo</th>
                  <th className="p-4">Acceso a App Celular (Conductor de Turno)</th>
                  <th className="p-4">Capacidad Carga</th>
                  <th className="p-4">Canastas</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-prisma-border">
                {camiones.map((c) => {
                  const usuarioCuenta = c.usuarioApp || c.repartidorEmail || `camion.${c.placa.toLowerCase()}@distribucion.prisma.com`;
                  const esCopiado = copiadoId === c.id;

                  return (
                    <tr key={c.id} className="hover:bg-gray-50/50 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-gray-100 rounded-lg text-gray-700">
                            <Truck className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-mono font-bold text-sm text-prisma-text-primary block">{c.placa}</span>
                            <span className="text-[10px] text-gray-400">Terminal #{c.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-prisma-text-primary font-medium">
                        {c.marcaModelo}
                      </td>

                      <td className="p-4">
                        <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 inline-block space-y-1">
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="font-mono text-[11px] font-semibold text-gray-800">{usuarioCuenta}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3 text-[10px] text-gray-500 pt-0.5 border-t border-gray-200/60">
                            <span className="flex items-center gap-1 font-mono">
                              <Key className="w-3 h-3 text-gray-400" />
                              PIN: ******
                            </span>
                            <button
                              onClick={() => copiarCredenciales(c)}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition ${
                                esCopiado 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : 'bg-white hover:bg-gray-100 text-prisma-teal border border-gray-200'
                              }`}
                              title="Copiar credenciales de acceso para entregárselas al conductor del día"
                            >
                              {esCopiado ? <CheckCheck className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              <span>{esCopiado ? '¡Copiado!' : 'Copiar Acceso'}</span>
                            </button>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-prisma-text-secondary font-medium">
                        {c.capacidadPesoKg} kg
                      </td>

                      <td className="p-4 text-prisma-text-secondary font-medium">
                        {c.capacidadCanastas} canastas
                      </td>

                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          c.estado === 'DISPONIBLE' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : c.estado === 'EN_RUTA'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {c.estado === 'DISPONIBLE' ? 'En Bodega' : c.estado === 'EN_RUTA' ? 'En Ruta' : 'Mantenimiento'}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleAbrirEditar(c)}
                            className="p-1.5 text-gray-500 hover:text-prisma-teal hover:bg-gray-100 rounded-lg transition"
                            title="Editar datos del vehículo o cambiar PIN de acceso móvil"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEliminarCamion(c.id, c.placa)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Enviar a mantenimiento / Dar de baja"
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

      {/* MODAL 1: REGISTRAR CAMIÓN */}
      {modalCrear && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-prisma-border animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-prisma-border mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-50 rounded-xl text-prisma-teal">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-prisma-text-primary">Registrar Vehículo</h3>
                  <p className="text-xs text-prisma-text-secondary">Crea el camión y su cuenta móvil de entrega</p>
                </div>
              </div>
              <button
                onClick={() => setModalCrear(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearCamion} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-prisma-text-secondary mb-1">
                  Placa del Vehículo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: ABC-123"
                  value={nuevoCamion.placa}
                  onChange={(e) => setNuevoCamion({ ...nuevoCamion, placa: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2 uppercase font-mono bg-gray-50 border border-prisma-border rounded-xl focus:outline-none focus:ring-2 focus:ring-prisma-teal/20 focus:border-prisma-teal"
                />
              </div>

              <div>
                <label className="block font-semibold text-prisma-text-secondary mb-1">
                  Marca y Modelo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Chevrolet NPR 2023"
                  value={nuevoCamion.marcaModelo}
                  onChange={(e) => setNuevoCamion({ ...nuevoCamion, marcaModelo: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-prisma-border rounded-xl focus:outline-none focus:ring-2 focus:ring-prisma-teal/20 focus:border-prisma-teal"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-prisma-text-secondary mb-1">
                    Capacidad (kg)
                  </label>
                  <input
                    type="number"
                    required
                    min="100"
                    value={nuevoCamion.capacidadPesoKg}
                    onChange={(e) => setNuevoCamion({ ...nuevoCamion, capacidadPesoKg: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-prisma-border rounded-xl focus:outline-none focus:ring-2 focus:ring-prisma-teal/20 focus:border-prisma-teal"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-prisma-text-secondary mb-1">
                    Canastas
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={nuevoCamion.capacidadCanastas}
                    onChange={(e) => setNuevoCamion({ ...nuevoCamion, capacidadCanastas: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-prisma-border rounded-xl focus:outline-none focus:ring-2 focus:ring-prisma-teal/20 focus:border-prisma-teal"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-bold">
                  <Key className="w-4 h-4 text-emerald-600" />
                  <span>PIN de Acceso a la App Móvil</span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Ej: 123456"
                  value={nuevoCamion.pin}
                  onChange={(e) => setNuevoCamion({ ...nuevoCamion, pin: e.target.value })}
                  className="w-full px-3.5 py-2 font-mono bg-white border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <p className="text-[11px] text-emerald-800 leading-tight">
                  Se generará la cuenta: <strong className="font-mono">camion.{nuevoCamion.placa ? nuevoCamion.placa.toLowerCase() : 'placa'}@distribucion.prisma.com</strong>. Quien conduzca este camión usará esta clave para entrar al celular.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-prisma-border mt-5">
                <button
                  type="button"
                  onClick={() => setModalCrear(false)}
                  className="px-4 py-2 text-sm text-prisma-text-secondary hover:text-prisma-text-primary rounded-xl font-medium transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoCrear}
                  className="px-5 py-2 bg-prisma-teal text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {guardandoCrear ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Guardar Vehículo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDITAR CAMIÓN */}
      {modalEditar && camionEnEdicion && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-prisma-border animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-prisma-border mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-50 rounded-xl text-prisma-teal">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-prisma-text-primary">Editar Vehículo</h3>
                  <p className="text-xs text-prisma-text-secondary font-mono">{camionEnEdicion.placa}</p>
                </div>
              </div>
              <button
                onClick={() => { setModalEditar(false); setCamionEnEdicion(null); }}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarEdicion} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-prisma-text-secondary mb-1">
                  Marca y Modelo
                </label>
                <input
                  type="text"
                  required
                  value={camionEnEdicion.marcaModelo}
                  onChange={(e) => setCamionEnEdicion({ ...camionEnEdicion, marcaModelo: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-prisma-border rounded-xl focus:outline-none focus:ring-2 focus:ring-prisma-teal/20 focus:border-prisma-teal"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-prisma-text-secondary mb-1">
                    Capacidad (kg)
                  </label>
                  <input
                    type="number"
                    required
                    min="100"
                    value={camionEnEdicion.capacidadPesoKg}
                    onChange={(e) => setCamionEnEdicion({ ...camionEnEdicion, capacidadPesoKg: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-prisma-border rounded-xl focus:outline-none focus:ring-2 focus:ring-prisma-teal/20 focus:border-prisma-teal"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-prisma-text-secondary mb-1">
                    Canastas
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={camionEnEdicion.capacidadCanastas}
                    onChange={(e) => setCamionEnEdicion({ ...camionEnEdicion, capacidadCanastas: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-prisma-border rounded-xl focus:outline-none focus:ring-2 focus:ring-prisma-teal/20 focus:border-prisma-teal"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-prisma-text-secondary mb-1">
                  Estado Operativo
                </label>
                <select
                  value={camionEnEdicion.estado}
                  onChange={(e) => setCamionEnEdicion({ ...camionEnEdicion, estado: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-prisma-border rounded-xl focus:outline-none focus:ring-2 focus:ring-prisma-teal/20 focus:border-prisma-teal font-semibold"
                >
                  <option value="DISPONIBLE">DISPONIBLE (En Bodega)</option>
                  <option value="EN_RUTA">EN RUTA (Despachado)</option>
                  <option value="MANTENIMIENTO">MANTENIMIENTO (Inactivo)</option>
                </select>
              </div>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5">
                <label className="block font-semibold text-gray-700">
                  Actualizar PIN / Clave Móvil (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Dejar en blanco para mantener actual"
                  value={camionEnEdicion.pin}
                  onChange={(e) => setCamionEnEdicion({ ...camionEnEdicion, pin: e.target.value })}
                  className="w-full px-3.5 py-2 font-mono bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-prisma-teal/20 focus:border-prisma-teal"
                />
                <p className="text-[10px] text-gray-500">
                  Si cambias el PIN, el conductor deberá usar esta nueva clave en el celular del camión.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-prisma-border mt-5">
                <button
                  type="button"
                  onClick={() => { setModalEditar(false); setCamionEnEdicion(null); }}
                  className="px-4 py-2 text-sm text-prisma-text-secondary hover:text-prisma-text-primary rounded-xl font-medium transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoEditar}
                  className="px-5 py-2 bg-prisma-teal text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition shadow-sm disabled:opacity-50 flex items-center gap-2"
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
