import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../../services/api';
import { Package, ArrowUpRight } from 'lucide-react';
import { EncabezadoModoPro, Cargando, EstadoVacio } from './ModoProComun';
import { useProveedorId } from '../../../hooks/useProveedorId';
import { formatCOP } from '../../../utils/formatters';

const ZONAS = ['Norte', 'Centro', 'Sur', 'Occidente'];

const pct = (valor) => `${Math.round(Number(valor ?? 0) * 100)}%`;

const ETIQUETA_FORMATO = {
  EMPAQUE_FRACCIONADO: 'Empaque fraccionado',
  FORMATO_INSTITUCIONAL: 'Formato institucional',
};

/**
 * N-11 + HU-31 – /modo-pro/empaques: minería de canasta (FP-Growth). Si los tenderos de una zona demandan una
 * referencia pero rechazan sistemáticamente su presentación grande, se prescriben formatos más accesibles.
 * Sin reglas con soporte y confianza suficientes no se muestra ninguna prescripción (criterio 2).
 */
export const ModoProEmpaquesPage = () => {
  const [zona, setZona] = useState('');
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const proveedorId = useProveedorId();

  // El indicador de carga se activa al cambiar la zona (no dentro del efecto)
  const cambiarZona = (e) => { setCargando(true); setZona(e.target.value); };

  useEffect(() => {
    let cancelado = false;
    analyticsService
      .getModoProFormatosEmpaque(proveedorId, zona)
      .then((r) => { if (!cancelado) setDatos(r); })
      .finally(() => { if (!cancelado) setCargando(false); });
    return () => { cancelado = true; };
  }, [proveedorId, zona]);

  const prescripciones = datos?.prescripciones || [];
  const sinPatron = datos?.referencias_sin_patron || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <EncabezadoModoPro
        icono={Package}
        titulo="Formatos de Empaque"
        descripcion="Presentaciones que los tenderos rechazan por su alto valor y los formatos más accesibles que puedes ofrecer en su lugar."
        demostracion={datos?.demostracion}
      />

      <div className="flex items-center gap-2">
        <label htmlFor="empaques-zona" className="text-xs font-bold text-prisma-text-primary">Zona</label>
        <select id="empaques-zona" value={zona} onChange={cambiarZona}
          className="text-xs p-2 border border-prisma-border rounded-xl bg-white focus:ring-2 focus:ring-prisma-teal focus:outline-none">
          <option value="">Todas las zonas</option>
          {ZONAS.map((z) => <option key={z} value={z}>{z}</option>)}
        </select>
      </div>

      {cargando ? (
        <Cargando texto="Ejecutando el análisis de canasta (FP-Growth)..." />
      ) : !datos?.suficientes_datos ? (
        <EstadoVacio texto={datos?.mensaje || 'Aún no hay suficientes datos'}
          detalle="Se necesitan ventas de una misma referencia en varias presentaciones para detectar rechazos." />
      ) : prescripciones.length === 0 ? (
        <EstadoVacio texto="Sin prescripciones de empaque"
          detalle={datos?.mensaje || 'No se detectaron patrones de rechazo con soporte y confianza suficientes.'} />
      ) : (
        <div className="space-y-4">
          {prescripciones.map((p) => (
            <div key={`${p.referencia}-${p.zona}-${p.presentacion_rechazada.nombre}`}
              className="bg-white rounded-2xl border border-prisma-border shadow-sm p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-prisma-text-primary">{p.referencia} · Zona {p.zona}</h2>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">Rechazo sistemático</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-[10px] uppercase font-semibold text-emerald-700">Compran</span>
                  <p className="font-bold text-emerald-900">{p.presentacion_aceptada.nombre} · {formatCOP(p.presentacion_aceptada.precio_promedio)}</p>
                  <p className="text-emerald-800">Confianza de la regla: {pct(p.regla_aceptacion.confianza)}</p>
                </div>
                <div className="p-3 bg-red-50 rounded-xl border border-red-200">
                  <span className="text-[10px] uppercase font-semibold text-red-700">Rechazan</span>
                  <p className="font-bold text-red-900">{p.presentacion_rechazada.nombre} · {formatCOP(p.presentacion_rechazada.precio_promedio)}</p>
                  <p className="text-red-800">
                    Comprada en el {pct(p.confianza_presentacion_grande)} de los pedidos · sí se vende en {p.presentacion_rechazada.zonas_donde_si_se_vende.join(', ')}
                  </p>
                </div>
              </div>

              <p className="text-xs text-prisma-text-secondary">{p.mensaje}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {p.formatos_sugeridos.map((f) => (
                  <div key={f.tipo} className="p-4 rounded-xl border border-prisma-teal/40 bg-prisma-teal/5 space-y-1 text-xs">
                    <span className="text-[10px] uppercase font-semibold text-prisma-teal">{ETIQUETA_FORMATO[f.tipo] || f.tipo}</span>
                    <p className="font-bold text-prisma-text-primary flex items-start gap-1.5">
                      <ArrowUpRight className="w-4 h-4 flex-shrink-0 text-prisma-teal" />
                      {f.nombre}
                    </p>
                    <p className="text-prisma-text-primary">
                      Precio estimado: <strong>{formatCOP(f.precio_estimado)}</strong>
                      {f.ticket_vs_presentacion_grande_pct != null && ` (${f.ticket_vs_presentacion_grande_pct}% del precio de la presentación grande)`}
                    </p>
                    <p className="text-prisma-text-secondary">{f.descripcion}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!cargando && sinPatron.length > 0 && (
        <div className="bg-white rounded-2xl border border-prisma-border shadow-sm p-5 space-y-2">
          <h2 className="text-sm font-bold text-prisma-text-primary">Referencias analizadas sin patrón significativo</h2>
          <p className="text-[11px] text-prisma-text-secondary">Para estas referencias no se emite ninguna prescripción de empaque.</p>
          <ul className="text-xs divide-y divide-prisma-border">
            {sinPatron.map((x) => (
              <li key={`${x.referencia}-${x.zona}-${x.motivo}`} className="py-2">
                <span className="font-bold text-prisma-text-primary">{x.referencia} · Zona {x.zona}:</span>{' '}
                <span className="text-prisma-text-secondary">{x.motivo}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
