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

// MVP: suscripción Prisma Pro del distribuidor
export const MENSAJE_PAGO_RECHAZADO = 'El pago no pudo ser procesado, intenta con otro medio';

export const ESTADO_SUSCRIPCION = {
  ACTIVA: { texto: 'Activa', clase: 'bg-emerald-100 text-emerald-800' },
  VENCIDA: { texto: 'Vencida', clase: 'bg-red-100 text-red-800' },
  SIN_SUSCRIPCION: { texto: 'Sin suscripción', clase: 'bg-slate-200 text-slate-700' },
};

export const ESTADO_PAGO_SUSCRIPCION = {
  APROBADO: { texto: 'Aprobado', clase: 'bg-emerald-100 text-emerald-800' },
  RECHAZADO: { texto: 'Rechazado', clase: 'bg-red-100 text-red-800' },
  PENDIENTE: { texto: 'Pendiente', clase: 'bg-amber-100 text-amber-800' },
};

// Datos de prueba de la pasarela simulada (sandbox tipo Wompi). No mueven dinero real.
export const DATOS_PRUEBA = {
  NEQUI: { aprueba: '3991111111', rechaza: '3992222222', caida: '3993333333' },
  PSE: { aprueba: 'Banco que aprueba', rechaza: 'Banco que rechaza' },
  TARJETA: { aprueba: '4242 4242 4242 4242', rechaza: '4111 1111 1111 1111' },
};

export const BANCOS_PSE = [...BANCOS_COLOMBIA, 'Banco que aprueba', 'Banco que rechaza'];

// N-08: estado de los pagos en línea de los tenderos
export const ETIQUETA_ESTADO_PAGO = {
  EN_GARANTIA: { texto: 'En garantía', clase: 'bg-amber-100 text-amber-800' },
  LIBERADO: { texto: 'Liberado', clase: 'bg-emerald-100 text-emerald-800' },
  RECHAZADO: { texto: 'Rechazado', clase: 'bg-red-100 text-red-800' },
  // Pedido pagado que se canceló o rechazó antes de la entrega: el dinero volvió al tendero
  REEMBOLSADO: { texto: 'Reembolsado', clase: 'bg-slate-200 text-slate-700' },
};
