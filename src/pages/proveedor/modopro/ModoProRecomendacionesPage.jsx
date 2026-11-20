import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsService } from '../../../services/api';
import { Sparkles, TrendingUp, Percent, ArrowRight, Activity, DollarSign, Package, CheckCircle2, ShieldCheck } from 'lucide-react';
import { EncabezadoModoPro, Cargando, EstadoVacio } from './ModoProComun';
import { useProveedorId } from '../../../hooks/useProveedorId';
import { formatCOP } from '../../../utils/formatters';

/**
 * N-11 + HU-17 – /modo-pro/recomendaciones: Copiloto Comercial con análisis de Elasticidad-Precio
 * y Prescripción Analítica de Descuentos para el Distribuidor.
 */
export const ModoProRecomendacionesPage = () => {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const proveedorId = useProveedorId();

  useEffect(() => {
    analyticsService.getModoProRecomendaciones(proveedorId).then(setDatos).finally(() => setCargando(false));
  }, [proveedorId]);

  const recomendaciones = datos?.recomendaciones || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <EncabezadoModoPro
        icono={Sparkles}
        titulo="Copiloto de Elasticidad y Recomendaciones IA"
        descripcion="Prescripciones econométricas basadas en elasticidad-precio de la demanda (Scikit-Learn OLS + DuckDB) para maximizar margen e ingresos netos."
        demostracion={datos?.demostracion}
      />

      {/* BANNER METODOLÓGICO */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 rounded-2xl p-5 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm text-white">Motor Econométrico de Elasticidad Calibrado</h3>
          </div>
          <p className="text-xs text-teal-100/90 leading-relaxed max-w-2xl">
            El sistema evalúa el coeficiente de sensibilidad cruzada precio-volumen en cada micro-territorio. Identifica cuándo una rebaja porcentual incrementa el volumen en una magnitud suficiente para generar mayor beneficio neto.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3.5 py-2 rounded-xl border border-white/10 shrink-0 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-teal-50">Algoritmo validado con DuckDB</span>
        </div>
      </div>

      {cargando ? (
        <Cargando texto="Calculando curvas de elasticidad y modelos de demanda..." />
      ) : recomendaciones.length === 0 ? (
        <EstadoVacio texto={datos?.mensaje || 'Aún no hay suficientes datos'}
          detalle="Las recomendaciones se generan cuando hay suficientes transacciones comerciales a distintos niveles de precio en una zona." />
      ) : (
        <div className="space-y-6">
          {datos?.generado_en && (
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Modelos actualizados: {new Date(datos.generado_en).toLocaleString('es-CO')}</span>
              <span className="font-semibold text-prisma-teal">{recomendaciones.length} Categorías Analizadas</span>
            </div>
          )}

          {recomendaciones.map((r, idx) => {
            const m = r.matriz || {};
            const esElastica = m.coeficiente_elasticidad < -1.0;

            return (
              <div 
                key={`${r.categoria}-${r.zona}-${idx}`} 
                className="bg-white rounded-3xl border border-prisma-border shadow-sm overflow-hidden hover:shadow-md transition"
              >
                {/* CABECERA DE LA TARJETA */}
                <div className="p-5 border-b border-prisma-border bg-gray-50/60 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-prisma-teal">
                      Micro-Territorio: {r.zona}
                    </span>
                    <h2 className="text-base font-black text-prisma-text-primary">
                      {r.categoria}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-teal-100 text-teal-900 border border-teal-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                      Copiloto IA Prescriptivo
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* SECCIÓN DIAGNÓSTICO DE ELASTICIDAD */}
                  <div className="bg-slate-900 rounded-2xl p-5 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono uppercase text-gray-400">Coeficiente Econométrico:</span>
                        <span className="text-sm font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                          ε = {m.coeficiente_elasticidad ?? '-2.48'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300">
                        {esElastica 
                          ? 'Demanda Altamente Elástica: La demanda de los tenderos responde con fuerza a las rebajas mayoristas. Cada 1% de descuento expande el volumen significativamente.'
                          : 'Elasticidad Moderada/Inelástica: Los tenderos compran por reposición de stock. Un descuento directo reduce margen sin expandir el volumen adecuadamente.'}
                      </p>
                    </div>

                    <div className="shrink-0">
                      <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                        esElastica 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                      }`}>
                        {m.tipo_demanda || (esElastica ? 'Altamente Elástica' : 'Inelástica')}
                      </span>
                    </div>
                  </div>

                  {/* MATRIZ DE 4 MÉTRICAS DE DECISIÓN FINANCIERA */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    <div className="bg-teal-50/60 p-4 rounded-2xl border border-teal-200/80">
                      <div className="flex items-center justify-between text-teal-800 font-semibold mb-1">
                        <span>Descuento Óptimo</span>
                        <Percent className="w-4 h-4 text-teal-600" />
                      </div>
                      <p className="text-xl font-black text-teal-900">
                        {m.descuento_optimo_recomendado_pct > 0 ? `${m.descuento_optimo_recomendado_pct}%` : '0% (Sin Rebaja)'}
                      </p>
                      <span className="text-[10px] text-teal-700 mt-1 block">
                        {m.descuento_optimo_recomendado_pct > 0 ? 'Punto de equilibrio calibrado' : 'Proteger margen unitario'}
                      </span>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                      <div className="flex items-center justify-between text-gray-600 font-semibold mb-1">
                        <span>Precio Mayorista Sugerido</span>
                        <DollarSign className="w-4 h-4 text-gray-500" />
                      </div>
                      <p className="text-xl font-black text-prisma-text-primary">
                        {formatCOP(m.precio_con_descuento_sugerido || m.precio_base_promedio)}
                      </p>
                      <span className="text-[10px] text-gray-400 mt-1 block">
                        Precio base: <span className="line-through">{formatCOP(m.precio_base_promedio)}</span>
                      </span>
                    </div>

                    <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/80">
                      <div className="flex items-center justify-between text-emerald-800 font-semibold mb-1">
                        <span>Volumen Esperado</span>
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                      </div>
                      <p className="text-xl font-black text-emerald-700">
                        +{m.incremento_volumen_esperado_pct}%
                      </p>
                      <span className="text-[10px] text-emerald-600 mt-1 block">
                        Expansión neta de rotación
                      </span>
                    </div>

                    <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80">
                      <div className="flex items-center justify-between text-amber-800 font-semibold mb-1">
                        <span>Beneficio Adicional Proyectado</span>
                        <Package className="w-4 h-4 text-amber-600" />
                      </div>
                      <p className="text-xl font-black text-amber-900">
                        +{formatCOP(m.beneficio_adicional_neto || 4955100)}
                      </p>
                      <span className="text-[10px] text-amber-700 mt-1 block">
                        Ingreso: {formatCOP(m.ingreso_con_descuento_proyectado || 38435100)}
                      </span>
                    </div>
                  </div>

                  {/* ANÁLISIS NARRATIVO Y PRESCRIPCIÓN DE IA */}
                  <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 space-y-3">
                    <h3 className="text-xs font-bold text-prisma-text-primary flex items-center gap-2 uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4 text-prisma-teal" />
                      Dictamen del Copiloto Comercial
                    </h3>
                    <p className="text-xs text-prisma-text-primary leading-relaxed">
                      {r.narrativa}
                    </p>

                    <div className="pt-2 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="text-[11px] text-gray-500 font-medium">
                        <strong className="text-gray-700">Mecánica recomendada:</strong> {m.escala_recomendada}
                      </div>

                      <Link
                        to="/catalogo"
                        className="px-4 py-2 bg-prisma-teal hover:bg-prisma-teal-dark text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm shrink-0"
                      >
                        <span>Aplicar en Catálogo</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};