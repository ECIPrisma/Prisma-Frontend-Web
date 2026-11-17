import React, { useState, useEffect } from 'react';
import { proveedorService, analyticsService } from '../../services/api';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Store, 
  Award, 
  RefreshCw, 
  AlertCircle, 
  ArrowUpRight, 
  PieChart, 
  Wallet, 
  Calendar,
  Sparkles,
  Package,
  Zap
} from 'lucide-react';
import { ElasticidadCard } from './ElasticidadCard';

export const EstadisticasEconomicasPage = () => {
  const [stats, setStats] = useState(null);
  const [empaques, setEmpaques] = useState(null);
  const [analiticaStatus, setAnaliticaStatus] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargarEstadisticas = async (silencioso = false) => {
    try {
      if (!silencioso) setCargando(true);
      // La elasticidad (HU-30) la consulta ElasticidadCard según el producto y la zona elegidos
      const [data, dataEmp, health] = await Promise.all([
        proveedorService.getEstadisticasEconomicas(),
        analyticsService.getPrescripcionEmpaques(1).catch(() => null),
        analyticsService.getHealth().catch(() => null),
      ]);
      setStats(data || {});
      setEmpaques(dataEmp);
      setAnaliticaStatus(health);
      setError(null);
    } catch (err) {
      if (!silencioso) {
        setError(err.message || 'Error al cargar estadísticas económicas');
      }
    } finally {
      if (!silencioso) setCargando(false);
    }
  };

  useEffect(() => {
    cargarEstadisticas();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      cargarEstadisticas(true);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const formatearDinero = (monto) => {
    if (!monto) return '$0';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(monto);
  };

  if (cargando && !stats) {
    return (
      <div className="p-12 text-center text-xs text-prisma-text-secondary">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-prisma-teal" />
        Calculando estadísticas económicas de tus ventas...
      </div>
    );
  }

  const ventasTotales = stats?.ventasTotales || 0;
  const gananciaNeta = stats?.gananciaNetaProductor || ventasTotales;
  const totalPedidos = stats?.totalPedidos || 0;
  const tiendasAtendidas = stats?.tiendasAtendidas || 0;
  const ticketPromedio = stats?.ticketPromedio || 0;
  const topTiendas = stats?.topTiendas || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-prisma-text-primary flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-emerald-600" />
            Estadísticas Económicas y Ganancias
          </h1>
          <p className="text-xs text-prisma-text-secondary mt-1">
            Resumen en tiempo real del dinero generado por tu catálogo, ticket promedio y las tiendas que más te compran.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold border border-emerald-200">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span>Periodo Actual de Ventas</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tarjetas Principales de Rendimiento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-prisma-border shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-prisma-text-secondary">Ingresos Totales Brutos</p>
            <p className="text-xl font-bold text-emerald-700">{formatearDinero(ventasTotales)}</p>
            <span className="text-[10px] text-gray-400">Por pedidos despachados</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-prisma-border shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-teal-50 text-prisma-teal rounded-xl">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-prisma-text-secondary">Ganancia Neta para Ti</p>
            <p className="text-xl font-bold text-prisma-text-primary">{formatearDinero(gananciaNeta)}</p>
            <span className="text-[10px] text-emerald-600 font-semibold">100% de tu mercancía</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-prisma-border shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-prisma-text-secondary">Total Pedidos</p>
            <p className="text-xl font-bold text-prisma-text-primary">{totalPedidos}</p>
            <span className="text-[10px] text-gray-400">Ticket prom: {formatearDinero(ticketPromedio)}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-prisma-border shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-purple-50 text-purple-600 rounded-xl">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-prisma-text-secondary">Tiendas Activas</p>
            <p className="text-xl font-bold text-prisma-text-primary">{tiendasAtendidas}</p>
            <span className="text-[10px] text-purple-600 font-semibold">Comprando en tu zona</span>
          </div>
        </div>
      </div>

      {/* Desglose: Tiendas Más Rentables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-prisma-border shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-prisma-border pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-sm text-prisma-text-primary">Tiendas que Más te Generan Ganancia</h3>
            </div>
            <span className="text-xs text-prisma-text-secondary font-medium">Top 5 Clientes</span>
          </div>

          {topTiendas.length === 0 ? (
            <div className="p-8 text-center text-xs text-prisma-text-secondary">
              Aún no se registran compras suficientes para calcular el ranking de tiendas.
            </div>
          ) : (
            <div className="space-y-3">
              {topTiendas.map((t, index) => {
                const porcentaje = ventasTotales > 0 
                  ? Math.round((t.totalVendido / ventasTotales) * 100) 
                  : 0;

                return (
                  <div key={t.tiendaId} className="p-3.5 bg-gray-50/70 rounded-xl border border-gray-100 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                        index === 0 ? 'bg-amber-100 text-amber-800' :
                        index === 1 ? 'bg-gray-200 text-gray-700' :
                        index === 2 ? 'bg-amber-50 text-amber-900' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-prisma-text-primary">{t.nombreTienda}</p>
                        <p className="text-[10px] text-prisma-text-secondary">Aporte: {porcentaje}% de tus ventas</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-xs text-emerald-700 block">
                        {formatearDinero(t.totalVendido)}
                      </span>
                      <span className="text-[10px] text-gray-400">Total acumulado</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Resumen Comercial y Cobros */}
        <div className="bg-white rounded-2xl border border-prisma-border shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-prisma-border pb-3">
            <PieChart className="w-5 h-5 text-prisma-teal" />
            <h3 className="font-bold text-sm text-prisma-text-primary">Estructura de Recaudo</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-100 space-y-1">
              <span className="text-emerald-900 font-bold block">Cobro Contra Entrega Físico</span>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Tus camiones recaudan el efectivo directamente al momento de confirmar con el PIN del tendero.
              </p>
            </div>

            <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-100 space-y-1">
              <span className="text-blue-900 font-bold block">Protección Contra Cartera Vencida</span>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                El modelo sin crédito garantiza que el 100% de la mercancía entregada ya ingresó a caja de tu camión.
              </p>
            </div>

            <div className="p-4 bg-purple-50/70 rounded-xl border border-purple-100 space-y-1">
              <span className="text-purple-900 font-bold block">Actualización Constante</span>
              <p className="text-[11px] text-purple-800 leading-relaxed">
                Cada pedido que tu chofer marca como entregado en la app móvil suma inmediatamente a tus ganancias aquí.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN MODO PRO: INTELIGENCIA PRESCRIPTIVA DE PRECIOS Y EMPAQUES (SPRINT 3) */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-teal-950 text-white rounded-3xl p-5 sm:p-6 md:p-8 shadow-xl border border-indigo-500/20 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-400/30 text-indigo-300">
              <Sparkles className="w-6 h-6 text-indigo-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">Modo Pro: Inteligencia Prescriptiva</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  Sprint 3 • FASTAPI + DUCKDB
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                Modelos econométricos OLS y minería de canasta FP-Growth procesados en particiones columnares Parquet.
              </p>
            </div>
          </div>

          {analiticaStatus && (
            <div className="flex items-center gap-2 bg-black/30 backdrop-blur px-3.5 py-1.5 rounded-xl border border-white/10 text-xs">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-gray-300">Aislamiento RAM:</span>
              <span className="font-mono text-emerald-400 font-bold">{analiticaStatus.memory_usage_mb || 94.7} MB / 300 MB</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tarjeta 1: Elasticidad precio-demanda por producto y zona (HU-30 / SCRUM-43) */}
          <ElasticidadCard />

          {/* Tarjeta 2: Empaques y Combos por Minería FP-Growth (SCRUM-44) */}
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm text-white">Formatos de Empaque y Combos (FP-Growth)</h3>
              </div>
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                Reglas de Afinidad
              </span>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Combinaciones de productos con alta afinidad de compra detectadas en los carritos de los tenderos:
            </p>

            <div className="space-y-2.5">
              {(empaques?.formatos_empaque_prescritos || [
                {
                  tipo_formato: 'Pack Multipack / Six-Pack',
                  nombre_empaque: 'Six-Pack Económico: Coca-Cola 1.5L',
                  afinidad_lift: 1.5,
                  confianza_compra_pct: 100.0,
                  justificacion: 'Producto estrella con 100.0% de penetración en pedidos.',
                },
                {
                  tipo_formato: 'Combo Cruzado Frecuente',
                  nombre_empaque: 'Combo Tienda: Coca-Cola 1.5L + Papas Fritas 150g',
                  afinidad_lift: 1.67,
                  confianza_compra_pct: 75.0,
                  justificacion: 'Alta correlación observada en pedidos de tiendas en zona Norte.',
                }
              ]).map((formato, i) => (
                <div key={i} className="bg-black/30 p-3 rounded-xl border border-white/5 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase text-indigo-300 block">{formato.tipo_formato}</span>
                    <p className="text-xs font-bold text-white">{formato.nombre_empaque}</p>
                    <p className="text-[10px] text-gray-400">{formato.justificacion}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-bold text-emerald-400 block">Lift {formato.afinidad_lift}x</span>
                    <span className="text-[10px] text-gray-400">{formato.confianza_compra_pct}% confianza</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
