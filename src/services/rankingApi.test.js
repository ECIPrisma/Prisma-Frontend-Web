import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { proveedorService } from './api';

const respuesta = (cuerpo, ok = true, status = 200) => ({
  ok,
  status,
  json: () => Promise.resolve(cuerpo),
});

describe('proveedorService.getRankingPorZona (HU-15)', () => {
  beforeEach(() => {
    localStorage.setItem('prisma_user', JSON.stringify({ token: 'tok-123' }));
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('consulta /proveedores/modo-pro/ranking con el periodo y el token, y devuelve solo "datos"', async () => {
    fetch.mockResolvedValue(respuesta({ exitoso: true, datos: { hayDatos: true, zonas: [] } }));

    const datos = await proveedorService.getRankingPorZona(7);

    const [url, opciones] = fetch.mock.calls[0];
    expect(url).toMatch(/\/proveedores\/modo-pro\/ranking\?dias=7$/);
    expect(opciones.headers.Authorization).toBe('Bearer tok-123');
    expect(datos).toEqual({ hayDatos: true, zonas: [] });
  });

  it('sin periodo no agrega parámetro (el backend usa 30 días)', async () => {
    fetch.mockResolvedValue(respuesta({ datos: {} }));

    await proveedorService.getRankingPorZona();

    expect(fetch.mock.calls[0][0]).toMatch(/\/modo-pro\/ranking$/);
  });

  it('un 403 lanza el mensaje del backend', async () => {
    fetch.mockResolvedValue(respuesta({ exitoso: false, mensaje: 'Acceso denegado' }, false, 403));

    await expect(proveedorService.getRankingPorZona(30)).rejects.toThrow('Acceso denegado');
  });
});
