import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { 
  ShoppingBag, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  MapPin, 
  X, 
  Calendar, 
  ShieldAlert, 
  HelpCircle,
  Truck,
  RotateCcw
} from 'lucide-react';

export const PedidosSoportePage = () => {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');

  // Modales de Intervención de Soporte
  const [modalCancelar, setModalCancelar] = useState(null); // pedido
  const [motivoCancelacion, setMotivoCancelacion] = useState('Error en despacho o tienda inaccesible');
  
  const [modalReprogramar, setModalReprogramar] = useState(null); // pedido
  const [fechaReprogramada, setFechaReprogramada] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [motivoReprogramacion, setMotivoReprogramacion] = useState('Tienda cerrada en primer intento');

  const [modalPinOverride, setModalPinOverride] = useState(null); // pedido
  const [justificacionPin, setJustificacionPin] = useState('Entrega física verificada con el tendero sin conectividad móvil');

  const [procesando, setProcesando] = useState(false);

  const [segundosSync, setSegundosSync] = useState(0);

  const cargarPedidos = async (silencioso = false) => {
    try {
      if (!silencioso && pedidos.length === 0) setCargando(true);
      const data = await adminService.getPedidos();
      setPedidos(Array.isArray(data) ? data : []);
      setError(null);
      setSegundosSync(0);
    } catch (err) {
      if (!silencioso && pedidos.length === 0) {
        setError(err.message || 'Error al consultar los pedidos de la red');
      }
    } finally {
      if (!silencioso && pedidos.length === 0) setCargando(false);
    }
  };

  useEffect(() => {
    cargarPedidos();
    const interval = setInterval(() => {
      cargarPedidos(true);
    }, 4000);
    const timer = setInterval(() => {
      setSegundosSync(s => s + 1);
    }, 1000);
    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, []);

  const handleCancelarPorSoporte = async (e) => {
    e.preventDefault();
    if (!modalCancelar) return;
    try {
      setProcesando(true);
      await adminService.soporteCancelarPedido(modalCancelar.id, motivoCancelacion);
      setModalCancelar(null);
      await cargarPedidos();
    } catch (err) {
      alert('Error al cancelar pedido: ' + err.message);
    } finally {
      setProcesando(false);
    }
  };

  const handleReprogramar = async (e) => {
    e.preventDefault();
    if (!modalReprogramar) return;
    try {
      setProcesando(true);
      await adminService.reprogramarPedido(modalReprogramar.id, fechaReprogramada, motivoReprogramacion);
      setModalReprogramar(null);
      await cargarPedidos();
    } catch (err) {
      alert('Error al reprogramar pedido: ' + err.message);
    } finally {
      setProcesando(false);
    }
  };

  const handleOverridePin = async (e) => {
    e.preventDefault();
    if (!modalPinOverride) return;
    try {
      setProcesando(true);
      await adminService.overridePin(modalPinOverride.id, justificacionPin);
      setModalPinOverride(null);
      await cargarPedidos();
    } catch (err) {
      alert('Error en PIN Override: ' + err.message);
    } finally {
      setProcesando(false);
    }
  };

  const pedidosFiltrados = pedidos.filter(p => {
    const coincideEstado = filtroEstado === 'TODOS' || p.estado === filtroEstado;
    const num = p.numeroPedido ? p.numeroPedido.toLowerCase() : `ped-${p.id}`;
    const tienda = p.tienda?.nombreTienda ? p.tienda.nombreTienda.toLowerCase() : '';
    const prov = p.proveedor?.nombreComercial ? p.proveedor.nombreComercial.toLowerCase() : '';
    const q = busqueda.toLowerCase();

    return coincideEstado && (num.includes(q) || tienda.includes(q) || prov.includes(q));
  });

  const getBadgeEstado = (estado) => {
    switch (estado) {
      case 'CREADO':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">Creado</span>;
      case 'ACEPTADO':
      case 'EN_PREPARACION':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">En Preparación</span>;
      case 'EN_RUTA':
      case 'DESPACHADO':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800">En Ruta</span>;
      case 'ENTREGADO':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">Entregado</span>;
      case 'RECHAZADO':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">Rechazado en Tienda</span>;
      case 'CANCELADO':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-800">Cancelado</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-800">{estado}</span>;
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-prisma-text-primary flex items-center gap-2">
            <HelpCircle className="w-7 h-7 text-prisma-teal" />
            Soporte de Pedidos
          </h1>
          <p className="text-xs text-prisma-text-secondary mt-1">
            Ayuda operativa cuando una entrega no puede completarse o requiere reprogramación.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Buscador y Filtros */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-prisma-border shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por #pedido, tienda o distribuidor..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-prisma-border rounded-xl focus:ring-2 focus:ring-prisma-teal focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {['TODOS', 'EN_RUTA', 'CREADO', 'RECHAZADO', 'CANCELADO', 'ENTREGADO'].map((e) => (
            <button
              key={e}
              onClick={() => setFiltroEstado(e)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filtroEstado === e
                  ? 'bg-prisma-teal text-white shadow-sm'
                  : 'bg-prisma-surface text-prisma-text-secondary hover:bg-gray-100'
              }`}
            >
              {e === 'TODOS' ? 'Todos' : e.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Pedidos */}
      <div className="bg-white rounded-2xl border border-prisma-border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-prisma-border flex justify-between items-center">
          <h2 className="text-sm font-bold text-prisma-text-primary">Pedidos Monitoreados en la Red</h2>
          <span className="text-xs font-semibold text-prisma-text-secondary">{pedidosFiltrados.length} Pedidos</span>
        </div>

        {cargando ? (
          <div className="p-12 text-center text-xs text-prisma-text-secondary">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-prisma-teal" />
            Consultando pedidos en tiempo real...
          </div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="p-12 text-center text-xs text-prisma-text-secondary space-y-2">
            <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="font-bold text-prisma-text-primary text-sm">No se encontraron pedidos</p>
            <p>Los pedidos realizados por las tiendas aparecerán aquí para monitoreo y soporte.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-prisma-surface text-prisma-text-secondary border-b border-prisma-border uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4">Pedido / Fecha</th>
                  <th className="p-4">Tienda de Barrio</th>
                  <th className="p-4">Distribuidor</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4">Notas / Incidencias</th>
                  <th className="p-4 text-right">Acciones de Soporte</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-prisma-border">
                {pedidosFiltrados.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="p-4">
                      <p className="font-mono font-bold text-prisma-teal">{p.numeroPedido || `PED-${p.id}`}</p>
                      <p className="text-[10px] text-gray-400">Entrega: {p.fechaEstimadaEntrega || 'Hoy'}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-prisma-text-primary">{p.tienda?.nombreTienda || 'Tienda'}</p>
                      <p className="text-[10px] text-gray-400">{p.tienda?.direccion || 'Bogotá'}</p>
                    </td>
                    <td className="p-4 font-medium text-prisma-text-primary">
                      {p.proveedor?.nombreComercial || 'Distribuidora'}
                    </td>
                    <td className="p-4 font-bold text-prisma-text-primary">
                      ${Number(p.totalAPagar || 0).toLocaleString('es-CO')}
                    </td>
                    <td className="p-4">{getBadgeEstado(p.estado)}</td>
                    <td className="p-4 text-prisma-text-secondary max-w-xs truncate">
                      {p.notasEntrega || <span className="text-gray-300 italic">Sin novedades</span>}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Botón Reprogramar */}
                        {p.estado !== 'ENTREGADO' && p.estado !== 'CANCELADO' && (
                          <button
                            onClick={() => setModalReprogramar(p)}
                            className="px-2.5 py-1 text-[11px] font-bold border border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100 rounded-lg transition"
                            title="Reprogramar fecha de entrega"
                          >
                            Reprogramar
                          </button>
                        )}

                        {/* Botón Cancelar Pedido por Soporte */}
                        {p.estado !== 'ENTREGADO' && p.estado !== 'CANCELADO' && (
                          <button
                            onClick={() => setModalCancelar(p)}
                            className="px-2.5 py-1 text-[11px] font-bold border border-red-200 text-red-700 bg-red-50/50 hover:bg-red-100 rounded-lg transition"
                            title="Cancelar pedido por imposibilidad de entrega"
                          >
                            Cancelar
                          </button>
                        )}

                        {/* Botón PIN Override si está en ruta */}
                        {p.estado === 'EN_RUTA' && (
                          <button
                            onClick={() => setModalPinOverride(p)}
                            className="px-2.5 py-1 text-[11px] font-bold border border-amber-200 text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg transition flex items-center gap-1"
                            title="Autorizar entrega forzada de emergencia"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Override</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Cancelar Pedido */}
      {modalCancelar && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-prisma-border shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-prisma-border pb-3">
              <h3 className="font-bold text-sm text-red-600 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Cancelar Pedido por Soporte ({modalCancelar.numeroPedido})
              </h3>
              <button onClick={() => setModalCancelar(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCancelarPorSoporte} className="space-y-3 text-xs">
              <p className="text-prisma-text-secondary">
                Esta acción marcará el pedido como <strong>CANCELADO</strong> en la red y registrará la justificación en la auditoría inmutable de PRISMA.
              </p>

              <div>
                <label className="block font-bold text-prisma-text-primary mb-1">Motivo de la Cancelación</label>
                <select
                  value={motivoCancelacion}
                  onChange={(e) => setMotivoCancelacion(e.target.value)}
                  className="w-full p-2.5 border border-prisma-border rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none bg-white mb-2"
                >
                  <option value="Tienda inaccesible o cerrada">Tienda inaccesible o cerrada</option>
                  <option value="Sin stock disponible en bodega del distribuidor">Sin stock disponible en bodega</option>
                  <option value="Tendero no cuenta con el dinero completo">Tendero sin dinero completo</option>
                  <option value="Camión de reparto varado o accidentado">Camión varado / accidente</option>
                  <option value="Mercancía averiada durante el transporte">Mercancía averiada / dañada</option>
                  <option value="Cancelación solicitada por ambas partes">Cancelación solicitada por ambas partes</option>
                </select>
              </div>

              <div className="pt-3 border-t border-prisma-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalCancelar(null)}
                  className="px-4 py-2 border border-prisma-border text-prisma-text-secondary rounded-xl hover:bg-gray-50"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={procesando}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {procesando ? 'Cancelando...' : 'Confirmar Cancelación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reprogramar Pedido */}
      {modalReprogramar && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-prisma-border shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-prisma-border pb-3">
              <h3 className="font-bold text-sm text-blue-600 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Reprogramar Entrega ({modalReprogramar.numeroPedido})
              </h3>
              <button onClick={() => setModalReprogramar(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReprogramar} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-prisma-text-primary mb-1">Nueva Fecha Estimada de Entrega</label>
                <input
                  type="date"
                  required
                  value={fechaReprogramada}
                  onChange={(e) => setFechaReprogramada(e.target.value)}
                  className="w-full p-2.5 border border-prisma-border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-prisma-text-primary mb-1">Motivo de Reprogramación</label>
                <input
                  type="text"
                  required
                  value={motivoReprogramacion}
                  onChange={(e) => setMotivoReprogramacion(e.target.value)}
                  placeholder="Ej. Tienda cerrada en primer intento, se reintenta mañana"
                  className="w-full p-2.5 border border-prisma-border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-prisma-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalReprogramar(null)}
                  className="px-4 py-2 border border-prisma-border text-prisma-text-secondary rounded-xl hover:bg-gray-50"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={procesando}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {procesando ? 'Reprogramando...' : 'Guardar Nueva Fecha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal PIN Override */}
      {modalPinOverride && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-prisma-border shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-prisma-border pb-3">
              <h3 className="font-bold text-sm text-amber-600 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" />
                Entrega de Emergencia / Override PIN ({modalPinOverride.numeroPedido})
              </h3>
              <button onClick={() => setModalPinOverride(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOverridePin} className="space-y-3 text-xs">
              <p className="text-prisma-text-secondary">
                Autoriza la entrega del pedido sin validación de PIN en caso de falla de señal de la tienda. Esta acción requiere justificación auditada.
              </p>

              <div>
                <label className="block font-bold text-prisma-text-primary mb-1">Justificación Obligatoria ($\ge$ 10 caracteres)</label>
                <textarea
                  required
                  rows="3"
                  value={justificacionPin}
                  onChange={(e) => setJustificacionPin(e.target.value)}
                  className="w-full p-2.5 border border-prisma-border rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-prisma-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalPinOverride(null)}
                  className="px-4 py-2 border border-prisma-border text-prisma-text-secondary rounded-xl hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={procesando}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {procesando ? 'Autorizando...' : 'Autorizar Entrega'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
