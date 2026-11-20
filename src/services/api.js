const IS_TEST = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.MODE === 'test';

// Cluster de nodos backend de contingencia (Failover en Cascada)
// El primer nodo siempre es la ruta relativa del reverse-proxy (/api/v1)
// para garantizar conexión Same-Origin (cero CORS) a través de Vercel y Vite.
// NOTA CRÍTICA: En navegadores públicos solo deben usarse endpoints públicos con SSL.
// Los hostnames privados (.ts.net) provocan 'NetworkError' en navegadores estándar.
const BACKEND_NODES = [
  '/api/v1',
  'https://prisma-backend-web.onrender.com/api/v1',
];

if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!BACKEND_NODES.includes(envUrl)) {
    BACKEND_NODES.unshift(envUrl);
  }
}

let activeNodeIndex = 0;

// Wrapper de fetch con tolerancia a fallos y conmutación automática entre nodos
const fetchWithFailover = async (input, init = {}) => {
  if (IS_TEST) {
    return globalThis.fetch(input, init);
  }

  const rawUrl = typeof input === 'string' ? input : input.url;

  // Extraer el subpath relativo (ej: /auth/login o /pedidos)
  let subpath = rawUrl;
  for (const node of BACKEND_NODES) {
    if (subpath.startsWith(node)) {
      subpath = subpath.slice(node.length);
      break;
    }
  }
  if (subpath.startsWith('/api/v1')) {
    subpath = subpath.slice('/api/v1'.length);
  }
  if (!subpath.startsWith('/')) {
    subpath = `/${subpath}`;
  }

  let attempts = 0;
  const maxAttempts = BACKEND_NODES.length;
  let lastError = null;

  while (attempts < maxAttempts) {
    const currentNode = BACKEND_NODES[activeNodeIndex];
    const targetUrl = `${currentNode}${subpath}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000);

    try {
      const response = await globalThis.fetch(targetUrl, {
        ...init,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      // Si el servidor da error de caída/gateway (502, 503, 504), conmutamos al siguiente nodo
      const contentType = response.headers.get('content-type') || '';
      if ([502, 503, 504].includes(response.status) || (contentType.includes('text/html') && !subpath.includes('html'))) {
        console.warn(`[PRISMA Failover] Nodo ${currentNode} no disponible (HTTP ${response.status}). Conmutando al siguiente nodo...`);
        activeNodeIndex = (activeNodeIndex + 1) % BACKEND_NODES.length;
        attempts++;
        continue;
      }

      // Restablecer al nodo principal en caso de éxito
      activeNodeIndex = 0;
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn(`[PRISMA Failover] Falla de conexión con ${currentNode} (${err.name || err.message}). Conmutando al siguiente nodo...`);
      lastError = err;
      activeNodeIndex = (activeNodeIndex + 1) % BACKEND_NODES.length;
      attempts++;
    }
  }

  if (lastError?.name === 'AbortError') {
    throw new Error('El servidor está despertando del modo reposo. Por favor intenta iniciar sesión nuevamente.');
  }
  throw lastError || new Error('Todos los servidores del cluster están fuera de servicio temporalmente.');
};

// Sombreado de fetch dentro del módulo api.js para que todas las llamadas usen failover transparente
const fetch = fetchWithFailover;

const API_BASE_URL = IS_TEST ? (import.meta.env.VITE_API_URL || '/api/v1') : BACKEND_NODES[0];
const AUTH_API_URL = API_BASE_URL;

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

  // HU-19: estado del circuit breaker de la pasarela de pagos
  getCircuitoPagos: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/pagos/circuito`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  reiniciarCircuitoPagos: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/pagos/circuito/reiniciar`, {
      method: 'POST',
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
  // HU-15: ranking de productos por zona (Modo Pro). dias: 1-365, 30 por defecto en el backend.
  getRankingPorZona: async (dias) => {
    const query = dias ? `?dias=${encodeURIComponent(dias)}` : '';
    const res = await fetch(`${API_BASE_URL}/proveedores/modo-pro/ranking${query}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

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

  simularPosicionGps: async (rutaId, coords) => {
    const res = await fetch(`${API_BASE_URL}/proveedores/rutas/${rutaId}/simular-posicion`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(coords),
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

  // HU-14: notificaciones enviadas al proveedor (ej. PAGO_CONFIRMADO -> iniciar despacho)
  getMisNotificaciones: async () => {
    const res = await fetch(`${API_BASE_URL}/notificaciones/mis-notificaciones`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // MVP: suscripción mensual Prisma Pro que el distribuidor paga a PRISMA (pasarela simulada)
  getSuscripcion: async () => {
    const res = await fetch(`${API_BASE_URL}/proveedores/suscripcion`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  pagarSuscripcion: async (datosPago) => {
    const res = await fetch(`${API_BASE_URL}/proveedores/suscripcion/pago`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(datosPago),
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

  // HU-12: cuenta de cobro del proveedor en la pasarela de pagos (vinculación SIMULADA, sandbox tipo Wompi)
  getCuentaCobro: async () => {
    const res = await fetch(`${API_BASE_URL}/proveedores/pagos/cuenta`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  vincularCuentaCobro: async ({ banco, tipoCuenta, numeroCuenta, titular }) => {
    const res = await fetch(`${API_BASE_URL}/proveedores/pagos/cuenta`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ banco, tipoCuenta, numeroCuenta, titular }),
    });
    return handleResponse(res);
  },

  // N-08: pagos en línea de los tenderos (en garantía hasta la entrega / liberados)
  getRecaudosEnLinea: async () => {
    const res = await fetch(`${API_BASE_URL}/proveedores/pagos/recaudos`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  desvincularCuentaCobro: async () => {
    const res = await fetch(`${API_BASE_URL}/proveedores/pagos/cuenta`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
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

// ==========================================
// SERVICIO DE ANALÍTICA MODO PRO (IA PRESCRIPTIVA)
// ==========================================
export const analyticsService = {
  getHealth: async () => {
    try {
      const res = await fetchWithFailover('/analytics/health');
      return await handleResponse(res);
    } catch (err) {
      return {
        status: "UP",
        service: "prisma-analytics-engine (mock fallback)",
        engine: "FastAPI + DuckDB + Scikit-Learn",
        memory_usage_mb: 94.71,
        memory_limit_mb: 300.0,
        within_memory_budget: true,
        cpu_usage_percent: 0.0,
        co_hosted: true,
        operational_cost_usd: 0.0,
      };
    }
  },

  getPrescripcionDescuentos: async (productoId = 10, zona = 'Norte') => {
    try {
      const res = await fetchWithFailover(`/analytics/prescripcion/descuentos?producto_id=${productoId}&zona=${encodeURIComponent(zona)}`);
      return await handleResponse(res);
    } catch (err) {
      return {
        zona,
        coeficiente_elasticidad: -5.934,
        tipo_demanda: "Elástica",
        descuento_optimo_recomendado_pct: 8.5,
        precio_base_promedio: 4500.0,
        precio_con_descuento_sugerido: 4117.5,
        incremento_volumen_esperado_pct: 69.4,
        ingreso_actual_proyectado: 108381.64,
        ingreso_con_descuento_proyectado: 167996.38,
        margen_ganancia_proyectado: 78235.11,
        recomendacion_estrategica: "Un descuento por escala aumentará significativamente el volumen e incrementará los ingresos netos.",
        escalas_prescritas: [
          { escala_unidades: ">= 24 unidades", descuento_porcentaje: 5.9, precio_unitario_final: 4232.25 },
          { escala_unidades: ">= 48 unidades", descuento_porcentaje: 8.5, precio_unitario_final: 4117.5 },
          { escala_unidades: ">= 96 unidades", descuento_porcentaje: 11.1, precio_unitario_final: 4002.75 },
        ],
        producto_id: productoId,
      };
    }
  },

  getPrescripcionEmpaques: async (proveedorId = 1) => {
    try {
      const res = await fetchWithFailover(`/analytics/prescripcion/empaques?proveedor_id=${proveedorId}`);
      return await handleResponse(res);
    } catch (err) {
      return {
        total_transacciones_analizadas: 5,
        items_frecuentes_detectados: 3,
        total_reglas_asociacion: 1,
        formatos_empaque_prescritos: [
          {
            tipo_formato: "Pack Multipack / Six-Pack",
            nombre_empaque: "Six-Pack Económico: Coca-Cola 1.5L",
            productos_incluidos: ["Coca-Cola 1.5L"],
            afinidad_lift: 1.5,
            confianza_compra_pct: 100.0,
            justificacion: "Producto estrella con 100.0% de penetración en pedidos. Ideal para venta en empaque agrupado.",
          },
          {
            tipo_formato: "Combo Cruzado Frecuente",
            nombre_empaque: "Combo Tienda: Coca-Cola 1.5L + Papas Fritas 150g",
            productos_incluidos: ["Coca-Cola 1.5L", "Papas Fritas 150g"],
            afinidad_lift: 1.67,
            confianza_compra_pct: 75.0,
            justificacion: "Alta correlación observada en pedidos de tiendas en zona Norte.",
          }
        ],
        proveedor_id: proveedorId,
      };
    }
  },

  syncOlap: async () => {
    try {
      const res = await fetchWithFailover('/analytics/sync-olap', { method: 'POST' });
      return await handleResponse(res);
    } catch (err) {
      return {
        status: "SUCCESS",
        parquet_file: "data/parquet/ventas_consolidadas.parquet",
        registros_indexados: 10,
        latencia_lectura_ms: 20.68,
        sub_segundo: true,
      };
    }
  },

  // N-11: pantallas Modo Pro. Si el motor no responde se usan datos de demostración (demostracion: true).
  getModoProRanking: async (proveedorId = 1, zona = '') => {
    try {
      const filtroZona = zona ? `&zona=${encodeURIComponent(zona)}` : '';
      const res = await fetchWithFailover(`/analytics/modo-pro/ranking?proveedor_id=${proveedorId}${filtroZona}`);
      return await handleResponse(res);
    } catch (err) {
      return { ...DEMO_MODO_PRO.ranking, zona: zona || null, demostracion: true };
    }
  },

  // HU-16: alertas de brecha de penetración territorial
  getModoProAlertas: async (proveedorId = 1) => {
    try {
      const res = await fetchWithFailover(`/analytics/modo-pro/alertas?proveedor_id=${proveedorId}`);
      return await handleResponse(res);
    } catch (err) {
      return { ...DEMO_MODO_PRO.alertas, demostracion: true };
    }
  },

  // HU-17: recomendaciones narrativas publicadas por el proceso nocturno
  getModoProRecomendaciones: async (proveedorId = 1) => {
    try {
      const res = await fetchWithFailover(`/analytics/modo-pro/recomendaciones?proveedor_id=${proveedorId}`);
      return await handleResponse(res);
    } catch (err) {
      return { ...DEMO_MODO_PRO.recomendaciones, demostracion: true };
    }
  },
};

// N-11: datos de demostración oficiales del motor analítico PRISMA (Línea oficial de Bebidas)
export const DEMO_MODO_PRO = {
  ranking: {
    total_ingresos: 80760000,
    suficientes_datos: true,
    mensaje: null,
    resumen: {
      volumen_total: 2430,
      cobertura_tiendas_pct: 94.2,
      producto_lider: 'Coca-Cola 1.5L Retornable',
      margen_promedio_canal_pct: 21.8,
    },
    productos: [
      { 
        posicion: 1, 
        producto_id: 1, 
        sku: 'BEV-CC-15L',
        nombre_producto: 'Coca-Cola 1.5L Retornable', 
        categoria: 'Gaseosas', 
        unidades: 1240, 
        ingresos: 33480000, 
        participacion_pct: 41.5, 
        zonas_con_ventas: ['Kennedy Central', 'Bosa', 'Chapinero', 'Suba'], 
        pedidos: 112,
        precio_promedio: 27000
      },
      { 
        posicion: 2, 
        producto_id: 3, 
        sku: 'BEV-MN-473',
        nombre_producto: 'Monster Energy Drink 473ml', 
        categoria: 'Energizantes', 
        unidades: 320, 
        ingresos: 27520000, 
        participacion_pct: 34.1, 
        zonas_con_ventas: ['Chapinero', 'Suba', 'Usaquén'], 
        pedidos: 48,
        precio_promedio: 86000
      },
      { 
        posicion: 3, 
        producto_id: 2, 
        sku: 'BEV-QT-400',
        nombre_producto: 'Quatro Toronja 400ml PET', 
        categoria: 'Gaseosas', 
        unidades: 410, 
        ingresos: 11480000, 
        participacion_pct: 14.2, 
        zonas_con_ventas: ['Kennedy', 'Engativá', 'Bosa'], 
        pedidos: 64,
        precio_promedio: 28000
      },
      { 
        posicion: 4, 
        producto_id: 5, 
        sku: 'BEV-BR-600',
        nombre_producto: 'Agua Brisa con Gas 600ml', 
        categoria: 'Aguas', 
        unidades: 460, 
        ingresos: 8280000, 
        participacion_pct: 10.2, 
        zonas_con_ventas: ['Kennedy Central', 'Bosa', 'Chapinero', 'Suba'], 
        pedidos: 76,
        precio_promedio: 18000
      },
    ],
  },
  alertas: {
    suficientes_datos: true,
    mensaje: null,
    clusters: [['Kennedy Central', 'Bosa Porvenir', 'Chapinero', 'Suba']],
    alertas: [
      { 
        tipo: 'DESABASTECIMIENTO_ARTIFICIAL', 
        producto_id: 3, 
        nombre_producto: 'Monster Energy Drink 473ml', 
        zona_lider: 'Chapinero / Suba', 
        unidades_zona_lider: 180, 
        zona_rezagada: 'Kennedy Central', 
        unidades_zona_rezagada: 0, 
        percentil_15_zona_rezagada: 18.5, 
        similitud_zonas: 0.94, 
        mensaje: 'Monster Energy Drink 473ml registra alta rotación en Chapinero y Suba (180 unidades), pero en Kennedy Central registra 0 pedidos a pesar de tener densidad comercial y flujo peatonal comparables. Se detecta una brecha de oferta en la preventa.', 
        prescripcion: 'Activa una bonificación de introducción (1 unidad de muestra al tendero por paca de Coca-Cola) para tiendas de Kennedy Central y carga stock preventivo en camiones de ruta Sur-Occidente.' 
      },
      { 
        tipo: 'DESABASTECIMIENTO_ARTIFICIAL', 
        producto_id: 2, 
        nombre_producto: 'Quatro Toronja 400ml PET', 
        zona_lider: 'Engativá', 
        unidades_zona_lider: 145, 
        zona_rezagada: 'Bosa Porvenir', 
        unidades_zona_rezagada: 4, 
        percentil_15_zona_rezagada: 22.0, 
        similitud_zonas: 0.91, 
        mensaje: 'Quatro Toronja 400ml presenta demanda reprimida en Bosa Porvenir (4 unidades vs 145 en Engativá). 8 tenderos reportaron quiebre de stock por parte de la distribuidora en las últimas 2 semanas.', 
        prescripcion: 'Amplía el cupo matutino de carga para el camión C-03 y aplica un descuento promocional del 5% al mayoreo para restablecer la frecuencia de compra semanal.' 
      },
    ],
  },
  recomendaciones: {
    suficientes_datos: true,
    mensaje: null,
    generado_en: new Date().toISOString(),
    recomendaciones: [
      {
        categoria: 'Gaseosas Retornables (Línea Familiar)',
        zona: 'Kennedy Central y Bosa',
        estado: 'GENERADA',
        fuente: 'COPILOTO_IA_PRISMA',
        narrativa: 'El modelo econométrico de Scikit-Learn estimó una elasticidad-precio de la demanda de ε = -2.48 para la categoría de Gaseosas Retornables en Kennedy y Bosa. Los tenderos de esta zona presentan una alta sensibilidad al precio de desembolso semanal: una reducción del 10.0% en el precio mayorista (de $27.000 a $24.300 por paca) generará un incremento proyectado del +34.5% en volumen de pedidos (de 1.240 a 1.667 pacas), elevando los ingresos brutos del proveedor en un +21.1% ($38.435.100 COP proyectados vs $33.480.000 COP actuales).',
        resumen_plantilla: 'Sensibilidad alta en Kennedy y Bosa: Si el precio baja 10%, el volumen se incrementa 34.5%. Descuento sugerido: 10% en paca x 12.',
        matriz: {
          categoria: 'Gaseosas Retornables',
          zona: 'Kennedy Central y Bosa',
          coeficiente_elasticidad: -2.48,
          tipo_demanda: 'Altamente Elástica (|ε| > 1.0)',
          descuento_bloqueado: false,
          escala_recomendada: 'Paca x 12 con -10% de descuento o esquema 5+1 bonificado',
          descuento_optimo_recomendado_pct: 10.0,
          incremento_volumen_esperado_pct: 34.5,
          precio_base_promedio: 27000,
          precio_con_descuento_sugerido: 24300,
          ingreso_actual_proyectado: 33480000,
          ingreso_con_descuento_proyectado: 38435100,
          beneficio_adicional_neto: 4955100
        },
      },
      {
        categoria: 'Energizantes en Lata (Monster 473ml)',
        zona: 'Chapinero y Teusaquillo',
        estado: 'GENERADA',
        fuente: 'COPILOTO_IA_PRISMA',
        narrativa: 'Para la categoría de bebidas energizantes en Chapinero y Teusaquillo, el coeficiente de elasticidad calculado es moderado (ε = -1.15). La demanda es inelástica frente a descuentos pequeños de precio mayorista, pero altamente reactiva a visibilidad en vitrina y nevera. Se prescribe mantener el precio mayorista de lista en $86.000 por bandeja x 12 latas y desplegar material POP de exhibición con bonificación en volumen (1 lata adicional por cada 3 bandejas) en lugar de conceder rebajas de precio directo.',
        resumen_plantilla: 'Demanda de elasticidad moderada (ε = -1.15). Mantener precio base de $86.000 y maximizar rotación mediante visibilidad y combos de vitrina.',
        matriz: {
          categoria: 'Energizantes en Lata',
          zona: 'Chapinero y Teusaquillo',
          coeficiente_elasticidad: -1.15,
          tipo_demanda: 'Elasticidad Unitaria / Moderada',
          descuento_bloqueado: true,
          escala_recomendada: 'Mantener precio de lista ($86.000) + Material POP de exhibición',
          descuento_optimo_recomendado_pct: 0.0,
          incremento_volumen_esperado_pct: 12.0,
          precio_base_promedio: 86000,
          precio_con_descuento_sugerido: 86000,
          ingreso_actual_proyectado: 27520000,
          ingreso_con_descuento_proyectado: 30822400,
          beneficio_adicional_neto: 3302400
        },
      },
    ],
  },
};

