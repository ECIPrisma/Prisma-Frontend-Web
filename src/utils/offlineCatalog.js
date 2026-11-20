const CATALOG_CACHE_KEY = 'prisma_offline_catalog_v1';
const OFFLINE_QUEUE_KEY = 'prisma_offline_orders_queue_v1';

export const OFFLINE_EMPTY_MESSAGE = 'No hay datos disponibles sin conexión, intenta cuando recuperes señal';

export function saveCatalogToOfflineCache(productos) {
  if (!Array.isArray(productos)) return;
  try {
    localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify({
      updatedAt: new Date().toISOString(),
      items: productos,
    }));
  } catch {
    // Storage quota or unavailable
  }
}

export const DEFAULT_OFFLINE_PRODUCTS = [
  {
    id: 1,
    sku: 'BEV-CC-15L',
    nombre: 'Coca-Cola 1.5L Retornable',
    descripcion: 'Gaseosa sabor original en envase retornable eco-amigable. Paca x 12 unidades.',
    presentacion: 'Paca x 12 Und',
    precioUnitario: 27000,
    precioSugeridoPublico: 32000,
    disponibilidad: 'DISPONIBLE',
    estado: 'ACTIVO',
    esPromocion: false,
    imagenUrl: '/products/real_coca_15l.jpg',
    categoriaNombre: 'Gaseosas',
    stock: 145
  },
  {
    id: 2,
    sku: 'BEV-QT-400',
    nombre: 'Quatro Toronja 400ml PET',
    descripcion: 'Gaseosa sabor toronja presentación personal PET. Paca x 12 unidades.',
    presentacion: 'Paca x 12 Und',
    precioUnitario: 28000,
    precioSugeridoPublico: 34000,
    disponibilidad: 'DISPONIBLE',
    estado: 'ACTIVO',
    esPromocion: false,
    imagenUrl: '/products/real_sprite.jpg',
    categoriaNombre: 'Gaseosas',
    stock: 82
  },
  {
    id: 3,
    sku: 'BEV-MN-473',
    nombre: 'Monster Energy Drink 473ml',
    descripcion: 'Bebida energizante sabor original en lata. Bandeja x 12 latas.',
    presentacion: 'Bandeja x 12 Latas',
    precioUnitario: 86000,
    precioSugeridoPublico: 108000,
    disponibilidad: 'DISPONIBLE',
    estado: 'PROMOCION',
    esPromocion: true,
    imagenUrl: '/products/real_monster.jpg',
    categoriaNombre: 'Energizantes',
    stock: 64
  },
  {
    id: 4,
    sku: 'BEV-CC-3L',
    nombre: 'Coca-Cola 3 Litros PET',
    descripcion: 'Gaseosa familiar tamaño gigante 3L. Paca x 6 unidades.',
    presentacion: 'Paca x 6 Und',
    precioUnitario: 42000,
    precioSugeridoPublico: 49000,
    disponibilidad: 'DISPONIBLE',
    estado: 'ACTIVO',
    esPromocion: false,
    imagenUrl: '/products/real_coca_3l.jpg',
    categoriaNombre: 'Gaseosas',
    stock: 110
  },
  {
    id: 5,
    sku: 'BEV-BR-600',
    nombre: 'Agua Brisa con Gas 600ml',
    descripcion: 'Agua purificada mineralizada con gas. Paca x 24 botellas.',
    presentacion: 'Paca x 24 Und',
    precioUnitario: 18000,
    precioSugeridoPublico: 22500,
    disponibilidad: 'DISPONIBLE',
    estado: 'ACTIVO',
    esPromocion: false,
    imagenUrl: '/products/real_agua_brisa.jpg',
    categoriaNombre: 'Aguas',
    stock: 200
  },
  {
    id: 6,
    sku: 'BEV-PZ-400',
    nombre: 'Manzana Postobón 400ml PET',
    descripcion: 'Gaseosa sabor manzana tradicional. Paca x 12 botellas.',
    presentacion: 'Paca x 12 Und',
    precioUnitario: 26500,
    precioSugeridoPublico: 32000,
    disponibilidad: 'DISPONIBLE',
    estado: 'ACTIVO',
    esPromocion: false,
    imagenUrl: '/products/real_postobon_manzana.jpg',
    categoriaNombre: 'Gaseosas',
    stock: 95
  }
];

export function loadCatalogFromOfflineCache() {
  try {
    const raw = localStorage.getItem(CATALOG_CACHE_KEY);
    if (!raw) {
      return { items: DEFAULT_OFFLINE_PRODUCTS, hasCache: true, message: null };
    }
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.items) || parsed.items.length === 0) {
      return { items: DEFAULT_OFFLINE_PRODUCTS, hasCache: true, message: null };
    }
    return { items: parsed.items, hasCache: true, message: null };
  } catch {
    return { items: DEFAULT_OFFLINE_PRODUCTS, hasCache: true, message: null };
  }
}

export function enqueueOfflineOrder(orderPayload, idempotencyKey) {
  const key = idempotencyKey || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `idem-${Date.now()}`);
  const entry = {
    ...orderPayload,
    idempotencyKey: key,
    queuedAt: new Date().toISOString(),
  };
  try {
    const existingRaw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    const queue = existingRaw ? JSON.parse(existingRaw) : [];
    const deduplicated = queue.filter((item) => item.idempotencyKey !== key);
    deduplicated.push(entry);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(deduplicated));
  } catch {
    // Ignore storage error
  }
  return entry;
}

export function getOfflineOrderQueue() {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearOfflineOrderQueue() {
  try {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  } catch {
    // Ignore
  }
}
