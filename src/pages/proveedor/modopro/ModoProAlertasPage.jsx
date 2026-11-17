import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../../services/api';
import { AlertTriangle, ArrowUpRight } from 'lucide-react';
import { EncabezadoModoPro, Cargando, EstadoVacio } from './ModoProComun';

/**
 * N-11 + HU-16 – /modo-pro/alertas: brechas de penetración territorial ("desabastecimiento artificial").
 */
export const ModoProAlertasPage = () => {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    analyticsService.getModoProAlertas(1).then(setDatos).finally(() => setCargando(false));
  }, []);

  const alertas = datos?.alertas || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <EncabezadoModoPro
        icono={AlertTriangle}
        titulo="Alertas de Penetración Territorial"
        descripcion="Productos que se venden muy bien en una zona pero casi nada en otra de comportamiento similar."
        demostracion={datos?.demostracion}
      />

      {cargando ? (
        <Cargando texto="Analizando zonas comparables..." />
      ) : !datos?.suficientes_datos ? (
        <EstadoVacio texto={datos?.mensaje || 'Aún no hay suficientes datos'}
          detalle="Se necesitan ventas en al menos dos zonas para comparar su comportamiento." />
      ) : alertas.length === 0 ? (
        <EstadoVacio texto="Sin brechas de penetración"
          detalle="Las ventas de tus productos son homogéneas entre zonas comparables." />
      ) : (
        <div className="space-y-4">
          {alertas.map((a) => (
            <div key={`${a.producto_id}-${a.zona_rezagada}`} className="bg-white rounded-2xl border border-prisma-border shadow-sm p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-prisma-text-primary">{a.nombre_producto}</h2>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-800">Desabastecimiento artificial</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-[10px] uppercase font-semibold text-emerald-700">Superventas en</span>
                  <p className="font-bold text-emerald-900">Zona {a.zona_lider} · {a.unidades_zona_lider} uds</p>
                </div>
                <div className="p-3 bg-red-50 rounded-xl border border-red-200">
                  <span className="text-[10px] uppercase font-semibold text-red-700">Rezagada</span>
                  <p className="font-bold text-red-900">Zona {a.zona_rezagada} · {a.unidades_zona_rezagada} uds</p>
                </div>
              </div>
              <p className="text-xs text-prisma-text-secondary">{a.mensaje}</p>
              <p className="text-xs font-semibold text-prisma-teal flex items-start gap-1.5">
                <ArrowUpRight className="w-4 h-4 flex-shrink-0" />
                {a.prescripcion}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
