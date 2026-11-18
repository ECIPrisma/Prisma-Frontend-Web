import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/api';
import { Layers, RefreshCw, AlertTriangle, Store, Package, CheckCircle } from 'lucide-react';
import { PRODUCTOS_ANALIZADOS, ZONAS } from '../../constants/analitica';

const formatoPesos = (valor) => `$${Number(valor ?? 0).toLocaleString('es-CO', { maximumFractionDigits: 0 })}`;

const selectClass =
  'bg-slate-900 border border-slate-600 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-400 cursor-pointer';

/**
 * HU-30 (SCRUM-43) – Elasticidad precio-demanda por producto y zona.
 * Demanda elástica: descuento por escala en unidades bonificadas que no sacrifica margen.
 * Demanda inelástica: descuento bloqueado + exhibidores o paquetes cruzados (bundles).
 */
export const ElasticidadCard = () => {
  const [productoId, setProductoId] = useState(PRODUCTOS_ANALIZADOS[0].id);
  const [zona, setZona] = useState(ZONAS[0]);
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(true);

  // El indicador de carga se activa al cambiar la selección (no dentro del efecto)
  const cambiarProducto = (e) => { setCargando(true); setProductoId(Number(e.target.value)); };
  const cambiarZona = (e) => { setCargando(true); setZona(e.target.value); };

  useEffect(() => {
    let cancelado = false;
    analyticsService
      .getPrescripcionDescuentos(productoId, zona)
      .then((datos) => { if (!cancelado) setResultado(datos); })
      .catch(() => { if (!cancelado) setResultado(null); })
      .finally(() => { if (!cancelado) setCargando(false); });
    return () => { cancelado = true; };
  }, [productoId, zona]);

  const bloqueado = Boolean(resultado?.descuento_bloqueado);
  const elastica = resultado?.tipo_demanda === 'Elástica';

  return (
    <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-teal-400" />
          <h3 className="font-bold text-sm text-white">Elasticidad Precio-Demanda</h3>
        </div>
        {resultado && (
          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase border ${
            elastica
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
              : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
          }`}>
            {resultado.tipo_demanda} (ε = {resultado.coeficiente_elasticidad})
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="elasticidad-producto">Producto</label>
        <select id="elasticidad-producto" value={productoId} onChange={cambiarProducto} className={selectClass}>
          {PRODUCTOS_ANALIZADOS.map((p) => <option key={p.id} value={p.id} className="text-black">{p.nombre}</option>)}
        </select>
        <label className="sr-only" htmlFor="elasticidad-zona">Zona</label>
        <select id="elasticidad-zona" value={zona} onChange={cambiarZona} className={selectClass}>
          {ZONAS.map((z) => <option key={z} value={z} className="text-black">Zona {z}</option>)}
        </select>
      </div>

      {cargando ? (
        <p className="text-xs text-gray-400 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
          Calculando elasticidad (regresión log-log)...
        </p>
      ) : !resultado || resultado.error ? (
        <p className="text-xs text-amber-300">{resultado?.error || 'No fue posible calcular la elasticidad para esta selección.'}</p>
      ) : (
        <>
          <p className="text-xs text-gray-300 leading-relaxed">{resultado.recomendacion_estrategica}</p>

          {bloqueado ? (
            <>
              <div className="bg-red-950 border border-red-700 rounded-xl p-3 text-xs space-y-1">
                <p className="font-bold text-red-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  Descuento directo bloqueado
                </p>
                <p className="text-gray-300">{resultado.motivo_bloqueo}</p>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-gray-400 block uppercase tracking-wider">
                  Activaciones recomendadas (sin tocar el precio):
                </span>
                {(resultado.alternativas_prescritas || []).map((alt) => (
                  <div key={alt.titulo} className="bg-slate-900 p-3 rounded-xl border border-slate-700 flex gap-2.5">
                    {alt.tipo === 'EXHIBIDOR'
                      ? <Store className="w-4 h-4 text-teal-300 flex-shrink-0 mt-0.5" />
                      : <Package className="w-4 h-4 text-indigo-300 flex-shrink-0 mt-0.5" />}
                    <div>
                      <p className="text-xs font-bold text-white">{alt.titulo}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{alt.descripcion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-gray-400 block uppercase tracking-wider">
                  Descuentos por escala prescritos:
                </span>
                {(resultado.escalas_prescritas || []).map((escala) => (
                  <div key={escala.escala_unidades} className="bg-slate-900 p-3 rounded-xl border border-slate-700">
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      {escala.descripcion || escala.escala_unidades}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Equivale a -{escala.descuento_porcentaje}% · {formatoPesos(escala.precio_unitario_final)}/ud
                      {escala.incremento_volumen_pct != null && ` · volumen +${escala.incremento_volumen_pct}%`}
                      {escala.variacion_margen_pct != null && ` · margen ${escala.variacion_margen_pct >= 0 ? '+' : ''}${escala.variacion_margen_pct}%`}
                    </p>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-700 flex justify-between text-[11px] text-gray-300">
                <span>Incremento de volumen con la mejor escala:</span>
                <span className="font-bold text-emerald-400">+{resultado.incremento_volumen_esperado_pct}%</span>
              </div>
            </>
          )}

          {resultado.alcance_datos === 'TODAS_LAS_ZONAS' && (
            <p className="text-[10px] text-gray-500">Pocos datos en la zona {zona}: el cálculo usa el historial de todas las zonas.</p>
          )}
          {resultado.datos_simulados && (
            <p className="text-[10px] text-gray-500">Datos de demostración (sin historial suficiente en el motor analítico).</p>
          )}
        </>
      )}
    </div>
  );
};
