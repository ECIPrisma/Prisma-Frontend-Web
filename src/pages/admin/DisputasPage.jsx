import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { 
  AlertTriangle, 
  CheckCircle, 
  ShieldAlert, 
  X, 
  RefreshCw, 
  AlertCircle, 
  Building2, 
  Store, 
  MessageCircle, 
  Send,
  Check
} from 'lucide-react';

export const DisputasPage = () => {
  const [disputas, setDisputas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorApi, setErrorApi] = useState('');
  
  // Modal Override PIN (para emergencias de entrega)
  const [selectedCase, setSelectedCase] = useState(null);
  const [justificacion, setJustificacion] = useState('');
  const [accionEnCurso, setAccionEnCurso] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Modal Responder / Dictar Resolución Admin
  const [modalResolucion, setModalResolucion] = useState(null);
  const [resolucionTexto, setResolucionTexto] = useState('');
  const [nuevoEstado, setNuevoEstado] = useState('RESUELTO');
  const [guardandoResolucion, setGuardandoResolucion] = useState(false);

  const cargarDisputas = async (silencioso = false) => {
    if (!silencioso && disputas.length === 0) setCargando(true);
    try {
      const data = await adminService.getDisputas();
      setDisputas(Array.isArray(data) ? data : []);
      setErrorApi('');
    } catch (err) {
      if (!silencioso && disputas.length === 0) {
        setErrorApi(err.message || 'No se pudo conectar con el servicio');
      }
    } finally {
      if (!silencioso && disputas.length === 0) setCargando(false);
    }
  };

  useEffect(() => {
    cargarDisputas();
    const interval = setInterval(() => {
      cargarDisputas(true);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleOverride = async (e) => {
    e.preventDefault();
    if (justificacion.trim().length < 15) {
      alert('La justificación obligatoria debe tener al menos 15 caracteres según la política de auditoría forense.');
      return;
    }

    setAccionEnCurso(true);
    setErrorApi('');

    try {
      const pedidoId = selectedCase.pedido?.id || selectedCase.id;
      await adminService.overridePin(pedidoId, justificacion);

      setSuccessMsg(`¡Entrega forzada autorizada exitosamente para el ticket ${selectedCase.ticketNumero}! Rastro inmutable registrado.`);
      setSelectedCase(null);
      setJustificacion('');
      cargarDisputas();
      setTimeout(() => setSuccessMsg(''), 6000);
    } catch (err) {
      setErrorApi(err.message || 'Error al ejecutar el override en el backend');
    } finally {
      setAccionEnCurso(false);
    }
  };

  const handleGuardarResolucion = async (e) => {
    e.preventDefault();
    if (!modalResolucion) return;
    try {
      setGuardandoResolucion(true);
      await adminService.responderDisputa(modalResolucion.id, resolucionTexto, nuevoEstado);
      setSuccessMsg(`Disputa #${modalResolucion.ticketNumero} resuelta exitosamente.`);
      setModalResolucion(null);
      await cargarDisputas(true);
      setTimeout(() => setSuccessMsg(''), 6000);
    } catch (err) {
      alert('Error al resolver disputa: ' + (err.message || err));
    } finally {
      setGuardandoResolucion(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-prisma-text-primary flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-prisma-orange" />
            Mesa de Resolución de Incidentes y Disputas
          </h1>
          <p className="text-prisma-text-secondary text-sm mt-1">
            Gestión centralizada de contingencias operativas, reclamos de empresas productoras y tenderos.
          </p>
        </div>
      </div>

      {errorApi && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 text-xs">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span>{errorApi}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl flex items-center gap-3 text-xs">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-prisma-border shadow-sm overflow-hidden">
        {cargando ? (
          <div className="p-12 text-center text-xs text-prisma-text-secondary space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-prisma-teal" />
            <p>Consultando /api/v1/admin/disputas...</p>
          </div>
        ) : disputas.length === 0 ? (
          <div className="p-12 text-center text-xs text-prisma-text-secondary space-y-1">
            <p className="font-bold text-prisma-text-primary">No hay tickets de disputa activos</p>
            <p>La red no tiene incidentes pendientes en este momento.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-prisma-surface text-prisma-text-secondary border-b border-prisma-border uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Ticket</th>
                  <th className="px-5 py-3.5">Remitente / Origen</th>
                  <th className="px-5 py-3.5">Tipo Incidente</th>
                  <th className="px-5 py-3.5">Detalle Reportado</th>
                  <th className="px-5 py-3.5">Resolución / Estado</th>
                  <th className="px-5 py-3.5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-prisma-border">
                {disputas.map((d) => {
                  const esProveedor = d.proveedor != null || (d.tipoIncidente && d.tipoIncidente.includes('COMISION'));
                  const esAbierto = d.estado === 'ABIERTO';

                  return (
                    <tr key={d.id} className="hover:bg-gray-50/70 transition">
                      <td className="px-5 py-4 font-mono font-bold text-prisma-teal">{d.ticketNumero}</td>
                      <td className="px-5 py-4">
                        {esProveedor ? (
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                              <Building2 className="w-3.5 h-3.5" />
                            </span>
                            <div>
                              <p className="font-bold text-indigo-950">
                                {d.proveedor?.nombreComercial || 'Empresa Distribuidora'}
                              </p>
                              <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                Reclamo de Productor
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                              <Store className="w-3.5 h-3.5" />
                            </span>
                            <div>
                              <p className="font-bold text-prisma-text-primary">
                                {d.pedido?.tienda?.nombreTienda || 'Tienda de Barrio'}
                              </p>
                              <p className="text-[10px] text-gray-400">
                                Pedido #{d.pedido?.numeroPedido || d.pedido?.id || 'N/A'}
                              </p>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {d.tipoIncidente ? d.tipoIncidente.replace(/_/g, ' ') : 'INCIDENTE'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-prisma-text-secondary max-w-xs">
                        <p className="line-clamp-2 italic">"{d.descripcion}"</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            esAbierto ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {d.estado}
                          </span>
                          {d.resolucionJustificacion && (
                            <p className="text-[10px] text-gray-500 line-clamp-1">
                              Solución: {d.resolucionJustificacion}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setModalResolucion(d);
                              setResolucionTexto(d.resolucionJustificacion || 'Revisado y resuelto por soporte administrativo Prisma.');
                              setNuevoEstado('RESUELTO');
                            }}
                            className="px-3 py-1.5 bg-prisma-teal hover:bg-prisma-teal-dark text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>{d.estado === 'RESUELTO' ? 'Ver / Editar' : 'Resolver'}</span>
                          </button>

                          {esAbierto && d.pedido && (
                            <button
                              onClick={() => setSelectedCase(d)}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-sm transition"
                              title="Autorizar entrega forzada por PIN"
                            >
                              Override PIN
                            </button>
                          )}
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

      {/* Modal Resolver Disputa / Responder Caso Admin */}
      {modalResolucion && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-prisma-border">
              <h3 className="font-bold text-base text-prisma-text-primary flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-prisma-teal" />
                Dictar Resolución al Ticket #{modalResolucion.ticketNumero}
              </h3>
              <button onClick={() => setModalResolucion(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gray-50 p-3.5 rounded-2xl border border-prisma-border text-xs space-y-1.5">
              <p><strong>Remitente:</strong> {modalResolucion.proveedor?.nombreComercial || modalResolucion.pedido?.tienda?.nombreTienda || 'Usuario de la Red'}</p>
              <p><strong>Motivo:</strong> {modalResolucion.tipoIncidente}</p>
              <p className="italic text-gray-600">"{modalResolucion.descripcion}"</p>
            </div>

            <form onSubmit={handleGuardarResolucion} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-prisma-text-primary mb-1">
                  Dictamen / Solución Oficial de Prisma Admin *:
                </label>
                <textarea
                  required
                  rows={4}
                  value={resolucionTexto}
                  onChange={(e) => setResolucionTexto(e.target.value)}
                  placeholder="Explica la respuesta o resolución oficial que recibirá la empresa o tendero..."
                  className="w-full text-xs p-3 border border-prisma-border rounded-xl focus:ring-2 focus:ring-prisma-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-prisma-text-primary mb-1">
                  Estado tras la resolución:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNuevoEstado('RESUELTO')}
                    className={`p-2.5 rounded-xl border font-bold text-center transition ${
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
                    className={`p-2.5 rounded-xl border font-bold text-center transition ${
                      nuevoEstado === 'EN_GESTION'
                        ? 'border-sky-600 bg-sky-50 text-sky-800'
                        : 'border-prisma-border bg-white text-gray-600'
                    }`}
                  >
                    Mantener En Trámite
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-prisma-border">
                <button
                  type="button"
                  onClick={() => setModalResolucion(null)}
                  className="px-4 py-2 border border-prisma-border text-prisma-text-secondary hover:bg-gray-50 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoResolucion}
                  className="px-5 py-2.5 bg-prisma-teal hover:bg-prisma-teal-dark text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  {guardandoResolucion ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Guardar y Notificar Resolución</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Justificación Obligatoria para Override PIN */}
      {selectedCase && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-prisma-border">
              <h3 className="font-bold text-base text-prisma-text-primary flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Autorizar Entrega por Soporte (Override PIN)
              </h3>
              <button onClick={() => setSelectedCase(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gray-50 p-3.5 rounded-xl border border-prisma-border text-xs space-y-1">
              <p><strong className="text-prisma-text-primary">Ticket:</strong> {selectedCase.ticketNumero}</p>
              <p><strong className="text-prisma-text-primary">Pedido:</strong> {selectedCase.pedido?.numeroPedido || `#${selectedCase.pedido?.id}`}</p>
              <p><strong className="text-prisma-text-primary">Detalle:</strong> {selectedCase.descripcion}</p>
            </div>

            <form onSubmit={handleOverride} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-prisma-text-primary mb-1">
                  Justificación Obligatoria de Soporte *
                </label>
                <textarea
                  required
                  rows={4}
                  value={justificacion}
                  onChange={(e) => setJustificacion(e.target.value)}
                  placeholder="Ej: Confirmación telefónica con el tendero al número registrado; confirma recepción completa y pago en efectivo."
                  className="w-full text-xs p-3 border border-prisma-border rounded-xl focus:ring-2 focus:ring-prisma-teal focus:outline-none"
                />
                <span className="text-[11px] text-prisma-text-secondary">
                  Mínimo 15 caracteres ({justificacion.length}/15). Este texto se envía a la API para persistir en la tabla audit_logs de PostgreSQL.
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCase(null)}
                  className="px-4 py-2 border border-prisma-border text-prisma-text-secondary hover:bg-gray-50 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={accionEnCurso}
                  className="px-4 py-2 bg-prisma-teal hover:bg-prisma-teal-dark text-white rounded-xl text-xs font-semibold shadow-sm disabled:opacity-50"
                >
                  {accionEnCurso ? 'Guardando en API...' : 'Aprobar y Sellar Entrega'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
