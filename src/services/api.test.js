import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authService, analyticsService } from './api';

const response = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: vi.fn().mockResolvedValue(body),
});

describe('authService TOTP', () => {
  beforeEach(() => {
    localStorage.setItem('prisma_user', JSON.stringify({ token: 'jwt-de-prueba' }));
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('consulta el estado enviando el token Bearer y desempaqueta el envelope', async () => {
    fetch.mockResolvedValueOnce(response(200, {
      exitoso: true,
      mensaje: 'OK',
      datos: { enabled: true },
    }));

    await expect(authService.getTotpStatus()).resolves.toEqual({ enabled: true });
    expect(fetch).toHaveBeenCalledWith('/api/v1/auth/totp/status', {
      headers: expect.objectContaining({ Authorization: 'Bearer jwt-de-prueba' }),
    });
  });

  it('envía setup, enable y disable a las rutas especificadas con Bearer', async () => {
    fetch
      .mockResolvedValueOnce(response(200, { datos: { secret: 'TEMPORAL', otpauthUri: 'otpauth://totp/test' } }))
      .mockResolvedValueOnce(response(200, { datos: { enabled: true } }))
      .mockResolvedValueOnce(response(200, { datos: { enabled: false } }));

    await authService.setupTotp();
    await authService.enableTotp('123456');
    await authService.disableTotp('clave-temporal', '654321');

    expect(fetch).toHaveBeenNthCalledWith(1, '/api/v1/auth/totp/setup', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ Authorization: 'Bearer jwt-de-prueba' }),
    }));
    expect(fetch).toHaveBeenNthCalledWith(2, '/api/v1/auth/totp/enable', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ codigo: '123456' }),
    }));
    expect(fetch).toHaveBeenNthCalledWith(3, '/api/v1/auth/totp', expect.objectContaining({
      method: 'DELETE',
      body: JSON.stringify({ password: 'clave-temporal', codigo: '654321' }),
      headers: expect.objectContaining({ Authorization: 'Bearer jwt-de-prueba' }),
    }));
  });

  it('no trata el 401 del reto TOTP de login como una sesión expirada', async () => {
    fetch.mockResolvedValueOnce(response(401, { mensaje: 'Se requiere un código TOTP de 6 dígitos.' }));
    const unauthorized = vi.fn();
    window.addEventListener('prisma:unauthorized', unauthorized);

    await expect(authService.login('usuario@example.com', 'clave'))
      .rejects.toThrow('Se requiere un código TOTP de 6 dígitos.');
    expect(unauthorized).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledWith('/api/v1/auth/login', expect.objectContaining({
      body: JSON.stringify({ email: 'usuario@example.com', password: 'clave' }),
    }));
    window.removeEventListener('prisma:unauthorized', unauthorized);
  });

  it('incluye codigoTotp en el login cuando se proporciona', async () => {
    fetch.mockResolvedValueOnce(response(200, { datos: { token: 'jwt', email: 'usuario@example.com' } }));

    await authService.login('usuario@example.com', 'clave', '123456');

    expect(fetch).toHaveBeenCalledWith('/api/v1/auth/login', expect.objectContaining({
      body: JSON.stringify({ email: 'usuario@example.com', password: 'clave', codigoTotp: '123456' }),
    }));
  });
});

describe('analyticsService (Modo Pro e IA Prescriptiva)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('retorna mock fallback si el microservicio de analitica no responde', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    const health = await analyticsService.getHealth();
    expect(health.status).toBe('UP');
    expect(health.within_memory_budget).toBe(true);
    expect(health.memory_limit_mb).toBe(300.0);
  });

  it('retorna prescripcion de descuentos con elasticidad en mock fallback', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    const prescripcion = await analyticsService.getPrescripcionDescuentos(10, 'Norte');
    expect(prescripcion.zona).toBe('Norte');
    expect(prescripcion.coeficiente_elasticidad).toBeLessThan(0);
    expect(prescripcion.tipo_demanda).toBe('Elástica');
    expect(prescripcion.escalas_prescritas.length).toBeGreaterThan(0);
  });

  it('retorna prescripcion de empaques sugeridos por mineria FP-Growth en mock fallback', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    const empaques = await analyticsService.getPrescripcionEmpaques(1);
    expect(empaques.proveedor_id).toBe(1);
    expect(empaques.formatos_empaque_prescritos.length).toBeGreaterThan(0);
    expect(empaques.formatos_empaque_prescritos[0].afinidad_lift).toBeGreaterThan(1.0);
  });
});
