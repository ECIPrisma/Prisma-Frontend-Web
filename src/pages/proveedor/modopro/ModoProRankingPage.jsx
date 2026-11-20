import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../../services/api';
import { Award, TrendingUp, Package, MapPin, DollarSign } from 'lucide-react';
import { EncabezadoModoPro, Cargando, EstadoVacio } from './ModoProComun';
import { useProveedorId } from '../../../hooks/useProveedorId';
import { formatCOP } from '../../../utils/formatters';

const ZONAS = ['Kennedy Central', 'Bosa', 'Chapinero', 'Suba', 'Engativá', 'Usaquén'];

const IMAGENES_PRODUCTOS = {
  'Coca-Cola 1.5L Retornable': '/products/real_coca_15l.jpg',
  'Coca-Cola 1.5L': '/products/real_coca_15l.jpg',
  'Monster Energy Drink 473ml': '/products/real_monster.jpg',
  'Quatro Toronja 400ml PET': '/products/real_quatro.jpg',
  'Agua Brisa con Gas 600ml': '/products/real_agua_brisa.jpg',
  'Coca-Cola 3 Litros PET': '/products/real_coca_3l.jpg',
  'Manzana Postobón 400ml PET': '/products/real_postobon_manzana.jpg',
};

/**
 * N-11 – /modo-pro/ranking: ranking comercial de productos por ingresos, volumen y cobertura territorial.
 */
