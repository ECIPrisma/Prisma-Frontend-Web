import React, { useState, useEffect, useRef } from 'react';
import { proveedorService } from '../../services/api';
import { 
  Package, 
  Plus, 
  RefreshCw, 
  AlertCircle, 
  Edit, 
  Check, 
  X, 
  Sparkles, 
  Tag, 
  TrendingUp, 
  LayoutGrid, 
  List as ListIcon, 
  Search,
  Eye,
  CheckCircle,
  Pause,
  Play,
  Trash2,
  Edit2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const PRESET_IMAGENES = [
  {
    nombre: 'Coca-Cola 400ml PET',
    url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  },
  {
    nombre: 'Coca-Cola Zero Lata 330ml',
    url: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=500&auto=format&fit=crop&q=80',
  },
  {
    nombre: 'Coca-Cola Familiar 1.5L',
    url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&auto=format&fit=crop&q=80',
  },
  {
    nombre: 'Jugo Del Valle Citrus 1.5L',
    url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&auto=format&fit=crop&q=80',
  },
  {
    nombre: 'Agua Manantial 600ml',
    url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&auto=format&fit=crop&q=80',
  },
];

export const ProveedorDashboard = () => {
  const { user } = useAuth();
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorApi, setErrorApi] = useState('');
  
  // Auto-refresco en vivo
  const [autoSyncActivo, setAutoSyncActivo] = useState(true);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());
  const [segundosDesdeSync, setSegundosDesdeSync] = useState(0);

  // Filtros y Vista
  const [vistaModo, setVistaModo] = useState('grid'); // 'grid' o 'tabla'
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');

  // Modal Crear / Editar Producto
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [nuevoProd, setNuevoProd] = useState({
    sku: '',
    nombre: '',
    descripcion: '',
    presentacion: 'Caja x 24 Und',
    precioUnitario: '',
    precioSugeridoPublico: '',
    disponibilidad: 'DISPONIBLE', // 'DISPONIBLE', 'BAJO_PEDIDO', 'AGOTADO'
    esPromocion: false,
    imagenUrl: PRESET_IMAGENES[0].url,
    categoriaId: 1
  });

  const cargarProductos = async (silencioso = false) => {
    if (!silencioso && productos.length === 0) setCargando(true);
    try {
      const data = await proveedorService.getMisProductos();
      setProductos(Array.isArray(data) ? data : []);
      setErrorApi('');
      setUltimaActualizacion(new Date());
      setSegundosDesdeSync(0);
    } catch (err) {
      if (!silencioso && productos.length === 0) {
        setErrorApi(err.message || 'No se pudieron cargar los productos del proveedor');
      }
    } finally {
      if (!silencioso && productos.length === 0) setCargando(false);
    }
  };

  // Carga inicial
  useEffect(() => {
    cargarProductos();
  }, []);

  // Polling de auto-actualización continua y silenciosa cada 4s
  useEffect(() => {
    if (!autoSyncActivo) return;

    const intervalId = setInterval(() => {
      cargarProductos(true);
    }, 4000);

    const timerSec = setInterval(() => {
      setSegundosDesdeSync(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(intervalId);
      clearInterval(timerSec);
    };
  }, [autoSyncActivo]);

  const handleCrearProducto = async (e) => {
    e.preventDefault();
    try {
      setGuardando(true);
      const precioUnit = parseFloat(nuevoProd.precioUnitario);
      const precioSug = parseFloat(nuevoProd.precioSugeridoPublico || precioUnit * 1.25);
      
      let estadoFinal = 'ACTIVO';
      if (nuevoProd.esPromocion) estadoFinal = 'PROMOCION';
      if (nuevoProd.disponibilidad === 'AGOTADO') estadoFinal = 'AGOTADO';

      await proveedorService.crearProducto({
        sku: nuevoProd.sku || `SKU-${Date.now()}`,
        nombre: nuevoProd.nombre,
        descripcion: nuevoProd.descripcion,
        presentacion: nuevoProd.presentacion,
        precioUnitario: precioUnit,
        precioSugeridoPublico: precioSug,
        stockDisponible: nuevoProd.disponibilidad === 'AGOTADO' ? 0 : 9999, // Producción continua de alto volumen
        imagenUrl: nuevoProd.imagenUrl || PRESET_IMAGENES[0].url,
        estado: estadoFinal,
        categoriaId: nuevoProd.categoriaId || 1,
        esRetornable: false,
      });

      setModalAbierto(false);
      setNuevoProd({
        sku: '',
        nombre: '',
        descripcion: '',
        presentacion: 'Caja x 24 Und',
        precioUnitario: '',
        precioSugeridoPublico: '',
        disponibilidad: 'DISPONIBLE',
        esPromocion: false,
        imagenUrl: PRESET_IMAGENES[0].url,
        categoriaId: 1
      });
      await cargarProductos();
    } catch (err) {
      alert('Error al crear producto: ' + err.message);
    } finally {
      setGuardando(false);
    }
  };

  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [prodEnEdicion, setProdEnEdicion] = useState(null);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  const handleAbrirEditar = (prod) => {
    setProdEnEdicion({
      id: prod.id,
      nombre: prod.nombre,
      sku: prod.sku,
      descripcion: prod.descripcion || '',
      presentacion: prod.presentacion,
      precioUnitario: prod.precioUnitario,
      precioSugeridoPublico: prod.precioSugeridoPublico,
      imagenUrl: prod.imagenUrl || PRESET_IMAGENES[0].url,
      estado: prod.estado,
      categoriaId: prod.categoriaId || 1
    });
    setModalEditarAbierto(true);
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    if (!prodEnEdicion) return;
    try {
      setGuardandoEdicion(true);
      await proveedorService.actualizarProducto(prodEnEdicion.id, {
        nombre: prodEnEdicion.nombre,
        sku: prodEnEdicion.sku,
        descripcion: prodEnEdicion.descripcion,
        presentacion: prodEnEdicion.presentacion,
        precioUnitario: parseFloat(prodEnEdicion.precioUnitario),
        precioSugeridoPublico: parseFloat(prodEnEdicion.precioSugeridoPublico),
        imagenUrl: prodEnEdicion.imagenUrl,
        estado: prodEnEdicion.estado,
        categoriaId: prodEnEdicion.categoriaId
      });
      setModalEditarAbierto(false);
      setProdEnEdicion(null);
      await cargarProductos(true);
    } catch (err) {
      alert('Error al guardar cambios: ' + err.message);
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const handleEliminarProducto = async (productoId, nombre) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar "${nombre}" del catálogo? Las tiendas ya no podrán solicitarlo.`)) {
      return;
    }
    try {
      await proveedorService.eliminarProducto(productoId);
      await cargarProductos(true);
    } catch (err) {
      alert('Error al eliminar producto: ' + err.message);
    }
  };

  const handleCambiarEstadoRapido = async (productoId, nuevoEstado) => {
    try {
      await proveedorService.actualizarProducto(productoId, {
        estado: nuevoEstado,
        stockDisponible: nuevoEstado === 'AGOTADO' ? 0 : 9999,
      });
      await cargarProductos(true);
    } catch (err) {
      alert('Error al actualizar disponibilidad: ' + err.message);
    }
  };

  const productosFiltrados = productos.filter(p => {
    const matchBusqueda = (p.nombre?.toLowerCase() || '').includes(busqueda.toLowerCase()) ||
                          (p.sku?.toLowerCase() || '').includes(busqueda.toLowerCase());
    if (!matchBusqueda) return false;

    if (filtroEstado === 'TODOS') return true;
    if (filtroEstado === 'PROMOCIONES') return p.estado === 'PROMOCION' || p.estado === 'NUEVO_LANZAMIENTO';
    if (filtroEstado === 'DISPONIBLES') return p.estado === 'ACTIVO' || p.estado === 'PROMOCION' || p.estado === 'NUEVO_LANZAMIENTO';
    if (filtroEstado === 'AGOTADOS') return p.estado === 'AGOTADO';
    return true;
  });

  const productosPromocionados = productos.filter(p => 
    p.estado === 'PROMOCION' || p.estado === 'NUEVO_LANZAMIENTO'
  );

  const calcularMargenTendero = (costo, venta) => {
    if (!costo || !venta || costo >= venta) return 0;
    return Math.round(((venta - costo) / costo) * 100);
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header con Auto-Sync Indicator */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-prisma-text-primary flex items-center gap-2">
            <Package className="w-7 h-7 text-prisma-teal" />
            Catálogo de Productos
          </h1>
          <p className="text-xs text-prisma-text-secondary mt-1">
            Administra tus productos, precios y promociones para las tiendas de barrio.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setModalAbierto(true)}
            className="flex items-center gap-2 px-4 py-2 bg-prisma-teal hover:bg-prisma-teal-dark text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {errorApi && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorApi}</span>
        </div>
      )}

      {/* 1. SECCIÓN DESTACADA: PROMOCIONES Y DESTACADOS */}
      {productosPromocionados.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-prisma-text-primary flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Promociones y Destacados
            </h2>
            <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              {productosPromocionados.length} Productos
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {productosPromocionados.map((prod) => {
              const margen = calcularMargenTendero(prod.precioUnitario, prod.precioSugeridoPublico);
              const esNuevo = prod.estado === 'NUEVO_LANZAMIENTO';

              return (
                <div
                  key={prod.id}
                  className="bg-gradient-to-br from-white via-white to-amber-50/40 rounded-2xl border-2 border-amber-300 shadow-sm p-4 relative overflow-hidden flex flex-col justify-between hover:shadow-md transition"
                >
                  <div className="absolute top-3 right-3 flex gap-1">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm ${
                      esNuevo ? 'bg-indigo-600 text-white' : 'bg-amber-500 text-white'
                    }`}>
                      {esNuevo ? 'NUEVO' : 'PROMOCIÓN'}
                    </span>
                  </div>

                  <div className="flex gap-4 items-center">
                    <div className="w-24 h-24 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200 shadow-inner">
                      <img
                        src={prod.imagenUrl || PRESET_IMAGENES[0].url}
                        alt={prod.nombre}
                        className="w-full h-full object-cover hover:scale-105 transition duration-300"
                        onError={(e) => { e.target.src = '/logo_icono_tienda.png'; }}
                      />
                    </div>

                    <div className="space-y-1 pr-6 flex-1">
                      <span className="text-[10px] font-mono text-gray-400">SKU: {prod.sku}</span>
                      <h3 className="font-bold text-sm text-prisma-text-primary leading-snug line-clamp-2">
                        {prod.nombre}
                      </h3>
                      <p className="text-[11px] text-prisma-text-secondary">{prod.presentacion}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-amber-100/80 flex items-center justify-between text-xs">
                    <div>
                      <p className="text-[10px] text-prisma-text-secondary uppercase">Precio Mayorista:</p>
                      <p className="text-base font-black text-prisma-teal">
                        ${Number(prod.precioUnitario).toLocaleString('es-CO')}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] text-gray-400">Al Público: ${Number(prod.precioSugeridoPublico).toLocaleString('es-CO')}</p>
                      <p className="text-[11px] font-bold text-emerald-600 flex items-center justify-end gap-0.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>+{margen}% Ganancia</span>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. CATÁLOGO COMPLETO: BARRA DE FILTROS & VISTAS */}
      <div className="bg-white rounded-2xl border border-prisma-border p-5 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre o SKU..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-prisma-border rounded-xl text-xs focus:ring-2 focus:ring-prisma-teal focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {['TODOS', 'PROMOCIONES', 'DISPONIBLES', 'AGOTADOS'].map((filtro) => (
              <button
                key={filtro}
                onClick={() => setFiltroEstado(filtro)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  filtroEstado === filtro
                    ? 'bg-prisma-teal text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filtro}
              </button>
            ))}

            <div className="h-6 w-px bg-gray-200 mx-1"></div>

            <button
              onClick={() => setVistaModo('grid')}
              className={`p-2 rounded-xl transition ${vistaModo === 'grid' ? 'bg-prisma-teal text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              title="Vista en Cuadrícula"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setVistaModo('tabla')}
              className={`p-2 rounded-xl transition ${vistaModo === 'tabla' ? 'bg-prisma-teal text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              title="Vista en Tabla"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CONTENIDO DEL CATÁLOGO */}
        {cargando ? (
          <div className="p-12 text-center text-xs text-prisma-text-secondary">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-prisma-teal" />
            Cargando catálogo comercial...
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="p-12 text-center text-xs text-prisma-text-secondary space-y-2">
            <Package className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="font-semibold text-prisma-text-primary">No hay productos que coincidan con la búsqueda</p>
            <p>Ajusta los filtros o publica un nuevo artículo.</p>
          </div>
        ) : vistaModo === 'grid' ? (
          /* VISTA EN CUADRÍCULA CON IMÁGENES */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-2">
            {productosFiltrados.map((prod) => {
              const margen = calcularMargenTendero(prod.precioUnitario, prod.precioSugeridoPublico);
              const estaAgotado = prod.estado === 'AGOTADO';

              return (
                <div
                  key={prod.id}
                  className={`bg-white rounded-2xl border ${estaAgotado ? 'border-gray-200 opacity-60' : 'border-prisma-border'} shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition space-y-3`}
                >
                  <div>
                    <div className="w-full h-36 rounded-xl bg-gray-100 overflow-hidden relative border border-gray-100 mb-3">
                      <img
                        src={prod.imagenUrl || PRESET_IMAGENES[0].url}
                        alt={prod.nombre}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = '/logo_icono_tienda.png'; }}
                      />
                      <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        estaAgotado 
                          ? 'bg-red-100 text-red-700' 
                          : prod.estado === 'PROMOCION'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {estaAgotado ? 'Agotado Temporal' : prod.estado === 'PROMOCION' ? 'En Promoción' : 'Disponible'}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-gray-400">SKU: {prod.sku}</span>
                    <h4 className="font-bold text-xs text-prisma-text-primary line-clamp-2 mt-0.5">
                      {prod.nombre}
                    </h4>
                    <p className="text-[11px] text-prisma-text-secondary mt-0.5">{prod.presentacion}</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-prisma-border/60">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-bold text-prisma-teal">
                        ${Number(prod.precioUnitario).toLocaleString('es-CO')}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        PVP: ${Number(prod.precioSugeridoPublico).toLocaleString('es-CO')}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] gap-1">
                      <span className="text-emerald-600 font-semibold truncate">+{margen}% Margen</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleAbrirEditar(prod)}
                          className="p-1 rounded text-gray-500 hover:text-prisma-teal hover:bg-gray-100 transition"
                          title="Editar producto"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleEliminarProducto(prod.id, prod.nombre)}
                          className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                          title="Eliminar de catálogo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleCambiarEstadoRapido(prod.id, estaAgotado ? 'ACTIVO' : 'AGOTADO')}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                            estaAgotado
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-700'
                          }`}
                        >
                          {estaAgotado ? 'Reactivar' : 'Pausar'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* VISTA EN TABLA */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-prisma-border text-gray-600">
                <tr>
                  <th className="py-3 px-4 font-semibold">Producto</th>
                  <th className="py-3 px-4 font-semibold">SKU</th>
                  <th className="py-3 px-4 font-semibold">Presentación</th>
                  <th className="py-3 px-4 font-semibold">Precio Mayorista</th>
                  <th className="py-3 px-4 font-semibold">PVP Sugerido</th>
                  <th className="py-3 px-4 font-semibold">Disponibilidad</th>
                  <th className="py-3 px-4 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-prisma-border/60">
                {productosFiltrados.map((prod) => {
                  const estaAgotado = prod.estado === 'AGOTADO';
                  return (
                    <tr key={prod.id} className="hover:bg-gray-50/80 transition">
                      <td className="py-3 px-4 flex items-center gap-3">
                        <img
                          src={prod.imagenUrl || PRESET_IMAGENES[0].url}
                          alt=""
                          className="w-9 h-9 rounded-lg object-cover border border-gray-200"
                          onError={(e) => { e.target.src = '/logo_icono_tienda.png'; }}
                        />
                        <div>
                          <p className="font-bold text-prisma-text-primary">{prod.nombre}</p>
                          {prod.estado === 'PROMOCION' && (
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Promo</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-400">{prod.sku}</td>
                      <td className="py-3 px-4 text-gray-600">{prod.presentacion}</td>
                      <td className="py-3 px-4 font-bold text-prisma-teal">${Number(prod.precioUnitario).toLocaleString('es-CO')}</td>
                      <td className="py-3 px-4 text-gray-500">${Number(prod.precioSugeridoPublico).toLocaleString('es-CO')}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          estaAgotado ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {estaAgotado ? 'Agotado' : 'Disponible en Producción'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleAbrirEditar(prod)}
                            className="p-1.5 text-gray-500 hover:text-prisma-teal hover:bg-gray-100 rounded-lg transition"
                            title="Editar producto"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleEliminarProducto(prod.id, prod.nombre)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Eliminar de catálogo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleCambiarEstadoRapido(prod.id, estaAgotado ? 'ACTIVO' : 'AGOTADO')}
                            className="px-2.5 py-1 text-[11px] font-bold text-gray-600 hover:text-prisma-teal border border-prisma-border rounded-lg hover:bg-white"
                          >
                            {estaAgotado ? 'Reactivar' : 'Pausar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL CREAR PRODUCTO (SIMPLIFICADO UI/UX: SIN CONTEO MANUAL DE STOCK) */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in duration-200">
            <div className="flex justify-between items-center border-b border-prisma-border pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-prisma-teal" />
                <h3 className="font-bold text-base text-prisma-text-primary">Registrar Producto en Catálogo</h3>
              </div>
              <button onClick={() => setModalAbierto(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearProducto} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-prisma-text-primary mb-1">Nombre Comercial</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Coca-Cola Original 400ml"
                    value={nuevoProd.nombre}
                    onChange={(e) => setNuevoProd({ ...nuevoProd, nombre: e.target.value })}
                    className="w-full p-2.5 border border-prisma-border rounded-xl focus:ring-2 focus:ring-prisma-teal"
                  />
                </div>
                <div>
                  <label className="block font-bold text-prisma-text-primary mb-1">SKU / Referencia</label>
                  <input
                    type="text"
                    placeholder="KO-PET-400"
                    value={nuevoProd.sku}
                    onChange={(e) => setNuevoProd({ ...nuevoProd, sku: e.target.value })}
                    className="w-full p-2.5 border border-prisma-border rounded-xl focus:ring-2 focus:ring-prisma-teal font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-prisma-text-primary mb-1">Presentación / Empaque</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Paquete x 12 Unidades, Caja x 24 Botellas"
                  value={nuevoProd.presentacion}
                  onChange={(e) => setNuevoProd({ ...nuevoProd, presentacion: e.target.value })}
                  className="w-full p-2.5 border border-prisma-border rounded-xl focus:ring-2 focus:ring-prisma-teal"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-prisma-text-primary mb-1">Precio Mayorista ($ COP)</label>
                  <input
                    type="number"
                    required
                    min="100"
                    placeholder="28500"
                    value={nuevoProd.precioUnitario}
                    onChange={(e) => setNuevoProd({ ...nuevoProd, precioUnitario: e.target.value })}
                    className="w-full p-2.5 border border-prisma-border rounded-xl focus:ring-2 focus:ring-prisma-teal"
                  />
                </div>
                <div>
                  <label className="block font-bold text-prisma-text-primary mb-1">Precio Sugerido Venta Tendero ($ COP)</label>
                  <input
                    type="number"
                    min="100"
                    placeholder="36000"
                    value={nuevoProd.precioSugeridoPublico}
                    onChange={(e) => setNuevoProd({ ...nuevoProd, precioSugeridoPublico: e.target.value })}
                    className="w-full p-2.5 border border-prisma-border rounded-xl focus:ring-2 focus:ring-prisma-teal"
                  />
                </div>
              </div>

              {/* SELECCIÓN DE IMAGEN CON PRESETS */}
              <div>
                <label className="block font-bold text-prisma-text-primary mb-1">Imagen del Producto</label>
                <div className="flex gap-3 items-center mb-2">
                  <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                    <img
                      src={nuevoProd.imagenUrl || PRESET_IMAGENES[0].url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <input
                    type="url"
                    placeholder="https://ejemplo.com/imagen.jpg"
                    value={nuevoProd.imagenUrl}
                    onChange={(e) => setNuevoProd({ ...nuevoProd, imagenUrl: e.target.value })}
                    className="flex-1 p-2 border border-prisma-border rounded-xl text-xs"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] text-gray-400 self-center">Opciones rápidas:</span>
                  {PRESET_IMAGENES.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setNuevoProd({ ...nuevoProd, imagenUrl: img.url })}
                      className="text-[10px] px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                    >
                      {img.nombre}
                    </button>
                  ))}
                </div>
              </div>

              {/* DISPONIBILIDAD Y CAMPAÑA (REEMPLAZO REALISTA DEL STOCK NUMÉRICO) */}
              <div className="p-3 bg-prisma-surface rounded-2xl border border-prisma-border space-y-3">
                <div>
                  <label className="block font-bold text-prisma-text-primary mb-1">Disponibilidad en Planta / Bodega:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNuevoProd({ ...nuevoProd, disponibilidad: 'DISPONIBLE' })}
                      className={`p-2 rounded-xl border text-center font-bold transition flex items-center justify-center gap-1.5 ${
                        nuevoProd.disponibilidad === 'DISPONIBLE'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                          : 'border-prisma-border bg-white text-gray-600'
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Disponible (Producción Continua)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNuevoProd({ ...nuevoProd, disponibilidad: 'AGOTADO' })}
                      className={`p-2 rounded-xl border text-center font-bold transition flex items-center justify-center gap-1.5 ${
                        nuevoProd.disponibilidad === 'AGOTADO'
                          ? 'border-red-500 bg-red-50 text-red-800'
                          : 'border-prisma-border bg-white text-gray-600'
                      }`}
                    >
                      <X className="w-3.5 h-3.5 text-red-600" />
                      <span>Agotado Temporalmente</span>
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={nuevoProd.esPromocion}
                    onChange={(e) => setNuevoProd({ ...nuevoProd, esPromocion: e.target.checked })}
                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400"
                  />
                  <span className="font-semibold text-prisma-text-primary">
                    Destacar en sección de Promociones y Nuevos Lanzamientos
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-prisma-border">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 border border-prisma-border rounded-xl font-semibold hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2 bg-prisma-teal hover:bg-prisma-teal-dark text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {guardando ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Guardar y Publicar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR PRODUCTO */}
      {modalEditarAbierto && prodEnEdicion && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in duration-200">
            <div className="flex justify-between items-center border-b border-prisma-border pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-prisma-teal" />
                <h3 className="font-bold text-base text-prisma-text-primary">Editar Información del Producto</h3>
              </div>
              <button 
                onClick={() => { setModalEditarAbierto(false); setProdEnEdicion(null); }} 
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarEdicion} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-prisma-text-primary mb-1">Nombre Comercial</label>
                  <input
                    type="text"
                    required
                    value={prodEnEdicion.nombre}
                    onChange={(e) => setProdEnEdicion({ ...prodEnEdicion, nombre: e.target.value })}
                    className="w-full p-2.5 border border-prisma-border rounded-xl focus:ring-2 focus:ring-prisma-teal"
                  />
                </div>
                <div>
                  <label className="block font-bold text-prisma-text-primary mb-1">SKU / Referencia</label>
                  <input
                    type="text"
                    value={prodEnEdicion.sku}
                    onChange={(e) => setProdEnEdicion({ ...prodEnEdicion, sku: e.target.value })}
                    className="w-full p-2.5 border border-prisma-border rounded-xl focus:ring-2 focus:ring-prisma-teal font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-prisma-text-primary mb-1">Presentación / Empaque</label>
                <input
                  type="text"
                  required
                  value={prodEnEdicion.presentacion}
                  onChange={(e) => setProdEnEdicion({ ...prodEnEdicion, presentacion: e.target.value })}
                  className="w-full p-2.5 border border-prisma-border rounded-xl focus:ring-2 focus:ring-prisma-teal"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-prisma-text-primary mb-1">Precio Mayorista ($ COP)</label>
                  <input
                    type="number"
                    required
                    min="100"
                    value={prodEnEdicion.precioUnitario}
                    onChange={(e) => setProdEnEdicion({ ...prodEnEdicion, precioUnitario: e.target.value })}
                    className="w-full p-2.5 border border-prisma-border rounded-xl focus:ring-2 focus:ring-prisma-teal"
                  />
                </div>
                <div>
                  <label className="block font-bold text-prisma-text-primary mb-1">Precio Sugerido Venta Tendero ($ COP)</label>
                  <input
                    type="number"
                    min="100"
                    value={prodEnEdicion.precioSugeridoPublico}
                    onChange={(e) => setProdEnEdicion({ ...prodEnEdicion, precioSugeridoPublico: e.target.value })}
                    className="w-full p-2.5 border border-prisma-border rounded-xl focus:ring-2 focus:ring-prisma-teal"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-prisma-text-primary mb-1">Imagen del Producto (URL)</label>
                <div className="flex gap-3 items-center mb-2">
                  <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                    <img
                      src={prodEnEdicion.imagenUrl || PRESET_IMAGENES[0].url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <input
                    type="url"
                    value={prodEnEdicion.imagenUrl}
                    onChange={(e) => setProdEnEdicion({ ...prodEnEdicion, imagenUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full p-2.5 border border-prisma-border rounded-xl focus:ring-2 focus:ring-prisma-teal text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-prisma-text-primary mb-1">Estado de Oferta</label>
                <select
                  value={prodEnEdicion.estado}
                  onChange={(e) => setProdEnEdicion({ ...prodEnEdicion, estado: e.target.value })}
                  className="w-full p-2.5 border border-prisma-border rounded-xl focus:ring-2 focus:ring-prisma-teal font-semibold text-xs bg-white"
                >
                  <option value="ACTIVO">Activo y Disponible</option>
                  <option value="PROMOCION">En Promoción Especial</option>
                  <option value="NUEVO_LANZAMIENTO">Nuevo Lanzamiento</option>
                  <option value="AGOTADO">Agotado Temporalmente</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-prisma-border">
                <button
                  type="button"
                  onClick={() => { setModalEditarAbierto(false); setProdEnEdicion(null); }}
                  className="px-4 py-2 border border-prisma-border rounded-xl font-semibold hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoEdicion}
                  className="px-5 py-2 bg-prisma-teal hover:bg-prisma-teal-dark text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {guardandoEdicion ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Actualizar Producto</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
