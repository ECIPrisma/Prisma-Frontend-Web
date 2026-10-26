import React, { useState, useEffect } from 'react';
import { proveedorService } from '../../services/api';
import { 
  MessageSquareWarning, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  RefreshCw, 
  AlertCircle, 
  Store, 
  Package, 
  User, 
  Phone, 
  MapPin, 
  Send, 
  X, 
  Check, 
  ShieldCheck, 
  Calendar,
  MessageCircle,
  HelpCircle,
  Plus,
  Building2,
  Inbox,
  SendHorizontal
} from 'lucide-react';

export const PqrsProveedorPage = () => {
  const [pqrs, setPqrs] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  
  // Pestaña principal: 'TENDEROS' (Recibidos de tiendas) o 'A_PRISMA' (Radicados a Prisma Admin)
  const [seccionActiva, setSeccionActiva] = useState('TENDEROS');
  const [filtroEstado, setFiltroEstado] = useState('TODAS');

  // Modal Responder al Tendero
  const [modalResponder, setModalResponder] = useState(null);
  const [resolucionTexto, setResolucionTexto] = useState('');
  const [nuevoEstado, setNuevoEstado] = useState('RESUELTO');
  const [guardando, setGuardando] = useState(false);

  // Modal Radicar Disputa / Reclamo a Prisma
  const [modalRadicarPrisma, setModalRadicarPrisma] = useState(false);
  const [tipoIncidentePrisma, setTipoIncidentePrisma] = useState('DISPUTA_COMISION_PRISMA');
  const [descripcionPrisma, setDescripcionPrisma] = useState('');
  const [pedidoIdPrisma, setPedidoIdPrisma] = useState('');
  const [radicando, setRadicando] = useState(false);

  const cargarPqrs = async (silencioso = false) => {
    try {
      if (!silencioso && pqrs.length === 0) setCargando(true);
      const data = await proveedorService.getMisPqrs();
      setPqrs(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      if (!silencioso && pqrs.length === 0) {
        setError(err.message || 'Error al consultar las PQRS y reclamos');
      }
    } finally {
      if (!silencioso && pqrs.length === 0) setCargando(false);
    }
  };

  useEffect(() => {
    cargarPqrs();
    const interval = setInterval(() => {
      cargarPqrs(true);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleAbrirModalResponder = (ticket) => {
    setModalResponder(ticket);
    setResolucionTexto(ticket.resolucionJustificacion || 'Se coordinará reposición de producto en el próximo despacho.');
    setNuevoEstado('RESUELTO');
  };

  const handleGuardarRespuesta = async (e) => {
    e.preventDefault();
    if (!modalResponder) return;
    try {
      setGuardando(true);
      await proveedorService.responderPqrs(modalResponder.id, resolucionTexto, nuevoEstado);
      setModalResponder(null);
      await cargarPqrs(true);
    } catch (err) {
      alert('Error al responder reclamo: ' + (err.message || err));
    } finally {
      setGuardando(false);
    }
  };

  const handleRadicarAPrisma = async (e) => {
    e.preventDefault();
    if (!descripcionPrisma.trim()) {
      alert('Por favor describe el motivo de tu reclamo o disputa para el Administrador Prisma.');
      return;
    }
    try {
      setRadicando(true);
      await proveedorService.radicarDisputaPrisma(
        tipoIncidentePrisma, 
        descripcionPrisma, 
        pedidoIdPrisma || null
      );
      alert('¡Reclamo radicado exitosamente ante el Administrador Prisma!');
      setModalRadicarPrisma(false);
      setDescripcionPrisma('');
      setPedidoIdPrisma('');
      setSeccionActiva('A_PRISMA');
      await cargarPqrs(true);
    } catch (err) {
      alert('Error al radicar reclamo a Prisma: ' + (err.message || err));
    } finally {
      setRadicando(false);
    }
  };

  const getTipoLabel = (tipo) => {
    switch (tipo) {
      case 'MERCANCIA_DANADA_O_FALTANTE':
        return { label: 'Mercancía Averiada o Faltante', color: 'bg-rose-100 text-rose-800 border-rose-200' };
      case 'PIN_NO_DISPONIBLE_CELULAR_APAGADO':
        return { label: 'Inconveniente con PIN / Celular', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'TIENDA_CERRADA':
        return { label: 'Tienda Cerrada en Entrega', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'DINERO_INCOMPLETO':
        return { label: 'Diferencia en Cobro / Efectivo', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'CAMION_VARADO_ACCIDENTE':
        return { label: 'Demora por Percance en Vía', color: 'bg-orange-100 text-orange-800 border-orange-200' };
      case 'DISPUTA_COMISION_PRISMA':
        return { label: 'Discrepancia en Comisiones Prisma', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      case 'SOPORTE_TECNICO_PLATAFORMA':
        return { label: 'Soporte Técnico / Falla Plataforma', color: 'bg-teal-100 text-teal-800 border-teal-200' };
      case 'RECLAMO_TENDERO_IRREGULAR':
        return { label: 'Reporte de Tienda Irregular', color: 'bg-red-100 text-red-800 border-red-200' };
      case 'SOLICITUD_AJUSTE_RUTA':
        return { label: 'Solicitud de Ajuste Logístico', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      default:
        return { label: 'Petición / Aclaración General', color: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
  };

  // Separación por origen
  const pqrsDeTenderos = pqrs.filter(p => p.origen !== 'PROVEEDOR_A_PRISMA');
  const disputasHaciaPrisma = pqrs.filter(p => p.origen === 'PROVEEDOR_A_PRISMA');

  const listaActual = seccionActiva === 'TENDEROS' ? pqrsDeTenderos : disputasHaciaPrisma;

  const totalTickets = listaActual.length;
  const abiertos = listaActual.filter(p => p.estado === 'ABIERTO').length;
  const enGestion = listaActual.filter(p => p.estado === 'EN_GESTION').length;
  const resueltos = listaActual.filter(p => p.estado === 'RESUELTO').length;

  const pqrsFiltradas = listaActual.filter(p => {
    if (filtroEstado === 'TODAS') return true;
    return p.estado === filtroEstado;
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-prisma-text-primary flex items-center gap-2">
            <MessageSquareWarning className="w-7 h-7 text-amber-600" />
            Centro de PQRS, Reclamos y Disputas
          </h1>
          <p className="text-xs text-prisma-text-secondary mt-1">
            Atiende las quejas presentadas por tus tiendas clientes o radica reclamos directos ante el Administrador de Prisma.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setModalRadicarPrisma(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Radicar Reclamo a Prisma Admin</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Selector de Sección Principal: Reclamos de Tiendas vs Disputas a Prisma */}
      <div className="flex border-b border-prisma-border bg-white rounded-2xl p-1.5 shadow-sm">
        <button
          onClick={() => { setSeccionActiva('TENDEROS'); setFiltroEstado('TODAS'); }}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            seccionActiva === 'TENDEROS'
              ? 'bg-prisma-teal text-white shadow-sm'
              : 'text-prisma-text-secondary hover:text-prisma-text-primary hover:bg-gray-50'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Reclamos de Mis Tiendas ({pqrsDeTenderos.length})</span>
        </button>

        <button
          onClick={() => { setSeccionActiva('A_PRISMA'); setFiltroEstado('TODAS'); }}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            seccionActiva === 'A_PRISMA'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-prisma-text-secondary hover:text-prisma-text-primary hover:bg-gray-50'
          }`}
        >
          <SendHorizontal className="w-4 h-4" />
          <span>Mis Disputas Radicadas a Prisma Admin ({disputasHaciaPrisma.length})</span>
        </button>
      </div>

      {/* KPI Cards de la Sección Activa */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-prisma-border shadow-sm flex items-center gap-4">
          <div className="p-3 bg-gray-100 text-gray-700 rounded-xl">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-prisma-text-secondary">Total Tickets</p>
            <h3 className="text-2xl font-bold text-prisma-text-primary mt-0.5">{totalTickets}</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {seccionActiva === 'TENDEROS' ? 'Quejas de tiendas' : 'Casos ante Prisma'}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-prisma-border shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-prisma-text-secondary">Abiertos (Pendientes)</p>
            <h3 className="text-2xl font-bold text-rose-600 mt-0.5">{abiertos}</h3>
            <p className="text-[10px] text-rose-500 mt-0.5 font-medium">Requieren resolución</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-prisma-border shadow-sm flex items-center gap-4">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-prisma-text-secondary">En Trámite</p>
            <h3 className="text-2xl font-bold text-sky-700 mt-0.5">{enGestion}</h3>
            <p className="text-[10px] text-sky-600 mt-0.5 font-medium">En proceso de atención</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-prisma-border shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-prisma-text-secondary">Solucionados</p>
            <h3 className="text-2xl font-bold text-emerald-700 mt-0.5">{resueltos}</h3>
            <p className="text-[10px] text-emerald-600 mt-0.5 font-medium">Casos resueltos</p>
          </div>
        </div>
      </div>

      {/* Filtros de Estado */}
      <div className="flex flex-wrap items-center gap-2">
        {['TODAS', 'ABIERTO', 'EN_GESTION', 'RESUELTO'].map((f) => (
          <button
            key={f}
            onClick={() => setFiltroEstado(f)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              filtroEstado === f
                ? seccionActiva === 'TENDEROS' ? 'bg-prisma-teal text-white shadow-sm' : 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white border border-prisma-border text-prisma-text-secondary hover:bg-gray-50'
            }`}
          >
            {f === 'TODAS' ? 'Todos los Estados' : f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Listado de Casos */}
      {cargando ? (
        <div className="p-12 text-center text-xs text-prisma-text-secondary bg-white rounded-2xl border border-prisma-border">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-prisma-teal" />
          Cargando tickets...
        </div>
      ) : pqrsFiltradas.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-prisma-border space-y-3">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
          <p className="text-sm font-bold text-prisma-text-primary">
            {seccionActiva === 'TENDEROS' 
              ? 'No hay reclamos de tiendas con este filtro' 
              : 'No tienes disputas radicadas a Prisma con este filtro'}
          </p>
          <p className="text-xs text-prisma-text-secondary">
            {seccionActiva === 'TENDEROS'
              ? 'Las solicitudes y novedades de los tenderos aparecerán aquí automáticamente.'
              : 'Si necesitas soporte o tienes una queja con la plataforma, pulsa el botón "Radicar Reclamo a Prisma Admin".'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pqrsFiltradas.map((ticket) => {
            const tipoInfo = getTipoLabel(ticket.tipoIncidente);
            const esAbierto = ticket.estado === 'ABIERTO';
            const esResuelto = ticket.estado === 'RESUELTO';
            const esMioHaciaPrisma = ticket.origen === 'PROVEEDOR_A_PRISMA';

            return (
              <div
                key={ticket.id}
                className="bg-white rounded-2xl border border-prisma-border p-6 shadow-sm hover:shadow-md transition space-y-4"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className={`font-mono font-bold text-xs px-3 py-1 rounded-xl ${
                      esMioHaciaPrisma ? 'bg-indigo-100 text-indigo-800' : 'bg-prisma-teal/10 text-prisma-teal'
                    }`}>
                      #{ticket.ticketNumero}
                    </span>
                    <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border ${tipoInfo.color}`}>
                      {tipoInfo.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      esAbierto 
                        ? 'bg-rose-100 text-rose-800' 
                        : esResuelto 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-sky-100 text-sky-800'
                    }`}>
                      {ticket.estado === 'ABIERTO' ? 'Pendiente' : ticket.estado}
                    </span>
                    <span className="text-xs text-gray-400">
                      {ticket.fechaReporte ? new Date(ticket.fechaReporte).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Reciente'}
                    </span>
                  </div>
                </div>

                {/* Si es de Tendero: muestra Tienda y Pedido */}
                {!esMioHaciaPrisma ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 bg-gray-50/70 rounded-xl space-y-1.5 border border-gray-100">
                      <div className="flex items-center gap-2 text-prisma-text-primary font-bold">
                        <Store className="w-4 h-4 text-prisma-teal" />
                        <span>{ticket.nombreTienda || 'Tienda de Barrio'}</span>
                      </div>
                      <p className="text-gray-500 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span>Tendero: {ticket.nombreTendero || ticket.reportadoPorNombre || 'Cliente'}</span>
                      </p>
                      <p className="text-gray-500 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span>Tel: {ticket.telefonoTienda || ticket.reportadoPorTelefono || '3205551234'}</span>
                      </p>
                      <p className="text-gray-500 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span>{ticket.direccionTienda || 'Bogotá, D.C.'}</span>
                      </p>
                    </div>

                    <div className="p-3.5 bg-gray-50/70 rounded-xl space-y-1.5 border border-gray-100 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-prisma-text-primary font-bold">
                          <Package className="w-4 h-4 text-blue-600" />
                          <span>Pedido Asociado #{ticket.numeroPedido || ticket.pedidoId || 'N/A'}</span>
                        </div>
                        <p className="text-gray-500 mt-1">
                          Monto del Pedido: <strong>${Number(ticket.totalPedido || 0).toLocaleString('es-CO')}</strong>
                        </p>
                      </div>

                      <div className="pt-2 border-t border-gray-200/60 flex justify-between items-center text-[11px] text-gray-400">
                        <span>Estado entrega: {ticket.estadoPedido || 'ENTREGADO'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Si es radicado a Prisma */
                  <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-900 font-bold">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      <span>Destinatario: Mesa de Resolución y Soporte de Plataforma Prisma</span>
                    </div>
                    {ticket.pedidoId && (
                      <span className="font-mono text-indigo-700 bg-white px-2 py-0.5 rounded-lg border border-indigo-200">
                        Pedido #{ticket.numeroPedido || ticket.pedidoId}
                      </span>
                    )}
                  </div>
                )}

                {/* Detalle del Reclamo */}
                <div className="p-4 bg-amber-50/50 border border-amber-200/80 rounded-xl space-y-1">
                  <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                    <MessageSquareWarning className="w-3.5 h-3.5" />
                    <span>{esMioHaciaPrisma ? 'Motivo Radicado por el Productor:' : 'Descripción del Reclamo / Petición del Tendero:'}</span>
                  </p>
                  <p className="text-xs text-amber-950 italic">
                    "{ticket.descripcion}"
                  </p>
                </div>

                {/* Respuesta / Resolución si existe */}
                {ticket.resolucionJustificacion && (
                  <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-1 text-xs">
                    <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{esMioHaciaPrisma ? 'Respuesta y Resolución del Admin Prisma:' : 'Solución Brindada por el Productor:'}</span>
                    </p>
                    <p className="text-emerald-950 font-medium">
                      {ticket.resolucionJustificacion}
                    </p>
                    {ticket.fechaResolucion && (
                      <p className="text-[10px] text-emerald-600 mt-1">
                        Fecha de resolución: {new Date(ticket.fechaResolucion).toLocaleString('es-CO')}
                      </p>
                    )}
                  </div>
                )}

                {/* Botón de Acción solo si es reclamo de tendero hacia mí */}
                {!esMioHaciaPrisma && (
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => handleAbrirModalResponder(ticket)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                        esResuelto
                          ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          : 'bg-prisma-teal hover:bg-prisma-teal/90 text-white'
                      }`}
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{esResuelto ? 'Actualizar Solución' : 'Responder / Resolver Reclamo'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: RESPONDER AL TENDERO */}
      {modalResponder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in duration-200">
            <div className="flex justify-between items-start border-b border-prisma-border pb-3">
              <div>
                <h3 className="font-bold text-base text-prisma-text-primary flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-prisma-teal" />
                  Atender Reclamo #{modalResponder.ticketNumero}
                </h3>
                <p className="text-xs text-prisma-text-secondary mt-0.5">
                  Tienda: <strong>{modalResponder.nombreTienda}</strong>
                </p>
              </div>
              <button onClick={() => setModalResponder(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarRespuesta} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-prisma-text-primary mb-2">
                  Selecciona una Solución Rápida con 1 Clic:
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    'Se enviará reposición de producto en el próximo viaje de reparto.',
                    'Se emite saldo a favor para descontar en la siguiente factura.',
                    'Novedad aclarada con el conductor. Entrega completada a conformidad.',
                    'Ajuste en horario de reparto programado a primera hora.',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setResolucionTexto(preset)}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        resolucionTexto === preset
                          ? 'border-prisma-teal bg-teal-50 text-teal-900 font-bold'
                          : 'border-prisma-border bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-prisma-text-primary mb-1">
                  Respuesta o Justificación para el Tendero:
                </label>
                <textarea
                  rows={3}
                  value={resolucionTexto}
                  onChange={(e) => setResolucionTexto(e.target.value)}
                  className="w-full p-2.5 border border-prisma-border rounded-xl focus:ring-2 focus:ring-prisma-teal focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-prisma-text-primary mb-1">
                  Estado tras la atención:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNuevoEstado('RESUELTO')}
                    className={`p-2 rounded-xl border font-bold text-center transition ${
                      nuevoEstado === 'RESUELTO'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-prisma-border bg-white text-gray-600'
                    }`}
                  >
                    Marcar como Resuelto
                  </button>
                  <button
                    type="button"
                    onClick={() => setNuevoEstado('EN_GESTION')}
                    className={`p-2 rounded-xl border font-bold text-center transition ${
                      nuevoEstado === 'EN_GESTION'
                        ? 'border-sky-600 bg-sky-50 text-sky-800'
                        : 'border-prisma-border bg-white text-gray-600'
                    }`}
                  >
                    Dejar En Gestión
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-prisma-border">
                <button
                  type="button"
                  onClick={() => setModalResponder(null)}
                  className="px-4 py-2 border border-prisma-border rounded-xl font-semibold hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2 bg-prisma-teal hover:bg-prisma-teal-dark text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {guardando ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Guardar y Notificar Solución</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RADICAR RECLAMO / DISPUTA A PRISMA ADMIN (REQUERIMIENTO DEL USUARIO) */}
      {modalRadicarPrisma && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in duration-200">
            <div className="flex justify-between items-start border-b border-prisma-border pb-3">
              <div>
                <h3 className="font-bold text-base text-indigo-900 flex items-center gap-2">
                  <SendHorizontal className="w-5 h-5 text-indigo-600" />
                  Radicar Reclamo / Disputa a Prisma Admin
                </h3>
                <p className="text-xs text-prisma-text-secondary mt-0.5">
                  Abre un ticket formal ante el equipo directivo y de soporte de Prisma.
                </p>
              </div>
              <button onClick={() => setModalRadicarPrisma(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRadicarAPrisma} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-prisma-text-primary mb-2">
                  Tipo de Reclamo o Disputa:
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'DISPUTA_COMISION_PRISMA', label: 'Discrepancia en Comisiones o Cartera (2.5%)', desc: 'Revisión del valor facturado o saldo de comisiones' },
                    { id: 'SOPORTE_TECNICO_PLATAFORMA', label: 'Falla Técnica en la Plataforma', desc: 'Error en la sincronización, catálogo o app móvil' },
                    { id: 'RECLAMO_TENDERO_IRREGULAR', label: 'Reporte de Tienda Irregular o Cartera Vencida', desc: 'Tendero con comportamiento indebido o fraude' },
                    { id: 'SOLICITUD_AJUSTE_RUTA', label: 'Solicitud de Asistencia o Ajuste Logístico', desc: 'Reasignación de despachos o auxilio en ruta' },
                    { id: 'OTRO_INCIDENTE', label: 'Otra Petición Administrativa', desc: 'Consulta legal, contractual o comercial' },
                  ].map((opcion) => (
                    <button
                      key={opcion.id}
                      type="button"
                      onClick={() => setTipoIncidentePrisma(opcion.id)}
                      className={`p-3 rounded-xl border text-left transition ${
                        tipoIncidentePrisma === opcion.id
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold'
                          : 'border-prisma-border bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <p className="text-xs font-bold">{opcion.label}</p>
                      <p className="text-[10px] text-gray-500 font-normal mt-0.5">{opcion.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-prisma-text-primary mb-1">
                  ID de Pedido Afectado (Opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ej: 1 o PED-101 (dejar vacío si es reclamo general)"
                  value={pedidoIdPrisma}
                  onChange={(e) => setPedidoIdPrisma(e.target.value)}
                  className="w-full p-2.5 border border-prisma-border rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-prisma-text-primary mb-1">
                  Explicación Detallada del Reclamo *:
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe con claridad los hechos, fechas y el ajuste o solución requerida por parte de Prisma..."
                  value={descripcionPrisma}
                  onChange={(e) => setDescripcionPrisma(e.target.value)}
                  className="w-full p-2.5 border border-prisma-border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-prisma-border">
                <button
                  type="button"
                  onClick={() => setModalRadicarPrisma(false)}
                  className="px-4 py-2 border border-prisma-border rounded-xl font-semibold hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={radicando}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50 transition"
                >
                  {radicando ? <RefreshCw className="w-4 h-4 animate-spin" /> : <SendHorizontal className="w-4 h-4" />}
                  <span>Radicar Ticket a Prisma</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