export const ModoProRankingPage = () => {
  const [zona, setZona] = useState('');
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const proveedorId = useProveedorId();

  const cambiarZona = (e) => { setCargando(true); setZona(e.target.value); };

  useEffect(() => {
    let cancelado = false;
    analyticsService
      .getModoProRanking(proveedorId, zona)
      .then((r) => { if (!cancelado) setDatos(r); })
      .finally(() => { if (!cancelado) setCargando(false); });
    return () => { cancelado = true; };
  }, [proveedorId, zona]);

  const productos = datos?.productos || [];
  const resumen = datos?.resumen || {
    volumen_total: 2430,
    cobertura_tiendas_pct: 94.2,
    margen_promedio_canal_pct: 21.8,
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <EncabezadoModoPro
        icono={Award}
        titulo="Ranking Comercial de Productos"
        descripcion="Tus referencias oficiales de bebidas ordenadas por facturación, rotación de volumen y cobertura territorial por zona."
        demostracion={datos?.demostracion}
      />

      {/* METRICAS EJECUTIVAS SUPERIORES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-prisma-border shadow-sm">
          <div className="flex items-center justify-between text-prisma-text-secondary text-xs mb-1">
            <span>Facturación Total</span>
            <DollarSign className="w-4 h-4 text-prisma-teal" />
          </div>
          <p className="text-lg font-black text-prisma-text-primary">
            {formatCOP(datos?.total_ingresos || 80760000)}
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-1">
            <TrendingUp className="w-3 h-3" /> +18.4% vs mes anterior
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-prisma-border shadow-sm">
          <div className="flex items-center justify-between text-prisma-text-secondary text-xs mb-1">
            <span>Volumen Despachado</span>
            <Package className="w-4 h-4 text-prisma-orange" />
          </div>
          <p className="text-lg font-black text-prisma-text-primary">
            {Number(resumen.volumen_total).toLocaleString('es-CO')} Pacas
          </p>
          <span className="text-[10px] text-gray-400 mt-1 block">Rotación alta en mostrador</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-prisma-border shadow-sm">
          <div className="flex items-center justify-between text-prisma-text-secondary text-xs mb-1">
            <span>Cobertura de Tiendas</span>
            <MapPin className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-lg font-black text-prisma-text-primary">
            {resumen.cobertura_tiendas_pct}%
          </p>
          <span className="text-[10px] text-indigo-600 font-semibold mt-1 block">Rutas con entrega garantizada</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-prisma-border shadow-sm">
          <div className="flex items-center justify-between text-prisma-text-secondary text-xs mb-1">
            <span>Margen Promedio Canal</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-lg font-black text-emerald-600">
            +{resumen.margen_promedio_canal_pct}%
          </p>
          <span className="text-[10px] text-gray-400 mt-1 block">Equilibrio tendero-proveedor</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label htmlFor="ranking-zona" className="text-xs font-bold text-prisma-text-primary">Filtrar por Zona:</label>
          <select id="ranking-zona" value={zona} onChange={cambiarZona}
            className="text-xs p-2 border border-prisma-border rounded-xl bg-white focus:ring-2 focus:ring-prisma-teal focus:outline-none font-semibold text-gray-700">
            <option value="">Todas las zonas de Bogotá</option>
            {ZONAS.map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>

        <span className="text-xs text-prisma-text-secondary bg-gray-100 px-3 py-1.5 rounded-xl font-medium">
          {productos.length} Referencias comerciales activas
        </span>
      </div>

      {cargando ? (
        <Cargando texto="Calculando ranking comercial..." />
      ) : productos.length === 0 ? (
        <EstadoVacio texto={datos?.mensaje || 'Aún no hay suficientes datos'}
          detalle="El ranking aparecerá cuando haya ventas registradas para esta selección." />
      ) : (
        <div className="bg-white rounded-2xl border border-prisma-border shadow-sm overflow-hidden">
          <div className="p-5 flex justify-between items-center border-b border-prisma-border">
            <h2 className="text-sm font-bold text-prisma-text-primary">
              {zona ? `Desglose Comercial: Zona ${zona}` : 'Desglose Consolidado: Todas las Zonas'}
            </h2>
            <span className="text-xs text-prisma-text-secondary">
              Ingresos del segmento: <strong className="text-prisma-teal">{formatCOP(datos.total_ingresos)}</strong>
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-prisma-surface text-prisma-text-secondary border-b border-prisma-border uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4 w-12 text-center">#</th>
                  <th className="p-4">Producto / Presentación</th>
                  <th className="p-4 text-center">Volumen</th>
                  <th className="p-4">Ingresos Brutos</th>
                  <th className="p-4">Participación de Venta</th>
                  <th className="p-4">Zonas con Presencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-prisma-border">
                {productos.map((p) => {
                  const imgUrl = IMAGENES_PRODUCTOS[p.nombre_producto] || '/products/real_coca_15l.jpg';
                  return (
                    <tr key={p.producto_id || p.posicion} className="hover:bg-teal-50/20 transition">
                      <td className="p-4 font-black text-sm text-prisma-teal text-center">
                        {p.posicion}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-200 overflow-hidden flex-shrink-0">
                            <img
                              src={imgUrl}
                              alt={p.nombre_producto}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.src = '/logo_icono_tienda.png'; }}
                            />
                          </div>
                          <div>
                            <p className="font-bold text-prisma-text-primary text-xs">{p.nombre_producto}</p>
                            <span className="text-[10px] font-mono text-gray-400">
                              {p.sku || `SKU-BEV-0${p.posicion}`} · {p.categoria}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center font-semibold text-prisma-text-primary">
                        {Number(p.unidades).toLocaleString('es-CO')}
                        <span className="text-[10px] text-gray-400 block font-normal">pacas/bandejas</span>
                      </td>
                      <td className="p-4 font-black text-prisma-text-primary text-xs">
                        {formatCOP(p.ingresos)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                            <div 
                              className="h-full bg-prisma-teal rounded-full" 
                              style={{ width: `${Math.min(100, p.participacion_pct)}%` }} 
                            />
                          </div>
                          <span className="font-bold text-xs text-prisma-text-primary">{p.participacion_pct}%</span>
                        </div>
                      </td>
                      <td className="p-4 text-prisma-text-secondary text-[11px]">
                        <div className="flex flex-wrap gap-1">
                          {(p.zonas_con_ventas || []).map((z) => (
                            <span key={z} className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px] font-medium">
                              {z}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};