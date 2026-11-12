import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/api';
import { ShieldCheck, RefreshCw, RotateCcw } from 'lucide-react';

// HU-19: presentación de cada estado del circuit breaker de la pasarela de pagos
export const ESTADOS_CIRCUITO = {
  CLOSED: {
    texto: 'Cerrado',
    clase: 'bg-emerald-100 text-emerald-800',
    detalle: 'La pasarela responde con normalidad: los pagos se procesan.',
  },
  OPEN: {
    texto: 'Abierto',
    clase: 'bg-red-100 text-red-800',
    detalle: 'Pasarela degradada: los pagos responden de inmediato "Servicio de pagos temporalmente no disponible".',
  },
  HALF_OPEN: {
    texto: 'Semiabierto',
    clase: 'bg-amber-100 text-amber-800',
    detalle: 'Probando la pasarela con solicitudes de prueba; si responden bien, el circuito se cierra.',
  },
};

const INTERVALO_MS = 10000;

/**
 * HU-19 – Estado del circuit breaker de la pasarela de pagos para el administrador.
 */
export const CircuitoPagosCard = () => {
  const [circuito, setCircuito] = useState(null);
  const [error, setError] = useState(null);
  const [procesando, setProcesando] = useState(false);

  const cargar = useCallback(
    () =>
      adminService
        .getCircuitoPagos()
        .then((datos) => {
          setCircuito(datos);
          setError(null);
        })
        .catch(() => setError('No fue posible consultar el estado del circuito de pagos')),
    []
  );

  useEffect(() => {
    cargar();
    const intervalo = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      cargar();
    }, INTERVALO_MS);
    return () => clearInterval(intervalo);
  }, [cargar]);

  const reiniciar = async () => {
    setProcesando(true);
    try {
      setCircuito(await adminService.reiniciarCircuitoPagos());
      setError(null);
    } catch {
      setError('No fue posible reiniciar el circuito de pagos');
    } finally {
      setProcesando(false);
    }
  };

  const estado = circuito ? ESTADOS_CIRCUITO[circuito.estado] : null;
  const tasa = circuito && circuito.tasaFallosPorcentaje >= 0 ? `${Number(circuito.tasaFallosPorcentaje).toFixed(0)}%` : '—';

  return (
    <div className="bg-white rounded-2xl border border-prisma-border shadow-sm p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-prisma-text-primary flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-prisma-teal" />
            Pasarela de Pagos · Circuit Breaker
          </h2>
          <p className="text-xs text-prisma-text-secondary">Resiliencia ante caída de la pasarela (Resilience4j)</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={cargar}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            Actualizar
          </button>
          <button
            onClick={reiniciar}
            disabled={procesando || !circuito || circuito.estado === 'CLOSED'}
            className="px-3.5 py-2 bg-prisma-teal hover:bg-prisma-teal-dark text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Cerrar circuito
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-amber-700">{error}</p>}

      {circuito && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${estado?.clase ?? 'bg-gray-100 text-gray-700'}`}>
              {estado?.texto ?? circuito.estado}
            </span>
            <span className="text-xs text-prisma-text-secondary">{estado?.detalle}</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-prisma-surface rounded-xl border border-prisma-border/60">
              <span className="text-[10px] text-gray-400 uppercase font-semibold">Tasa de fallos</span>
              <p className="font-bold text-prisma-text-primary">
                <span>{tasa}</span> <span className="font-normal text-gray-400">/ umbral {circuito.umbralFallosPorcentaje}%</span>
              </p>
            </div>
            <div className="p-3 bg-prisma-surface rounded-xl border border-prisma-border/60">
              <span className="text-[10px] text-gray-400 uppercase font-semibold">Exitosas / fallidas</span>
              <p className="font-bold text-prisma-text-primary">
                {circuito.llamadasExitosas} / {circuito.llamadasFallidas}
              </p>
            </div>
            <div className="p-3 bg-prisma-surface rounded-xl border border-prisma-border/60">
              <span className="text-[10px] text-gray-400 uppercase font-semibold">Rechazadas (abierto)</span>
              <p className="font-bold text-prisma-text-primary">{circuito.llamadasRechazadasPorCircuitoAbierto}</p>
            </div>
            <div className="p-3 bg-prisma-surface rounded-xl border border-prisma-border/60">
              <span className="text-[10px] text-gray-400 uppercase font-semibold">Espera abierto</span>
              <p className="font-bold text-prisma-text-primary">{circuito.esperaAbiertoSegundos} s</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
