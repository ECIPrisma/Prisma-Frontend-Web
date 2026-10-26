import React, { useState, useEffect } from 'react';
import { formatearComision } from '../../config/comision';
import { proveedorService } from '../../services/api';
import { DollarSign, FileText, CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';

export const LiquidacionesPage = () => {
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargarLiquidaciones = async (silencioso = false) => {
    try {
      if (!silencioso && liquidaciones.length === 0) setCargando(true);
      const data = await proveedorService.getLiquidaciones();
      setLiquidaciones(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      if (!silencioso && liquidaciones.length === 0) {
        setError(err.message || 'Error al consultar las liquidaciones de ventas');
      }
    } finally {
      if (!silencioso && liquidaciones.length === 0) setCargando(false);
    }
  };

  useEffect(() => {
    cargarLiquidaciones();
    const interval = setInterval(() => {
      cargarLiquidaciones(true);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const totalVentas = liquidaciones.reduce((acc, l) => acc + Number(l.totalVentasBrutas || 0), 0);
  const totalComisiones = liquidaciones.reduce((acc, l) => acc + Number(l.valorComisionPrisma || 0), 0);
  const totalNeto = totalVentas - totalComisiones;

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-prisma-text-primary flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-prisma-teal" />
            Liquidaciones y Facturación de Ventas
          </h1>
          <p className="text-xs text-prisma-text-secondary mt-1">
            Cortes de ventas consolidadas en tiendas de barrio y liquidación neta periódica.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards de Finanzas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-prisma-border shadow-sm">
          <p className="text-xs text-prisma-text-secondary font-medium">Ventas Brutas Acumuladas</p>
          <p className="text-2xl font-bold text-prisma-text-primary mt-1">
            ${totalVentas.toLocaleString('es-CO')}
          </p>
          <p className="text-[10px] text-gray-400 mt-1">Suma total de pedidos entregados y cobrados</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-prisma-border shadow-sm">
          <p className="text-xs text-prisma-text-secondary font-medium">Comisión Tecnológica PRISMA ({formatearComision()})</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            ${totalComisiones.toLocaleString('es-CO')}
          </p>
          <p className="text-[10px] text-gray-400 mt-1">Tarifa fija por transacción procesada sin mensualidades</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-prisma-border shadow-sm">
          <p className="text-xs text-prisma-text-secondary font-medium">Saldo Neto a Cobrar</p>
          <p className="text-2xl font-bold text-prisma-teal mt-1">
            ${totalNeto.toLocaleString('es-CO')}
          </p>
          <p className="text-[10px] text-gray-400 mt-1">Liquidación bancaria directa a la cuenta de la empresa</p>
        </div>
      </div>

      {/* Tabla de Liquidaciones */}
      <div className="bg-white rounded-2xl border border-prisma-border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-prisma-border flex justify-between items-center">
          <h2 className="text-sm font-bold text-prisma-text-primary">Historial de Cortes Quincenales</h2>
          <span className="text-[11px] text-prisma-text-secondary font-mono">Regla: Corte cada día 15 y último día del mes</span>
        </div>

        {cargando ? (
          <div className="p-12 text-center text-xs text-prisma-text-secondary">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-prisma-teal" />
            Cargando historial de liquidaciones...
          </div>
        ) : liquidaciones.length === 0 ? (
          <div className="p-12 text-center text-xs text-prisma-text-secondary space-y-2">
            <FileText className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="font-bold text-prisma-text-primary text-sm">No hay cortes de liquidación quincenal generados aún</p>
            <p>Se generarán automáticamente al completar los ciclos de pedidos entregados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-prisma-surface text-prisma-text-secondary border-b border-prisma-border uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4">N° Liquidación</th>
                  <th className="p-4">Periodo Facturado</th>
                  <th className="p-4">Pedidos Entregados</th>
                  <th className="p-4">Venta Bruta</th>
                  <th className="p-4">Comisión PRISMA ({formatearComision()})</th>
                  <th className="p-4">Neto Distribuidor</th>
                  <th className="p-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-prisma-border">
                {liquidaciones.map((liq) => {
                  const venta = Number(liq.totalVentasBrutas || 0);
                  const comision = Number(liq.valorComisionPrisma || 0);
                  const neto = venta - comision;

                  return (
                    <tr key={liq.id} className="hover:bg-gray-50/50">
                      <td className="p-4 font-mono font-bold text-prisma-text-primary">{liq.numeroLiquidacion}</td>
                      <td className="p-4 text-prisma-text-secondary">
                        {liq.periodoInicio} al {liq.periodoFin}
                      </td>
                      <td className="p-4 text-prisma-text-primary font-bold">{liq.totalPedidosEntregados}</td>
                      <td className="p-4 font-bold text-prisma-text-primary">${venta.toLocaleString('es-CO')}</td>
                      <td className="p-4 text-amber-600 font-bold">${comision.toLocaleString('es-CO')}</td>
                      <td className="p-4 text-prisma-teal font-bold">${neto.toLocaleString('es-CO')}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          liq.estado === 'PAGADA'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {liq.estado}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
