import React, { useState, useEffect } from 'react';
import { proveedorService } from '../../services/api';
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
  Calendar 
} from 'lucide-react';

export const EstadisticasEconomicasPage = () => {
  const [stats, setStats] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargarEstadisticas = async (silencioso = false) => {
    try {
      if (!silencioso && !stats) setCargando(true);
      const data = await proveedorService.getEstadisticasEconomicas();
      setStats(data || {});
      setError(null);
    } catch (err) {
      if (!silencioso && !stats) {
        setError(err.message || 'Error al cargar estadísticas económicas');
      }
    } finally {
      if (!silencioso && !stats) setCargando(false);
    }
  };

  useEffect(() => {
    cargarEstadisticas();
    const interval = setInterval(() => {
      cargarEstadisticas(true);
    }, 4000);
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
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
    </div>
  );
};
