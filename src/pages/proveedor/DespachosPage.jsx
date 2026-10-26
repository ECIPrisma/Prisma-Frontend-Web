import React, { useState, useEffect } from 'react';
import { proveedorService } from '../../services/api';
import { 
  Truck, 
  Package, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  ChevronRight, 
  MapPin,
  AlertTriangle,
  Calendar,
  X,
  FileText,
  Navigation,
  DollarSign,
  TrendingUp,
  User,
  ShieldCheck,
  Pause,
  Play
} from 'lucide-react';

export const DespachosPage = () => {
  const [pedidos, setPedidos] = useState([]);
  const [rutas, setRutas] = useState([]);
  const [pestañaActiva, setPestañaActiva] = useState('rutas'); // 'rutas' o 'pedidos'
  const [filtro, setFiltro] = useState('TODOS');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [actualizandoId, setActualizandoId] = useState(null);

  // Auto-refresco en vivo
  const [autoSync, setAutoSync] = useState(true);
  const [segundosSync, setSegundosSync] = useState(0);

  // Estados de Modales de Incidencia / Reprogramación
  const [modalProblema, setModalProblema] = useState(null); // pedido
  const [motivoProblema, setMotivoProblema] = useState('TIENDA_CERRADA');
  const [detalleProblema, setDetalleProblema] = useState('Tienda cerrada al momento de la llegada del camión.');
  const [accionProblema, setAccionProblema] = useState('REPROGRAMAR');

  const [modalReprogramar, setModalReprogramar] = useState(null); // pedido
  const [nuevaFecha, setNuevaFecha] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [motivoReprogramar, setMotivoReprogramar] = useState('Ajuste de itinerario de reparto');

  const [procesandoAccion, setProcesandoAccion] = useState(false);

  // Estados de Rastreo de Ruta y Auxilio / Varado
  const [modalUbicacionRuta, setModalUbicacionRuta] = useState(null);
  const [modalVarado, setModalVarado] = useState(null);
  const [motivoVarado, setMotivoVarado] = useState('Falla mecánica del motor');
  const [detalleVarado, setDetalleVarado] = useState('');

  const cargarDatos = async (silencioso = false) => {
    try {
      if (!silencioso && pedidos.length === 0 && rutas.length === 0) setCargando(true);
      setError(null);
      const [pedidosData, rutasData] = await Promise.allSettled([
        proveedorService.getPedidosNuevos(),
        proveedorService.getRutasProgreso()
      ]);

      if (pedidosData.status === 'fulfilled') {
        setPedidos(Array.isArray(pedidosData.value) ? pedidosData.value : []);
      }
      if (rutasData.status === 'fulfilled') {
        setRutas(Array.isArray(rutasData.value) ? rutasData.value : []);
      }
      setSegundosSync(0);
    } catch (err) {
      if (!silencioso && pedidos.length === 0 && rutas.length === 0) {
        setError(err.message || 'Error al conectar con el servicio de despachos y rutas');
      }
    } finally {
      if (!silencioso && pedidos.length === 0 && rutas.length === 0) setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Polling automático continuo cada 4s
  useEffect(() => {
    if (!autoSync) return;
    const interval = setInterval(() => {
      cargarDatos(true);
    }, 4000);

    const timer = setInterval(() => {
      setSegundosSync(s => s + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, [autoSync]);

  const handleCambiarEstado = async (pedidoId, nuevoEstado) => {
    try {
      setActualizandoId(pedidoId);
      await proveedorService.cambiarEstadoPedido(pedidoId, nuevoEstado);
      await cargarDatos(true);
    } catch (err) {
      alert('Error al actualizar estado del pedido: ' + err.message);
    } finally {
      setActualizandoId(null);
    }
  };

  const handleReportarProblema = async (e) => {
    e.preventDefault();
    if (!modalProblema) return;
    try {
      setProcesandoAccion(true);
      await proveedorService.reportarProblemaPedido(
        modalProblema.id,
        motivoProblema,
        detalleProblema || 'Sin detalle adicional',
        accionProblema
      );
      setModalProblema(null);
      await cargarDatos(true);
    } catch (err) {
      alert('Error al reportar problema: ' + err.message);
    } finally {
      setProcesandoAccion(false);
    }
  };

  const handleReprogramar = async (e) => {
    e.preventDefault();
    if (!modalReprogramar) return;
    try {
      setProcesandoAccion(true);
      await proveedorService.reprogramarPedido(
        modalReprogramar.id,
        nuevaFecha,
        motivoReprogramar
      );
      setModalReprogramar(null);
      await cargarDatos(true);
    } catch (err) {
      alert('Error al reprogramar pedido: ' + err.message);
    } finally {
      setProcesandoAccion(false);
    }
  };

  const handleReportarVarado = async (rutaId, accion, motivo) => {
    try {
      setProcesandoAccion(true);
      await proveedorService.reportarVarado(rutaId, accion, motivo);
      setModalVarado(null);
      await cargarDatos(true);
    } catch (err) {
      alert('Error al gestionar auxilio de ruta: ' + (err.message || err));
    } finally {
      setProcesandoAccion(false);
    }
  };

  const pedidosFiltrados = pedidos.filter(p => {
    if (filtro === 'TODOS') return true;
    return p.estado === filtro;
  });

  const getBadgeEstado = (estado) => {
    switch (estado) {
      case 'CREADO':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">Recibido (Pendiente)</span>;
      case 'ACEPTADO':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800">En Cola de Ruta</span>;
      case 'EN_PREPARACION':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">En Bodega / Alistamiento</span>;
      case 'DESPACHADO':
      case 'EN_RUTA':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800">En Camión / En Reparto</span>;
      case 'ENTREGADO':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">Entregado con PIN</span>;
      case 'RECHAZADO':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800">Rechazado</span>;
      case 'CANCELADO':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-800">Cancelado</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-800">{estado}</span>;
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Principal */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-prisma-text-primary flex items-center gap-2">
            <Truck className="w-7 h-7 text-prisma-teal" />
            Despachos y Entregas
          </h1>
          <p className="text-xs text-prisma-text-secondary mt-1">
            Sigue las rutas de los camiones y el estado de entrega en las tiendas de barrio.
          </p>
        </div>
      </div>

      {/* Pestañas de Vista */}
      <div className="flex border-b border-prisma-border gap-4">
        <button
          onClick={() => setPestañaActiva('rutas')}
          className={`pb-3 px-1 text-sm font-bold border-b-2 flex items-center gap-2 transition ${
            pestañaActiva === 'rutas'
              ? 'border-prisma-teal text-prisma-teal'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Navigation className="w-4 h-4" />
          <span>Rutas de Hoy ({rutas.length})</span>
        </button>

        <button
          onClick={() => setPestañaActiva('pedidos')}
          className={`pb-3 px-1 text-sm font-bold border-b-2 flex items-center gap-2 transition ${
            pestañaActiva === 'pedidos'
              ? 'border-prisma-teal text-prisma-teal'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Lista de Pedidos ({pedidos.length})</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. PESTAÑA: MONITOREO POR RUTAS Y CAMIONES EN VIVO */}
      {pestañaActiva === 'rutas' && (
        <div className="space-y-6">
          {cargando ? (
            <div className="p-12 text-center text-xs text-prisma-text-secondary bg-white rounded-2xl border border-prisma-border">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-prisma-teal" />
              Sincronizando estado de las rutas y camiones...
            </div>
          ) : rutas.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-prisma-border space-y-3">
              <Truck className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="text-sm font-bold text-prisma-text-primary">No hay rutas activas planificadas para hoy</p>
              <p className="text-xs text-prisma-text-secondary">Las rutas aparecerán automáticamente cuando se asignen camiones a los pedidos.</p>
            </div>
          ) : (
            rutas.map((ruta) => (
              <div 
                key={ruta.rutaId}
                className="bg-white rounded-3xl border border-prisma-border shadow-sm p-6 space-y-6"
              >
                {/* Cabecera de la Ruta */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-prisma-border/60 pb-5">
                  <div className="flex items-start gap-4">
                    <div className="p-3.5 bg-prisma-teal/10 text-prisma-teal rounded-2xl">
                      <Truck className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-prisma-text-primary">{ruta.codigoRuta}</h2>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          ruta.estado === 'VARADO_EN_PERCANCE'
                            ? 'bg-rose-100 text-rose-800 animate-pulse'
                            : ruta.estado === 'EN_EJECUCION'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {ruta.estado === 'VARADO_EN_PERCANCE' ? 'Camión en Auxilio Mecánico' : ruta.estado === 'EN_EJECUCION' ? 'En Ruta Activa' : ruta.estado}
                        </span>
                      </div>
                      <p className="text-xs text-prisma-text-secondary flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 font-semibold text-prisma-text-primary">
                          <MapPin className="w-3.5 h-3.5 text-prisma-teal" />
                          {ruta.zonaSector}
                        </span>
                        <span>•</span>
                        <span>Camión: <strong>{ruta.placaCamion}</strong> ({ruta.modeloCamion})</span>
                        <span>•</span>
                        <span>Conductor: <strong>{ruta.nombreRepartidor}</strong></span>
                      </p>
                    </div>
                  </div>

                  {/* Acciones y Resumen de Recaudo */}
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setModalUbicacionRuta(ruta)}
                      className="px-3.5 py-2 bg-prisma-teal/10 hover:bg-prisma-teal/20 text-prisma-teal border border-prisma-teal/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                    >
                      <MapPin className="w-4 h-4 text-prisma-teal" />
                      <span>Ver Ubicación en Mapa</span>
                    </button>

                    {ruta.estado !== 'VARADO_EN_PERCANCE' && ruta.estado !== 'FINALIZADA' && ruta.estado !== 'CANCELADA' && (
                      <button
                        onClick={() => {
                          setModalVarado(ruta);
                          setMotivoVarado('Falla mecánica del motor');
                          setDetalleVarado('Camión detenido por avería');
                        }}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span>Reportar Varado</span>
                      </button>
                    )}

                    <div className="flex gap-4 items-center bg-prisma-surface p-2.5 rounded-2xl border border-prisma-border text-xs">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase">Recaudado:</p>
                        <p className="font-bold text-emerald-600 text-sm">
                          ${Number(ruta.recaudoEfectivoCobrado || 0).toLocaleString('es-CO')}
                        </p>
                      </div>
                      <div className="h-7 w-px bg-gray-200"></div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase">Total Esperado:</p>
                        <p className="font-bold text-prisma-teal text-sm">
                          ${Number(ruta.recaudoTotalEsperado || 0).toLocaleString('es-CO')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* BANNER DE ALERTA SI EL VEHÍCULO ESTÁ VARADO */}
                {ruta.estado === 'VARADO_EN_PERCANCE' && (
                  <div className="bg-gradient-to-r from-rose-50 to-orange-50 border-2 border-rose-300 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-rose-900 shadow-sm animate-in fade-in duration-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-rose-200 text-rose-800 rounded-xl animate-bounce flex-shrink-0">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-rose-800">CAMIÓN EN AUXILIO MECÁNICO / ASISTENCIA VIAL</p>
                        <p className="text-xs text-rose-700 mt-0.5">
                          {ruta.motivoPercance || 'Falla mecánica del vehículo en trayecto'}. La entrega de paradas restantes se encuentra detenida.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleReportarVarado(ruta.rutaId, 'REANUDAR', 'Falla mecánica resuelta')}
                      disabled={procesandoAccion}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 flex-shrink-0 disabled:opacity-50"
                    >
                      {procesandoAccion ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      <span>Reanudar Ruta (Auxilio Prestado)</span>
                    </button>
                  </div>
                )}

                {/* BARRA DE PROGRESO DE LA RUTA (REQUERIMIENTO DEL USUARIO) */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-prisma-text-primary flex items-center gap-2">
                      <span>Progreso del Itinerario:</span>
                      <span className="text-prisma-teal">{ruta.paradasCompletadas} de {ruta.totalParadas} paradas entregadas</span>
                    </span>
                    <span className="font-black text-sm text-prisma-teal">{ruta.porcentajeProgreso}%</span>
                  </div>

                  <div className="w-full h-3.5 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-200">
                    <div
                      className="h-full bg-gradient-to-r from-prisma-teal to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(ruta.porcentajeProgreso, 5)}%` }}
                    ></div>
                  </div>
                </div>

                {/* SECUENCIA VISUAL DE PARADAS (TIMELINE INTERACTIVO) */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-prisma-text-secondary uppercase tracking-wider">
                    Secuencia de Paradas Asignadas
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {ruta.paradas?.map((parada) => {
                      const esEntregado = parada.estado === 'ENTREGADO';
                      const esEnProceso = parada.estado === 'EN_RUTA' || parada.estado === 'DESPACHADO';

                      return (
                        <div
                          key={parada.pedidoId}
                          className={`rounded-2xl p-4 border transition flex flex-col justify-between space-y-3 ${
                            esEntregado
                              ? 'bg-emerald-50/50 border-emerald-200'
                              : esEnProceso
                                ? 'bg-purple-50/50 border-purple-300 ring-2 ring-purple-400/20 shadow-sm'
                                : 'bg-white border-prisma-border'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                esEntregado
                                  ? 'bg-emerald-200 text-emerald-800'
                                  : esEnProceso
                                    ? 'bg-purple-200 text-purple-800 animate-pulse'
                                    : 'bg-gray-100 text-gray-700'
                              }`}>
                                Parada #{parada.ordenParada} {esEnProceso ? '· En Atención Ahora' : ''}
                              </span>
                              {getBadgeEstado(parada.estado)}
                            </div>

                            <div>
                              <h4 className="font-bold text-xs text-prisma-text-primary line-clamp-1">
                                {parada.nombreTienda}
                              </h4>
                              <p className="text-[11px] text-prisma-text-secondary flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{parada.direccion}</span>
                              </p>
                            </div>

                            {parada.notas && (
                              <p className="text-[10px] italic text-amber-700 bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                                {parada.notas}
                              </p>
                            )}
                          </div>

                          <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-xs">
                            <span className="font-bold text-prisma-teal">
                              ${Number(parada.totalAPagar || 0).toLocaleString('es-CO')}
                            </span>

                            {!esEntregado && parada.estado !== 'CANCELADO' && (
                              <button
                                onClick={() => {
                                  const pedidoCompleto = pedidos.find(p => p.id === parada.pedidoId) || { id: parada.pedidoId, ...parada };
                                  setModalProblema(pedidoCompleto);
                                  setMotivoProblema('TIENDA_CERRADA');
                                  setDetalleProblema('Tienda cerrada al momento de la llegada del camión.');
                                  setAccionProblema('REPROGRAMAR');
                                }}
                                className="px-2 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                              >
                                <AlertTriangle className="w-3 h-3" />
                                <span>Incidencia</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 2. PESTAÑA: GESTIÓN DE TODOS LOS PEDIDOS */}
      {pestañaActiva === 'pedidos' && (
        <div className="space-y-6">
          {/* Filtros de Estado */}
          <div className="flex flex-wrap gap-2">
            {['TODOS', 'CREADO', 'ACEPTADO', 'EN_PREPARACION', 'DESPACHADO', 'ENTREGADO', 'CANCELADO'].map((e) => (
              <button
                key={e}
                onClick={() => setFiltro(e)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  filtro === e
                    ? 'bg-prisma-teal text-white shadow-sm'
                    : 'bg-white border border-prisma-border text-prisma-text-secondary hover:bg-gray-50'
                }`}
              >
                {e === 'TODOS' ? 'Todos los Pedidos' : e.replace('_', ' ')}
              </button>
            ))}
          </div>

          {cargando ? (
            <div className="p-12 text-center text-xs text-prisma-text-secondary bg-white rounded-2xl border border-prisma-border">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-prisma-teal" />
              Cargando pedidos entrantes...
            </div>
          ) : pedidosFiltrados.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-prisma-border space-y-3">
              <Package className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="text-sm font-bold text-prisma-text-primary">No hay pedidos con el filtro seleccionado</p>
              <p className="text-xs text-prisma-text-secondary">Los pedidos enviados por los tenderos aparecerán aquí automáticamente.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pedidosFiltrados.map((pedido) => {
                const puedeIntervenir = pedido.estado !== 'ENTREGADO' && pedido.estado !== 'CANCELADO' && pedido.estado !== 'RECHAZADO';

                return (
                  <div
                    key={pedido.id}
                    className="bg-white rounded-2xl border border-prisma-border shadow-sm p-5 space-y-4 flex flex-col justify-between hover:shadow-md transition"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[11px] font-mono text-gray-400">#{pedido.numeroPedido || `PED-${pedido.id}`}</span>
                          <h3 className="font-bold text-sm text-prisma-text-primary">
                            {pedido.tienda ? pedido.tienda.nombreTienda : 'Tienda Asociada'}
                          </h3>
                        </div>
                        {getBadgeEstado(pedido.estado)}
                      </div>

                      <div className="text-xs text-prisma-text-secondary space-y-1">
                        <p className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          <span>{pedido.tienda?.direccion || 'Bogotá, D.C.'}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span>Entrega Estimada: {pedido.fechaEstimadaEntrega || 'Hoy'}</span>
                        </p>
                      </div>

                      {pedido.notasEntrega && (
                        <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 space-y-0.5">
                          <p className="font-bold flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" />
                            Novedad Registrada:
                          </p>
                          <p className="italic">{pedido.notasEntrega}</p>
                        </div>
                      )}

                      <div className="p-3 bg-prisma-surface rounded-xl border border-prisma-border/60 flex justify-between items-center">
                        <span className="text-xs text-prisma-text-secondary">Total a Cobrar:</span>
                        <span className="text-sm font-bold text-prisma-teal">
                          ${Number(pedido.totalAPagar || 0).toLocaleString('es-CO')}
                        </span>
                      </div>
                    </div>

                    {/* Acciones de Flujo de Fulfillment */}
                    <div className="pt-2 border-t border-prisma-border/60 space-y-2">
                      {(pedido.estado === 'CREADO' || pedido.estado === 'ACEPTADO') && (
                        <button
                          onClick={() => handleCambiarEstado(pedido.id, 'EN_PREPARACION')}
                          disabled={actualizandoId === pedido.id}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <span>Aceptar y Preparar en Bodega</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}

                      {pedido.estado === 'EN_PREPARACION' && (
                        <button
                          onClick={() => handleCambiarEstado(pedido.id, 'DESPACHADO')}
                          disabled={actualizandoId === pedido.id}
                          className="w-full py-2 bg-prisma-teal hover:bg-prisma-teal-dark text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <Truck className="w-4 h-4" />
                          <span>Despachar a Camión / En Ruta</span>
                        </button>
                      )}

                      {pedido.estado === 'DESPACHADO' && (
                        <div className="w-full py-2 bg-purple-50 text-purple-700 text-center rounded-xl text-xs font-bold border border-purple-200">
                          En Reparto · Esperando Validación PIN del Tendero
                        </div>
                      )}

                      {pedido.estado === 'ENTREGADO' && (
                        <div className="w-full py-2 bg-emerald-50 text-emerald-700 text-center rounded-xl text-xs font-bold border border-emerald-200 flex items-center justify-center gap-1.5">
                          <CheckCircle className="w-4 h-4" />
                          <span>Entrega Completada</span>
                        </div>
                      )}

                      {puedeIntervenir && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={() => {
                              setModalReprogramar(pedido);
                              setMotivoReprogramar('Ajuste de itinerario');
                            }}
                            className="py-1.5 px-2 bg-white border border-prisma-border hover:bg-gray-50 text-prisma-text-secondary rounded-lg text-[11px] font-semibold transition flex items-center justify-center gap-1"
                          >
                            <Calendar className="w-3.5 h-3.5 text-blue-600" />
                            <span>Reprogramar</span>
                          </button>

                          <button
                            onClick={() => {
                              setModalProblema(pedido);
                              setMotivoProblema('TIENDA_CERRADA');
                              setDetalleProblema('Tienda cerrada al momento de la llegada del camión.');
                              setAccionProblema('REPROGRAMAR');
                            }}
                            className="py-1.5 px-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-semibold transition flex items-center justify-center gap-1"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            <span>No se pudo entregar</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL SIMPLIFICADO A 1 CLIC: REPORTE DE INCIDENCIA */}
      {modalProblema && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in duration-200">
            <div className="flex justify-between items-start border-b border-prisma-border pb-3">
              <div>
                <h3 className="font-bold text-base text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  No se pudo entregar pedido
                </h3>
                <p className="text-xs text-prisma-text-secondary mt-0.5">
                  Pedido #{modalProblema.numeroPedido || modalProblema.id}
                </p>
              </div>
              <button onClick={() => setModalProblema(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReportarProblema} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-prisma-text-primary mb-2">
                  Selecciona el motivo con 1 clic:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'TIENDA_CERRADA', label: 'Tienda Cerrada / Ausente', desc: 'No hay quien reciba' },
                    { id: 'DINERO_INCOMPLETO', label: 'Efectivo Incompleto', desc: 'No cuenta con el pago' },
                    { id: 'MERCANCIA_DANADA', label: 'Mercancía Averiada', desc: 'Botellas rotas en ruta' },
                    { id: 'CAMION_VARADO', label: 'Camión Varado', desc: 'Falla mecánica del vehículo' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setMotivoProblema(item.id);
                        setDetalleProblema(`${item.label}: ${item.desc}`);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        motivoProblema === item.id
                          ? 'border-rose-500 bg-rose-50 text-rose-800'
                          : 'border-prisma-border bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <p className="font-bold text-[11px]">{item.label}</p>
                      <p className="text-[10px] text-gray-500">{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-prisma-text-primary mb-1">
                  Acción a ejecutar:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAccionProblema('REPROGRAMAR')}
                    className={`p-2 rounded-xl border text-center font-bold transition ${
                      accionProblema === 'REPROGRAMAR'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-prisma-border bg-white text-gray-600'
                    }`}
                  >
                    Reprogramar para Mañana
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccionProblema('CANCELAR')}
                    className={`p-2 rounded-xl border text-center font-bold transition ${
                      accionProblema === 'CANCELAR'
                        ? 'border-rose-600 bg-rose-50 text-rose-700'
                        : 'border-prisma-border bg-white text-gray-600'
                    }`}
                  >
                    Cancelar Pedido
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-prisma-text-primary mb-1">
                  Nota / Detalle:
                </label>
                <input
                  type="text"
                  value={detalleProblema}
                  onChange={(e) => setDetalleProblema(e.target.value)}
                  className="w-full p-2.5 border border-prisma-border rounded-xl text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-prisma-border">
                <button
                  type="button"
                  onClick={() => setModalProblema(null)}
                  className="px-4 py-2 border border-prisma-border rounded-xl font-semibold hover:bg-gray-50"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={procesandoAccion}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {procesandoAccion ? <RefreshCw className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                  <span>Registrar Novedad</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REPROGRAMAR FECHA */}
      {modalReprogramar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in duration-200">
            <div className="flex justify-between items-start border-b border-prisma-border pb-3">
              <div>
                <h3 className="font-bold text-base text-prisma-text-primary flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Reprogramar Fecha de Entrega
                </h3>
                <p className="text-xs text-prisma-text-secondary mt-0.5">
                  Pedido #{modalReprogramar.numeroPedido || modalReprogramar.id}
                </p>
              </div>
              <button onClick={() => setModalReprogramar(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReprogramar} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-prisma-text-primary mb-1">
                  Nueva Fecha de Entrega:
                </label>
                <input
                  type="date"
                  value={nuevaFecha}
                  onChange={(e) => setNuevaFecha(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-2.5 border border-prisma-border rounded-xl focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-prisma-text-primary mb-1">
                  Motivo:
                </label>
                <input
                  type="text"
                  value={motivoReprogramar}
                  onChange={(e) => setMotivoReprogramar(e.target.value)}
                  className="w-full p-2.5 border border-prisma-border rounded-xl focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-prisma-border">
                <button
                  type="button"
                  onClick={() => setModalReprogramar(null)}
                  className="px-4 py-2 border border-prisma-border rounded-xl font-semibold hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={procesandoAccion}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {procesandoAccion ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                  <span>Guardar Fecha</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL: VER DÓNDE ESTÁ EL CAMIÓN (RUTA PREDEFINIDA PASO A PASO) */}
      {modalUbicacionRuta && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl animate-in fade-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-prisma-border pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-prisma-teal/10 text-prisma-teal rounded-2xl">
                  <Navigation className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-prisma-text-primary flex items-center gap-2">
                    Ubicación GPS en Vivo: {modalUbicacionRuta.placaCamion}
                  </h3>
                  <p className="text-xs text-prisma-text-secondary mt-0.5 flex items-center gap-2">
                    <span>{modalUbicacionRuta.codigoRuta}</span>
                    <span>•</span>
                    <span>Conductor: <strong>{modalUbicacionRuta.nombreRepartidor}</strong></span>
                    <span>•</span>
                    <span>Sector: <strong>{modalUbicacionRuta.zonaSector}</strong></span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setModalUbicacionRuta(null)} 
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Alerta de Varado si Aplica */}
            {modalUbicacionRuta.estado === 'VARADO_EN_PERCANCE' && (
              <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl flex items-center justify-between gap-3 text-rose-800 text-xs">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 animate-pulse" />
                  <span><strong>Vehículo Varado:</strong> {modalUbicacionRuta.motivoPercance || 'Falla mecánica en trayecto'}.</span>
                </div>
                <button
                  onClick={() => {
                    handleReportarVarado(modalUbicacionRuta.rutaId, 'REANUDAR', 'Falla resuelta');
                    setModalUbicacionRuta(null);
                  }}
                  className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition"
                >
                  Reanudar
                </button>
              </div>
            )}

            {/* Tarjetas de Resumen de Progreso */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3">
                <p className="text-[10px] font-bold text-emerald-700 uppercase">Entregadas</p>
                <p className="text-lg font-black text-emerald-800">{modalUbicacionRuta.paradasCompletadas}</p>
                <p className="text-[10px] text-emerald-600">tiendas entregadas</p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3">
                <p className="text-[10px] font-bold text-purple-700 uppercase">En Atención</p>
                <p className="text-lg font-black text-purple-800">1</p>
                <p className="text-[10px] text-purple-600">punto actual</p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3">
                <p className="text-[10px] font-bold text-gray-500 uppercase">Pendientes</p>
                <p className="text-lg font-black text-gray-700">
                  {Math.max(0, modalUbicacionRuta.totalParadas - modalUbicacionRuta.paradasCompletadas - 1)}
                </p>
                <p className="text-[10px] text-gray-400">tiendas pendientes</p>
              </div>
            </div>

            {/* Timeline Secuencial de la Ruta Predefinida */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-prisma-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-prisma-teal" />
                <span>Ruta Predefinida Paso a Paso</span>
              </h4>

              <div className="space-y-3 pl-2">
                {modalUbicacionRuta.paradas?.map((parada, index) => {
                  const esEntregado = parada.estado === 'ENTREGADO';
                  const esEnProceso = parada.estado === 'EN_RUTA' || parada.estado === 'DESPACHADO';
                  const esUltimo = index === modalUbicacionRuta.paradas.length - 1;

                  return (
                    <div key={parada.pedidoId} className="flex items-start gap-4 relative">
                      {/* Línea conectora */}
                      {!esUltimo && (
                        <div 
                          className={`absolute left-4 top-8 w-0.5 h-full -ml-[1px] ${
                            esEntregado ? 'bg-emerald-300' : esEnProceso ? 'bg-purple-300' : 'bg-gray-200'
                          }`}
                        />
                      )}

                      {/* Icono del nodo */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 shadow-sm ${
                        esEntregado 
                          ? 'bg-emerald-500 text-white' 
                          : esEnProceso 
                            ? 'bg-purple-600 text-white animate-bounce' 
                            : 'bg-gray-100 text-gray-400 border border-gray-300'
                      }`}>
                        {esEntregado ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : esEnProceso ? (
                          <Truck className="w-4 h-4" />
                        ) : (
                          <span className="text-xs font-bold">{parada.ordenParada}</span>
                        )}
                      </div>

                      {/* Contenido de la parada */}
                      <div className={`flex-1 p-3.5 rounded-2xl border transition ${
                        esEntregado
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : esEnProceso
                            ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-400/30'
                            : 'bg-white border-prisma-border'
                      }`}>
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-prisma-text-primary">
                                Parada #{parada.ordenParada}: {parada.nombreTienda}
                              </span>
                            </div>
                            <p className="text-[11px] text-prisma-text-secondary flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                              <span>{parada.direccion}</span>
                            </p>
                          </div>

                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            esEntregado
                              ? 'bg-emerald-100 text-emerald-800'
                              : esEnProceso
                                ? 'bg-purple-200 text-purple-900 animate-pulse'
                                : 'bg-gray-100 text-gray-600'
                          }`}>
                            {esEntregado ? 'Completado' : esEnProceso ? 'En Atención' : 'Pendiente'}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-xs mt-2 pt-2 border-t border-gray-100">
                          <span className="text-[11px] text-gray-500">Monto del pedido:</span>
                          <span className="font-bold text-prisma-teal">
                            ${Number(parada.totalAPagar || 0).toLocaleString('es-CO')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-prisma-border">
              <button
                type="button"
                onClick={() => setModalUbicacionRuta(null)}
                className="px-5 py-2.5 bg-prisma-teal hover:bg-prisma-teal/90 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                Cerrar Mapa de Ruta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REPORTAR CAMIÓN VARADO */}
      {modalVarado && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in duration-200">
            <div className="flex justify-between items-start border-b border-prisma-border pb-3">
              <div>
                <h3 className="font-bold text-base text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Reportar Camión Varado / Percance
                </h3>
                <p className="text-xs text-prisma-text-secondary mt-0.5">
                  Camión: <strong>{modalVarado.placaCamion}</strong> • Conductor: <strong>{modalVarado.nombreRepartidor}</strong>
                </p>
              </div>
              <button onClick={() => setModalVarado(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-prisma-text-primary mb-2">
                  Tipo de Percance Mecánico:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'Falla mecánica del motor', label: 'Falla Motor' },
                    { id: 'Pinchazo en la vía', label: 'Pinchazo de Llanta' },
                    { id: 'Falla eléctrica o batería', label: 'Falla Eléctrica' },
                    { id: 'Accidente o choque menor', label: 'Accidente Menor' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setMotivoVarado(item.id)}
                      className={`p-2.5 rounded-xl border text-center font-bold transition ${
                        motivoVarado === item.id
                          ? 'border-rose-500 bg-rose-50 text-rose-800'
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
                  Detalles adicionales de la falla o ubicación:
                </label>
                <input
                  type="text"
                  value={detalleVarado}
                  onChange={(e) => setDetalleVarado(e.target.value)}
                  placeholder="Ej: Se apagó cerca a la estación, solicitamos grúa o mecánico"
                  className="w-full p-2.5 border border-prisma-border rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-prisma-border">
                <button
                  type="button"
                  onClick={() => setModalVarado(null)}
                  className="px-4 py-2 border border-prisma-border rounded-xl font-semibold hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={procesandoAccion}
                  onClick={() => handleReportarVarado(modalVarado.rutaId, 'VARADO', `${motivoVarado}: ${detalleVarado || 'Sin observaciones'}`)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {procesandoAccion ? <RefreshCw className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                  <span>Activar Alerta de Varado</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
