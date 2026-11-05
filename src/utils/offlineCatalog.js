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

export function loadCatalogFromOfflineCache() {
  try {
    const raw = localStorage.getItem(CATALOG_CACHE_KEY);
    if (!raw) {
      return { items: [], hasCache: false, message: OFFLINE_EMPTY_MESSAGE };
    }
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.items) || parsed.items.length === 0) {
      return { items: [], hasCache: false, message: OFFLINE_EMPTY_MESSAGE };
    }
    return { items: parsed.items, hasCache: true, message: null };
  } catch {
    return { items: [], hasCache: false, message: OFFLINE_EMPTY_MESSAGE };
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
