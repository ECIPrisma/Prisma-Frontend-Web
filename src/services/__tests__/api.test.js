import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { authService, adminService, EVENTO_SESION_EXPIRADA } from '../api';

const respuesta = (status, cuerpo) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => {
    if (cuerpo === undefined) throw new Error('sin cuerpo JSON');
    return cuerpo;
  },
});

const guardarSesion = (token = 'jwt-123') =>
  localStorage.setItem('prisma_user', JSON.stringify({ token, rol: 'ROLE_ADMIN' }));

describe('servicio de API', () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('login', () => {
    it('envía email y contraseña por POST y devuelve el contenido de "datos"', async () => {
      fetchMock.mockResolvedValue(respuesta(200, { exitoso: true, datos: { token: 'abc', rol: 'ROLE_ADMIN' } }));

      const datos = await authService.login('a@b.com', 'secreto');

      expect(datos).toEqual({ token: 'abc', rol: 'ROLE_ADMIN' });
      const [url, opciones] = fetchMock.mock.calls[0];
      expect(url).toMatch(/\/auth\/login$/);
      expect(opciones.method).toBe('POST');
      expect(JSON.parse(opciones.body)).toEqual({ email: 'a@b.com', password: 'secreto' });
      expect(opciones.headers.Authorization).toBeUndefined();
    });

    it('si la respuesta no trae "datos" devuelve el cuerpo completo', async () => {
      fetchMock.mockResolvedValue(respuesta(200, { token: 'plano' }));
      expect(await authService.login('a@b.com', 'x')).toEqual({ token: 'plano' });
    });

    it('credenciales inválidas (401): lanza el mensaje del backend y NO toca ninguna sesión', async () => {
      fetchMock.mockResolvedValue(respuesta(401, { exitoso: false, mensaje: 'Credenciales inválidas' }));
      const alExpirar = vi.fn();
      window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar);

      await expect(authService.login('a@b.com', 'mala')).rejects.toThrow('Credenciales inválidas');

      expect(alExpirar).not.toHaveBeenCalled();
      window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
    });

    it('error del servidor sin JSON: mensaje genérico con el código HTTP', async () => {
      fetchMock.mockResolvedValue(respuesta(500, undefined));
      await expect(authService.login('a@b.com', 'x')).rejects.toThrow('Error HTTP 500');
    });

    it('sin conexión: propaga el error de red', async () => {
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
      await expect(authService.login('a@b.com', 'x')).rejects.toThrow('Failed to fetch');
    });
  });

  describe('peticiones autenticadas', () => {
    it('adjuntan el token como Bearer', async () => {
      guardarSesion('jwt-123');
      fetchMock.mockResolvedValue(respuesta(200, { datos: [] }));

      await adminService.getProveedores();

      const [url, opciones] = fetchMock.mock.calls[0];
      expect(url).toMatch(/\/admin\/proveedores$/);
      expect(opciones.headers.Authorization).toBe('Bearer jwt-123');
    });

    it('sin sesión NO envían encabezado Authorization', async () => {
      fetchMock.mockResolvedValue(respuesta(200, { datos: [] }));
      await adminService.getProveedores();
      expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
    });

    it('con la sesión guardada corrupta no revientan: se envían sin token', async () => {
      localStorage.setItem('prisma_user', '{esto no es json');
      fetchMock.mockResolvedValue(respuesta(200, { datos: [] }));

      await expect(adminService.getProveedores()).resolves.toEqual([]);
      expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
    });

    it('usan el método HTTP y el cuerpo correctos (crear = POST con JSON, eliminar = DELETE)', async () => {
      guardarSesion();
      fetchMock.mockResolvedValue(respuesta(200, { datos: { id: 9 } }));

      await adminService.crearProveedor({ nit: '900', razonSocial: 'ACME' });
      await adminService.eliminarProveedor(9);

      const [urlCrear, crear] = fetchMock.mock.calls[0];
      expect(urlCrear).toMatch(/\/admin\/proveedores$/);
      expect(crear.method).toBe('POST');
      expect(JSON.parse(crear.body)).toEqual({ nit: '900', razonSocial: 'ACME' });
      const [urlBorrar, borrar] = fetchMock.mock.calls[1];
      expect(urlBorrar).toMatch(/\/admin\/proveedores\/9$/);
      expect(borrar.method).toBe('DELETE');
    });
  });

  describe('sesión vencida', () => {
    it('401 con sesión guardada: borra la sesión, avisa a la app y lanza el error', async () => {
      guardarSesion();
      fetchMock.mockResolvedValue(respuesta(401, { mensaje: 'Autenticación requerida o token inválido' }));
      const alExpirar = vi.fn();
      window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar);

      await expect(adminService.getProveedores()).rejects.toThrow('Autenticación requerida');

      expect(localStorage.getItem('prisma_user')).toBeNull();
      expect(alExpirar).toHaveBeenCalledTimes(1);
      window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
    });

    it.each([403, 404, 409, 500])('%i NO cierra la sesión (no es un token vencido)', async (codigo) => {
      guardarSesion();
      fetchMock.mockResolvedValue(respuesta(codigo, { mensaje: 'falla' }));
      const alExpirar = vi.fn();
      window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar);

      await expect(adminService.getProveedores()).rejects.toThrow('falla');

      expect(localStorage.getItem('prisma_user')).not.toBeNull();
      expect(alExpirar).not.toHaveBeenCalled();
      window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
    });
  });
});
