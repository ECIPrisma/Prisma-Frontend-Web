import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { Sliders, RefreshCw, AlertCircle, Check, Edit, Save, X } from 'lucide-react';

export const ConfiguracionPage = () => {
  const [configuraciones, setConfiguraciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Edición
  const [editandoClave, setEditandoClave] = useState(null);
  const [valorNuevo, setValorNuevo] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargarConfiguraciones = async (silencioso = false) => {
    try {
      if (!silencioso && configuraciones.length === 0) setCargando(true);
      const data = await adminService.getConfiguraciones();
      setConfiguraciones(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      if (!silencioso && configuraciones.length === 0) {
        setError(err.message || 'Error al consultar parámetros del sistema');
      }
    } finally {
      if (!silencioso && configuraciones.length === 0) setCargando(false);
    }
  };

  useEffect(() => {
    cargarConfiguraciones();
    const interval = setInterval(() => {
      if (!editandoClave) {
        cargarConfiguraciones(true);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [editandoClave]);

  const iniciarEdicion = (cfg) => {
    setEditandoClave(cfg.clave);
    setValorNuevo(cfg.valor);
  };

  const guardarParametro = async (clave) => {
    try {
      setGuardando(true);
      await adminService.updateConfiguracion(clave, valorNuevo);
      setEditandoClave(null);
      await cargarConfiguraciones(true);
    } catch (err) {
      alert('Error al actualizar parámetro: ' + err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-prisma-text-primary flex items-center gap-2">
            <Sliders className="w-7 h-7 text-prisma-teal" />
            Configuración y Parámetros del Sistema
          </h1>
          <p className="text-xs text-prisma-text-secondary mt-1">
            Gestión de reglas operativas, comisiones y límites de pedidos de la plataforma.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid de Parámetros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cargando ? (
          <div className="col-span-full p-12 text-center text-xs text-prisma-text-secondary bg-white rounded-2xl border border-prisma-border">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-prisma-teal" />
            Cargando parámetros...
          </div>
        ) : configuraciones.length === 0 ? (
          <div className="col-span-full p-12 text-center text-xs text-prisma-text-secondary bg-white rounded-2xl border border-prisma-border">
            No se encontraron parámetros operativos registrados.
          </div>
        ) : (
          configuraciones.map((cfg) => {
            const estaEditando = editandoClave === cfg.clave;

            return (
              <div
                key={cfg.clave}
                className="bg-white rounded-2xl border border-prisma-border p-5 shadow-sm space-y-3 flex flex-col justify-between hover:shadow-md transition"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xs font-bold text-prisma-teal">{cfg.clave}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                      {cfg.tipoDato || 'STRING'}
                    </span>
                  </div>
                  <p className="text-xs text-prisma-text-secondary mt-1">
                    {cfg.descripcion || 'Parámetro de configuración operativa'}
                  </p>
                </div>

                <div className="p-3 bg-prisma-surface rounded-xl border border-prisma-border/60 space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase font-semibold">Valor Actual:</span>
                  {estaEditando ? (
                    <input
                      type="text"
                      value={valorNuevo}
                      onChange={(e) => setValorNuevo(e.target.value)}
                      className="w-full p-2 border border-prisma-teal rounded-lg text-xs bg-white focus:outline-none"
                    />
                  ) : (
                    <p className="text-base font-bold text-prisma-text-primary font-mono">{cfg.valor}</p>
                  )}
                </div>

                <div className="pt-2 border-t border-prisma-border/60 flex justify-end gap-2">
                  {estaEditando ? (
                    <>
                      <button
                        onClick={() => setEditandoClave(null)}
                        className="px-3 py-1.5 border border-prisma-border text-gray-500 rounded-lg text-xs hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => guardarParametro(cfg.clave)}
                        disabled={guardando}
                        className="px-4 py-1.5 bg-prisma-teal hover:bg-prisma-teal-dark text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Guardar</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => iniciarEdicion(cfg)}
                      className="px-3 py-1.5 border border-prisma-border hover:border-prisma-teal text-prisma-text-primary rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Edit className="w-3.5 h-3.5 text-prisma-teal" />
                      <span>Modificar</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
