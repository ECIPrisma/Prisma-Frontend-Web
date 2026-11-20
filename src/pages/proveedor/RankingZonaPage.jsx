import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, BarChart3, Loader2 } from 'lucide-react';
import { proveedorService } from '../../services/api';

// Periodos ofrecidos; el backend acepta de 1 a 365 días.
const PERIODOS = [
  { dias: 7, etiqueta: '7 días' },
  { dias: 30, etiqueta: '30 días' },
  { dias: 90, etiqueta: '90 días' },
];

const MENSAJE_SIN_DATOS = 'Aún no hay suficientes datos para generar este reporte';

// HU-15 – Ranking de productos por zona: unidades entregadas por producto en cada zona.
export const RankingZonaPage = () => {
  const [dias, setDias] = useState(30);
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async (periodo) => {
    setCargando(true);
    setError(null);
    try {
      const respuesta = await proveedorService.getRankingPorZona(periodo);
      setDatos(respuesta);
    } catch (err) {
      setDatos(null);
      setError(err.message || 'No se pudo generar el ranking');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar(dias);
  }, [dias, cargar]);

  const hayDatos = Boolean(datos?.hayDatos) && Array.isArray(datos?.zonas) && datos.zonas.length > 0;

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-prisma-text-primary flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-prisma-teal" />
            Ranking de productos por zona
          </h1>
          <p className="text-xs text-prisma-text-secondary mt-1">
            Unidades entregadas por producto en cada zona. Identifica tus productos más fuertes y las zonas de mayor oportunidad.
          </p>
        </div>

        <div className="flex items-center gap-2" role="group" aria-label="Periodo del ranking">
          {PERIODOS.map((p) => (
            <button
              key={p.dias}
              type="button"
              onClick={() => setDias(p.dias)}
              aria-pressed={dias === p.dias}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                dias === p.dias
                  ? 'bg-prisma-teal text-white border-prisma-teal'
                  : 'bg-white text-prisma-text-secondary border-prisma-border hover:bg-gray-100'
              }`}
            >
              {p.etiqueta}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {cargando && (
        <div className="flex items-center gap-2 text-sm text-prisma-text-secondary" role="status">
          <Loader2 className="w-4 h-4 animate-spin" />
          Generando ranking...
        </div>
      )}

      {!cargando && !error && !hayDatos && (
        <div className="bg-white border border-prisma-border rounded-2xl p-8 text-center text-sm text-prisma-text-secondary">
          {datos?.mensaje || MENSAJE_SIN_DATOS}
        </div>
      )}

      {!cargando && hayDatos && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {datos.zonas.map((zona) => (
            <section
              key={zona.zona}
              aria-label={`Zona ${zona.zona}`}
              className="bg-white p-5 rounded-2xl border border-prisma-border shadow-sm"
            >
              <header className="flex justify-between items-baseline mb-3">
                <h2 className="text-sm font-bold text-prisma-text-primary">{zona.zona}</h2>
                <span className="text-xs text-prisma-text-secondary">
                  {Number(zona.unidadesTotales).toLocaleString('es-CO')} unidades
                </span>
              </header>
              <ol className="space-y-2">
                {zona.productos.map((prod) => (
                  <li
                    key={`${zona.zona}-${prod.productoId ?? prod.nombre}`}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-gray-100 text-xs font-bold flex items-center justify-center">
                        {prod.posicion}
                      </span>
                      {prod.nombre}
                    </span>
                    <span className="font-semibold text-prisma-text-primary">
                      {Number(prod.unidades).toLocaleString('es-CO')}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
