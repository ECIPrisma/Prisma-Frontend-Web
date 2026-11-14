import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveCatalogToOfflineCache,
  loadCatalogFromOfflineCache,
  enqueueOfflineOrder,
  getOfflineOrderQueue,
  clearOfflineOrderQueue,
  OFFLINE_EMPTY_MESSAGE,
} from './offlineCatalog';

describe('Offline Catalog & Idempotency Queue (SCRUM-19 / SCRUM-28)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('HU-18 Escenario 2: Muestra mensaje exacto cuando no hay catálogo descargado previamente', () => {
    const result = loadCatalogFromOfflineCache();
    expect(result.hasCache).toBe(false);
    expect(result.items).toEqual([]);
    expect(result.message).toBe('No hay datos disponibles sin conexión, intenta cuando recuperes señal');
    expect(result.message).toBe(OFFLINE_EMPTY_MESSAGE);
  });

  it('HU-18 Escenario 1: Recupera el catálogo almacenado localmente sin conexión', () => {
    const mockProducts = [
      { id: 1, sku: 'KO-400', nombre: 'Coca-Cola 400ml', precioUnitario: 2500, stockDisponible: 25 },
      { id: 2, sku: 'BRI-600', nombre: 'Agua Brisa 600ml', precioUnitario: 1800, stockDisponible: 0 },
    ];
    saveCatalogToOfflineCache(mockProducts);

    const result = loadCatalogFromOfflineCache();
    expect(result.hasCache).toBe(true);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].nombre).toBe('Coca-Cola 400ml');
    expect(result.message).toBeNull();
  });

  it('HU-09: Encola pedidos sin conexión con Idempotency-Key evitando duplicados', () => {
    const idemKey = '550e8400-e29b-41d4-a716-446655440000';
    enqueueOfflineOrder({ proveedorId: 1, items: [{ productoId: 1, cantidad: 6 }] }, idemKey);
    enqueueOfflineOrder({ proveedorId: 1, items: [{ productoId: 1, cantidad: 6 }] }, idemKey);

    const queue = getOfflineOrderQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].idempotencyKey).toBe(idemKey);

    clearOfflineOrderQueue();
    expect(getOfflineOrderQueue()).toHaveLength(0);
  });
});
