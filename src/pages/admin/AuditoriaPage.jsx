import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { FileText, Search, Download, Eye, X, RefreshCw, AlertCircle } from 'lucide-react';

export const AuditoriaPage = () => {
  const [logs, setLogs] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorApi, setErrorApi] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [filtro, setFiltro] = useState('');

  const cargarLogs = async (silencioso = false) => {
    if (!silencioso && logs.length === 0) setCargando(true);
    try {
      const data = await adminService.getAuditoria(0, 50);
      setLogs(data?.content || data || []);
      setErrorApi('');
    } catch (err) {
      if (!silencioso && logs.length === 0) {
        setErrorApi(err.message || 'No se pudo cargar el historial de actividad');
      }
    } finally {
      if (!silencioso && logs.length === 0) setCargando(false);
    }
  };

  useEffect(() => {
    cargarLogs();
    const interval = setInterval(() => {
      cargarLogs(true);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(l => 
    (l.tipoEvento || '').toLowerCase().includes(filtro.toLowerCase()) ||
    (l.agenteNombre || '').toLowerCase().includes(filtro.toLowerCase()) ||
    (l.recursoAfectadoTipo || '').toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-prisma-text-primary">Historial de Actividad y Auditoría</h1>
          <p className="text-prisma-text-secondary text-sm mt-1">
            Registro cronológico de movimientos, autorizaciones y operaciones en la plataforma.
          </p>
        </div>
      </div>

      {errorApi && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 text-xs">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span>{errorApi}</span>
        </div>
      )}

      {/* Buscador */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
        <input
          type="text"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Filtrar por agente, evento o recurso..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-prisma-border rounded-xl text-xs focus:ring-2 focus:ring-prisma-teal focus:outline-none"
        />
      </div>

      {/* Tabla de Logs */}
      <div className="bg-white rounded-2xl border border-prisma-border shadow-sm overflow-hidden">
        {cargando ? (
          <div className="p-12 text-center text-xs text-prisma-text-secondary space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-prisma-teal" />
            <p>Consultando /api/v1/admin/auditoria...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-prisma-text-secondary space-y-1">
            <p className="font-bold text-prisma-text-primary">Sin registros de auditoría que mostrar</p>
            <p>Los eventos aparecerán aquí conforme los agentes operen en el sistema.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-prisma-surface text-prisma-text-secondary text-xs font-semibold border-b border-prisma-border">
                <tr>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Agente / Rol</th>
                  <th className="px-6 py-3.5">Evento</th>
                  <th className="px-6 py-3.5">Severidad</th>
                  <th className="px-6 py-3.5">Recurso Afectado</th>
                  <th className="px-6 py-3.5">Justificación</th>
                  <th className="px-6 py-3.5 text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-prisma-border">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-mono text-xs text-prisma-text-secondary">{log.timestamp}</td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-prisma-text-primary">{log.agenteNombre}</p>
                      <p className="text-[11px] text-prisma-text-secondary">{log.agenteRol}</p>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-xs text-prisma-teal">{log.tipoEvento}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        log.nivelSeveridad === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                        log.nivelSeveridad === 'WARNING' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {log.nivelSeveridad}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-prisma-text-primary">{log.recursoAfectadoTipo} ({log.recursoAfectadoId})</td>
                    <td className="px-6 py-4 text-xs text-prisma-text-secondary max-w-xs truncate" title={log.justificacion}>
                      {log.justificacion}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 text-gray-500 hover:text-prisma-teal hover:bg-teal-50 rounded-lg transition"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Inspector */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-prisma-border">
              <div>
                <h3 className="font-bold text-lg text-prisma-text-primary">Detalle de Auditoría Forense</h3>
                <p className="text-xs font-mono text-prisma-text-secondary">UUID: {selectedLog.id}</p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p><strong className="text-prisma-text-primary">Agente:</strong> {selectedLog.agenteNombre} ({selectedLog.agenteEmail})</p>
              <p><strong className="text-prisma-text-primary">Dirección IP:</strong> {selectedLog.ipOrigen}</p>
              <p><strong className="text-prisma-text-primary">User-Agent:</strong> {selectedLog.userAgent}</p>
              <p><strong className="text-prisma-text-primary">Resultado:</strong> {selectedLog.resultado}</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-900">
              <strong className="block mb-1">Justificación Registrada:</strong>
              "{selectedLog.justificacion}"
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-prisma-text-primary hover:bg-black text-white rounded-xl text-xs font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
