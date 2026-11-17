import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../../services/api';
import { Sparkles, AlertCircle } from 'lucide-react';
import { EncabezadoModoPro, Cargando, EstadoVacio } from './ModoProComun';

// Nombres legibles de la matriz numérica (diagnóstico crudo)
const ETIQUETAS_MATRIZ = {
  categoria: 'Categoría',
  zona: 'Zona',
  coeficiente_elasticidad: 'Coeficiente de elasticidad',
  tipo_demanda: 'Tipo de demanda',
  descuento_bloqueado: 'Descuento bloqueado',
  escala_recomendada: 'Escala recomendada',
  descuento_optimo_recomendado_pct: 'Descuento óptimo (%)',
  incremento_volumen_esperado_pct: 'Incremento de volumen esperado (%)',
  precio_base_promedio: 'Precio base promedio',
  alternativas_sin_descuento: 'Alternativas sin descuento',
};

const valorCrudo = (v) => {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'Sí' : 'No';
  if (Array.isArray(v)) return v.length ? v.join(', ') : '—';
  return String(v);
};

/**
 * N-11 + HU-17 – /modo-pro/recomendaciones: recomendación narrativa con IA o, si la IA no respondió,
 * la matriz numérica cruda con el mensaje "Recomendación narrativa no disponible temporalmente".
 */
export const ModoProRecomendacionesPage = () => {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    analyticsService.getModoProRecomendaciones(1).then(setDatos).finally(() => setCargando(false));
  }, []);

  const recomendaciones = datos?.recomendaciones || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <EncabezadoModoPro
        icono={Sparkles}
        titulo="Recomendaciones Comerciales"
        descripcion="Qué hacer con tus precios y promociones, explicado en lenguaje claro. Se actualiza cada noche."
        demostracion={datos?.demostracion}
      />

      {cargando ? (
        <Cargando texto="Cargando recomendaciones..." />
      ) : recomendaciones.length === 0 ? (
        <EstadoVacio texto={datos?.mensaje || 'Aún no hay suficientes datos'}
          detalle="Las recomendaciones se generan cuando hay suficientes ventas a distintos precios en una zona." />
      ) : (
        <div className="space-y-4">
          {datos?.generado_en && (
            <p className="text-[11px] text-gray-400">Generadas el {new Date(datos.generado_en).toLocaleString('es-CO')}</p>
          )}
          {recomendaciones.map((r) => (
            <div key={`${r.categoria}-${r.zona}`} className="bg-white rounded-2xl border border-prisma-border shadow-sm p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-prisma-text-primary">{r.categoria} · Zona {r.zona}</h2>
                {r.estado === 'GENERADA' ? (
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800">Generada con IA</span>
                ) : (
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">Datos crudos</span>
                )}
              </div>

              {r.estado === 'GENERADA' ? (
                <p className="text-sm text-prisma-text-primary leading-relaxed">{r.narrativa}</p>
              ) : (
                <>
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{r.mensaje || 'Recomendación narrativa no disponible temporalmente'}</span>
                  </div>
                  {r.resumen_plantilla && (
                    <div className="text-xs">
                      <p className="text-[10px] uppercase font-semibold text-gray-400">Resumen automático</p>
                      <p className="text-prisma-text-primary mt-0.5">{r.resumen_plantilla}</p>
                    </div>
                  )}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-prisma-border rounded-xl">
                      <caption className="text-left text-[10px] uppercase font-semibold text-gray-400 pb-1">Diagnóstico del motor estadístico</caption>
                      <tbody className="divide-y divide-prisma-border">
                        {Object.entries(r.matriz || {}).map(([clave, valor]) => (
                          <tr key={clave}>
                            <th className="p-2 font-semibold text-prisma-text-secondary bg-prisma-surface w-1/2">{ETIQUETAS_MATRIZ[clave] || clave}</th>
                            <td className="p-2 font-mono text-prisma-text-primary">{valorCrudo(valor)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
