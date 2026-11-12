const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || API_BASE_URL;

const getAuthHeaders = () => {
  let user = {};
  try {
    user = JSON.parse(localStorage.getItem('prisma_user') || '{}');
  } catch {
    user = {};
  }
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  if (user?.token) {
    headers['Authorization'] = `Bearer ${user.token}`;
  }
  return headers;
};

const handleResponse = async (response, { dispatchUnauthorized = true } = {}) => {
  if (!response.ok) {
    if (dispatchUnauthorized && response.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('prisma:unauthorized'));
    }
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.mensaje || errorData.error || `Error HTTP ${response.status}`;
    throw new Error(message);
  }
  const result = await response.json();
  return result.datos !== undefined ? result.datos : result;
};

// HU-03: renovación en curso compartida para no disparar varios /auth/refresh a la vez
let refreshEnCurso = null;

export const authService = {
  login: async (email, password, codigoTotp) => {
    const body = { email, password };
    if (codigoTotp) body.codigoTotp = codigoTotp;
    const res = await fetch(`${AUTH_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    return handleResponse(res, { dispatchUnauthorized: false });
  },

  // El refresh token viaja en una cookie HttpOnly, por eso no se envía Authorization
  refresh: () => {
    if (!refreshEnCurso) {
      refreshEnCurso = fetch(`${AUTH_API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        credentials: 'include',
      })
        .then((res) => {
          if (res.status === 401) {
            const error = new Error('Sesión expirada. Inicie sesión nuevamente.');
            error.status = 401;
            throw error;
          }
          return handleResponse(res);
        })
        .finally(() => {
          refreshEnCurso = null;
        });
    }
    return refreshEnCurso;
  },

  logout: async () => {
    const res = await fetch(`${AUTH_API_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      credentials: 'include',
    });
    return handleResponse(res);
  },

  register: async (userData) => {
    const res = await fetch(`${AUTH_API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleResponse(res);
  },

  validateToken: async (token) => {
    const res = await fetch(`${AUTH_API_URL}/auth/validate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    return handleResponse(res);
  },

  getMe: async () => {
    const res = await fetch(`${AUTH_API_URL}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  getTotpStatus: async () => {
    const res = await fetch(`${AUTH_API_URL}/auth/totp/status`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  setupTotp: async () => {
    const res = await fetch(`${AUTH_API_URL}/auth/totp/setup`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  enableTotp: async (codigo) => {
    const res = await fetch(`${AUTH_API_URL}/auth/totp/enable`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ codigo }),
    });
    return handleResponse(res);
  },

  disableTotp: async (password, codigo) => {
    const res = await fetch(`${AUTH_API_URL}/auth/totp`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ password, codigo }),
    });
    return handleResponse(res);
  },
};

export const adminService = {
  getProveedores: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/proveedores`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  crearProveedor: async (datos) => {
    const res = await fetch(`${API_BASE_URL}/admin/proveedores`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(datos),
    });
    return handleResponse(res);
  },

  actualizarProveedor: async (id, datos) => {
    const res = await fetch(`${API_BASE_URL}/admin/proveedores/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(datos),
    });
    return handleResponse(res);
  },

  eliminarProveedor: async (id) => {
    const res = await fetch(`${API_BASE_URL}/admin/proveedores/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  cambiarEstadoProveedor: async (id, estado) => {
    const res = await fetch(`${API_BASE_URL}/admin/proveedores/${id}/estado`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ estado }),
    });
    return handleResponse(res);
  },

  getDisputas: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/disputas`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  overridePin: async (pedidoId, justificacion) => {
    const res = await fetch(`${API_BASE_URL}/admin/pedidos/${pedidoId}/override-pin`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ justificacion }),
    });
    return handleResponse(res);
  },

  getConfiguraciones: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/configuraciones`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  updateConfiguracion: async (clave, valor) => {
    const res = await fetch(`${API_BASE_URL}/admin/configuraciones/${clave}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ valor }),
    });
    return handleResponse(res);
  },

  getAuditoria: async (pagina = 0, tamano = 20) => {
    const res = await fetch(`${API_BASE_URL}/admin/auditoria?pagina=${pagina}&tamano=${tamano}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  getPedidos: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/pedidos`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  soporteCancelarPedido: async (pedidoId, motivo) => {
    const res = await fetch(`${API_BASE_URL}/admin/pedidos/${pedidoId}/soporte-cancelar`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ motivo }),
    });
    return handleResponse(res);
  },

  reprogramarPedido: async (pedidoId, nuevaFecha, motivo) => {
    const res = await fetch(`${API_BASE_URL}/admin/pedidos/${pedidoId}/reprogramar`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ nuevaFecha, motivo }),
    });
    return handleResponse(res);
  },

  getCarteraEmpresas: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/cartera-empresas`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  getTiendasProveedorAdmin: async (proveedorId) => {
    const res = await fetch(`${API_BASE_URL}/admin/proveedores/${proveedorId}/tiendas`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  auxilioRutaSoporte: async (rutaId, accion, notas) => {
    const res = await fetch(`${API_BASE_URL}/admin/rutas/${rutaId}/auxilio-soporte`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ accion, notas }),
    });
    return handleResponse(res);
  },

  responderDisputa: async (id, resolucion, nuevoEstado = 'RESUELTO') => {
    const res = await fetch(`${API_BASE_URL}/admin/disputas/${id}/responder`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ resolucion, nuevoEstado }),
    });
    return handleResponse(res);
  },

  getUsuariosAdmin: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/usuarios`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  resetTotpUsuario: async (id) => {
    const res = await fetch(`${API_BASE_URL}/admin/usuarios/${id}/reset-totp`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
};

export const proveedorService = {
  getMisProductos: async () => {
    const res = await fetch(`${API_BASE_URL}/proveedores/mis-productos`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  crearProducto: async (datos) => {
    const res = await fetch(`${API_BASE_URL}/proveedores/productos`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(datos),
    });
    return handleResponse(res);
  },

  actualizarProducto: async (id, datos) => {
    const res = await fetch(`${API_BASE_URL}/proveedores/productos/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(datos),
    });
    return handleResponse(res);
  },

  eliminarProducto: async (id) => {
    const res = await fetch(`${API_BASE_URL}/proveedores/productos/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  getPedidosNuevos: async () => {
    const res = await fetch(`${API_BASE_URL}/proveedores/pedidos/nuevos`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  cambiarEstadoPedido: async (pedidoId, estado) => {
    const res = await fetch(`${API_BASE_URL}/proveedores/pedidos/${pedidoId}/cambiar-estado`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ estado }),
    });
    return handleResponse(res);
  },

  reportarProblemaPedido: async (pedidoId, motivo, detalle, accion) => {
    const res = await fetch(`${API_BASE_URL}/proveedores/pedidos/${pedidoId}/reportar-problema`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ motivo, detalle, accion }),
    });
    return handleResponse(res);
  },

  reprogramarPedido: async (pedidoId, nuevaFecha, motivo) => {
    const res = await fetch(`${API_BASE_URL}/proveedores/pedidos/${pedidoId}/reprogramar`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ nuevaFecha, motivo }),
    });
    return handleResponse(res);
  },

  getCamiones: async () => {
    const res = await fetch(`${API_BASE_URL}/proveedores/camiones`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  crearCamion: async (datos) => {
    const res = await fetch(`${API_BASE_URL}/proveedores/camiones`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(datos),
    });
    return handleResponse(res);
  },

  actualizarCamion: async (id, datos) => {
    const res = await fetch(`${API_BASE_URL}/proveedores/camiones/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(datos),
    });
    return handleResponse(res);
  },

  eliminarCamion: async (id) => {
    const res = await fetch(`${API_BASE_URL}/proveedores/camiones/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  getRepartidores: async () => {
    const res = await fetch(`${API_BASE_URL}/proveedores/repartidores`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  crearRepartidor: async (datos) => {
    const res = await fetch(`${API_BASE_URL}/proveedores/repartidores`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(datos),
    });
    return handleResponse(res);
  },

  getLiquidaciones: async () => {
    const res = await fetch(`${API_BASE_URL}/proveedores/liquidaciones`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  getRutasProgreso: async () => {
    const res = await fetch(`${API_BASE_URL}/proveedores/rutas/progreso`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  getTiendasClientes: async () => {
    const res = await fetch(`${API_BASE_URL}/proveedores/tiendas`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  crearTiendaCliente: async (datos) => {
    const res = await fetch(`${API_BASE_URL}/proveedores/tiendas`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(datos),
    });
    return handleResponse(res);
  },

  actualizarTiendaCliente: async (id, datos) => {
    const res = await fetch(`${API_BASE_URL}/proveedores/tiendas/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(datos),
    });
    return handleResponse(res);
  },

  eliminarTiendaCliente: async (id) => {
    const res = await fetch(`${API_BASE_URL}/proveedores/tiendas/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  getAnalisisVentasTienda: async (tiendaId) => {
    const res = await fetch(`${API_BASE_URL}/proveedores/tiendas/${tiendaId}/analisis-ventas`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  getEstadisticasEconomicas: async () => {
    const res = await fetch(`${API_BASE_URL}/proveedores/estadisticas-economicas`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  reportarVarado: async (rutaId, accion = 'VARADO', motivo = 'Problema mecánico o percance en ruta') => {
    const res = await fetch(`${API_BASE_URL}/proveedores/rutas/${rutaId}/reportar-varado`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ accion, motivo }),
    });
    return handleResponse(res);
  },

  getMisPqrs: async () => {
    const res = await fetch(`${API_BASE_URL}/proveedores/pqrs`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  responderPqrs: async (disputaId, resolucion, nuevoEstado = 'RESUELTO') => {
    const res = await fetch(`${API_BASE_URL}/proveedores/pqrs/${disputaId}/responder`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ resolucion, nuevoEstado }),
    });
    return handleResponse(res);
  },

  radicarDisputaPrisma: async (tipoIncidente, descripcion, pedidoId = null) => {
    const res = await fetch(`${API_BASE_URL}/proveedores/pqrs/radicar-a-prisma`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ tipoIncidente, descripcion, pedidoId }),
    });
    return handleResponse(res);
  },

  // HU-04: perfil comercial propio (el backend resuelve el proveedor desde el JWT)
  getPerfil: async () => {
    const res = await fetch(`${API_BASE_URL}/proveedores/perfil`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  actualizarPerfil: async (datos) => {
    const res = await fetch(`${API_BASE_URL}/proveedores/perfil`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(datos),
    });
    return handleResponse(res);
  },
};

export const tiendaService = {
  getMiTienda: async () => {
    const res = await fetch(`${API_BASE_URL}/tiendas/mi-tienda`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  getCatalogo: async (proveedorId) => {
    const res = await fetch(`${API_BASE_URL}/tiendas/catalogo/${proveedorId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  getMisPedidos: async () => {
    const res = await fetch(`${API_BASE_URL}/tiendas/mis-pedidos`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
};

export const repartidorService = {
  getRutasHoy: async () => {
    const res = await fetch(`${API_BASE_URL}/repartidores/mis-rutas/hoy`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  getPedidosRuta: async (rutaId) => {
    const res = await fetch(`${API_BASE_URL}/repartidores/rutas/${rutaId}/pedidos`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  confirmarEntrega: async (pedidoId, pin, medioPago, notasEntrega) => {
    const res = await fetch(`${API_BASE_URL}/repartidores/pedidos/${pedidoId}/confirmar-entrega`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ pin, medioPago, notasEntrega }),
    });
    return handleResponse(res);
  },
};
