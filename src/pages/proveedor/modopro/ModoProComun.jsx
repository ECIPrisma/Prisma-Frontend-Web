import React from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';

// N-11: piezas comunes de las pantallas Modo Pro

export const EncabezadoModoPro = ({ icono: Icono, titulo, descripcion, demostracion }) => (
  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
    <div>
      <h1 className="text-2xl font-bold text-prisma-text-primary flex items-center gap-2">
        <Icono className="w-7 h-7 text-prisma-teal" />
        {titulo}
      </h1>
      <p className="text-xs text-prisma-text-secondary mt-1">{descripcion}</p>
    </div>
    <div className="flex gap-2">
      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-prisma-teal/10 text-prisma-teal">Modo Pro</span>
      {demostracion && (
        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">Datos de demostración</span>
      )}
    </div>
  </div>
);

export const Cargando = ({ texto }) => (
  <div className="p-12 text-center text-xs text-prisma-text-secondary bg-white rounded-2xl border border-prisma-border">
    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-prisma-teal" />
    {texto}
  </div>
);

export const EstadoVacio = ({ texto = 'Aún no hay suficientes datos', detalle }) => (
  <div className="p-12 text-center text-xs text-prisma-text-secondary bg-white rounded-2xl border border-prisma-border space-y-1">
    <AlertCircle className="w-6 h-6 mx-auto mb-2 text-gray-400" />
    <p className="font-bold text-prisma-text-primary">{texto}</p>
    {detalle && <p>{detalle}</p>}
  </div>
);
