import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../../services/api';
import { Award } from 'lucide-react';
import { EncabezadoModoPro, Cargando, EstadoVacio } from './ModoProComun';
import { useProveedorId } from '../../../hooks/useProveedorId';
import { formatCOP } from '../../../utils/formatters';

const ZONAS = ['Norte', 'Centro', 'Sur', 'Occidente'];

/**
 * N-11 – /modo-pro/ranking: productos del proveedor ordenados por ingresos, con su participación y zonas.
 */
export const ModoProRankingPage = () => {
  const [zona, setZona] = useState('');
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const proveedorId = useProveedorId();

  // El indicador de carga se activa al cambiar la zona (no dentro del efecto)
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <EncabezadoModoPro
        icono={Award}
        titulo="Ranking de Productos"
        descripcion="Tus productos ordenados por ingresos en las tiendas de barrio, con su participación y cobertura por zona."
        demostracion={datos?.demostracion}
      />

      <div className="flex items-center gap-2">
        <label htmlFor="ranking-zona" className="text-xs font-bold text-prisma-text-primary">Zona</label>
        <select id="ranking-zona" value={zona} onChange={cambiarZona}
          className="text-xs p-2 border border-prisma-border rounded-xl bg-white focus:ring-2 focus:ring-prisma-teal focus:outline-none">
          <option value="">Todas las zonas</option>
          {ZONAS.map((z) => <option key={z} value={z}>{z}</option>)}
        </select>
      </div>

      {cargando ? (
        <Cargando texto="Calculando ranking..." />
      ) : productos.length === 0 ? (
        <EstadoVacio texto={datos?.mensaje || 'Aún no hay suficientes datos'}
          detalle="El ranking aparecerá cuando haya ventas registradas para esta selección." />
      ) : (
        <div className="bg-white rounded-2xl border border-prisma-border shadow-sm overflow-hidden">
          <div className="p-5 flex justify-between items-center">
            <h2 className="text-sm font-bold text-prisma-text-primary">{zona ? `Zona ${zona}` : 'Todas las zonas'}</h2>
            <span className="text-xs text-prisma-text-secondary">Ingresos totales: <strong>{formatCOP(datos.total_ingresos)}</strong></span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-prisma-surface text-prisma-text-secondary border-b border-prisma-border uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4">#</th>
                  <th className="p-4">Producto</th>
                  <th className="p-4">Unidades</th>
                  <th className="p-4">Ingresos</th>
                  <th className="p-4">Participación</th>
                  <th className="p-4">Zonas con ventas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-prisma-border">
                {productos.map((p) => (
                  <tr key={p.producto_id} className="hover:bg-gray-50/50">
                    <td className="p-4 font-bold text-prisma-teal">{p.posicion}</td>
                    <td className="p-4">
                      <p className="font-bold text-prisma-text-primary">{p.nombre_producto}</p>
                      <p className="text-[10px] text-gray-400">{p.categoria}</p>
                    </td>
                    <td className="p-4 text-prisma-text-primary">{Number(p.unidades).toLocaleString('es-CO')}</td>
                    <td className="p-4 font-bold text-prisma-text-primary">{formatCOP(p.ingresos)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-prisma-surface rounded-full overflow-hidden">
                          <div className="h-2 bg-prisma-teal" style={{ width: `${Math.min(100, p.participacion_pct)}%` }} />
                        </div>
                        <span className="text-prisma-text-secondary">{p.participacion_pct}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-prisma-text-secondary">{(p.zonas_con_ventas || []).join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
