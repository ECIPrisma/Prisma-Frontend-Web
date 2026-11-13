// HU-12: mensaje del criterio de aceptación cuando la vinculación de la cuenta de cobro no se completa
export const MENSAJE_VINCULACION_FALLIDA = 'No se pudo vincular tu cuenta de cobro, intenta nuevamente';

// Bancos que ofrece el formulario de vinculación (pasarela simulada)
export const BANCOS_COLOMBIA = [
  'Bancolombia',
  'Banco de Bogotá',
  'Davivienda',
  'BBVA Colombia',
  'Banco de Occidente',
  'Banco Popular',
  'Banco Caja Social',
  'Banco AV Villas',
  'Nu Colombia',
];

// N-08: estado de los pagos en línea de los tenderos
export const ETIQUETA_ESTADO_PAGO = {
  EN_GARANTIA: { texto: 'En garantía', clase: 'bg-amber-100 text-amber-800' },
  LIBERADO: { texto: 'Liberado', clase: 'bg-emerald-100 text-emerald-800' },
  RECHAZADO: { texto: 'Rechazado', clase: 'bg-red-100 text-red-800' },
  // Pedido pagado que se canceló o rechazó antes de la entrega: el dinero volvió al tendero
  REEMBOLSADO: { texto: 'Reembolsado', clase: 'bg-slate-200 text-slate-700' },
};
