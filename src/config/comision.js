// Comisión de la plataforma. Vigente hoy en el backend: 2.5 %. El plan original proponía 3.5 % (N-02, pendiente).
// Se puede sobreescribir en build con VITE_COMISION_PCT sin tocar el código.
export const COMISION_POR_DEFECTO = 2.5;

export const parsearComision = (valor) => {
  const n = Number.parseFloat(String(valor ?? '').replace(',', '.'));
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : COMISION_POR_DEFECTO;
};

export const COMISION_PCT = parsearComision(import.meta.env?.VITE_COMISION_PCT);

export const formatearComision = (pct = COMISION_PCT) =>
  `${Number(pct).toLocaleString('en-US', { maximumFractionDigits: 2 })}%`;

export const calcularSplit = (monto, pct = COMISION_PCT) => {
  const total = Number(monto) || 0;
  const comision = Math.round(total * pct) / 100;
  return { comision, proveedor: Math.round((total - comision) * 100) / 100 };
};
