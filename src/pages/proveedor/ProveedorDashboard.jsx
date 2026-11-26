import React, { useState, useEffect, useRef } from 'react';
import { proveedorService } from '../../services/api';
import { saveCatalogToOfflineCache, loadCatalogFromOfflineCache } from '../../utils/offlineCatalog';
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
  Edit2,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CargaMasivaModal } from '../../components/proveedor/CargaMasivaModal';
import { exportToCsv } from '../../utils/exportUtils';

const PRESET_IMAGENES = [
  {
    nombre: 'Coca-Cola 1.5L',
    url: '/products/real_coca_15l.jpg',
  },
  {
    nombre: 'Coca-Cola Vidrio 350ml',
    url: '/products/real_coca_vidrio.jpg',
  },
  {
    nombre: 'Coca-Cola 3 Litros PET',
    url: '/products/real_coca_3l.jpg',
  },
  {
    nombre: 'Manzana Postobón 400ml',
    url: '/products/real_postobon_manzana.jpg',
  },
  {
    nombre: 'Colombiana 400ml',
    url: '/products/real_colombiana.jpg',
  },
  {
    nombre: 'Quatro Toronja 400ml',
    url: '/products/real_quatro.jpg',
  },
  {
    nombre: 'Sprite 400ml',
    url: '/products/real_sprite.jpg',
  },
  {
    nombre: 'Monster Energy 473ml',
    url: '/products/real_monster.jpg',
  },
  {
    nombre: 'Agua Brisa 600ml',
    url: '/products/real_agua_brisa.jpg',
  },
];

export const resolveProductImage = (prod) => {
  if (!prod) return PRESET_IMAGENES[0].url;
  const name = (prod.nombre || '').toLowerCase();
  const sku = (prod.sku || '').toUpperCase();
  if (name.includes('quatro') || sku.includes('BEV-QT-400')) {
    return '/products/real_quatro.jpg';
  }
  if (name.includes('sprite')) {
    return '/products/real_sprite.jpg';
  }
  if (name.includes('monster')) {
    return '/products/real_monster.jpg';
  }
  if (name.includes('brisa') || name.includes('agua')) {
    return '/products/real_agua_brisa.jpg';
  }
  if (name.includes('manzana') || name.includes('postob')) {
    return '/products/real_postobon_manzana.jpg';
  }
  if (name.includes('colombiana')) {
    return '/products/real_colombiana.jpg';
  }
  if (name.includes('3') && name.includes('coca')) {
    return '/products/real_coca_3l.jpg';
  }
  if (name.includes('vidrio')) {
    return '/products/real_coca_vidrio.jpg';
  }
  if (name.includes('coca')) {
    return '/products/real_coca_15l.jpg';
  }
  return prod.imagenUrl || PRESET_IMAGENES[0].url;
};

export const ProveedorDashboard = () => {
  const { user } = useAuth();
  const [productos, setProductos] = useState(() => {
    const cached = loadCatalogFromOfflineCache();
    return cached.hasCache && cached.items.length > 0 ? cached.items : [];
  });
  const [cargando, setCargando] = useState(() => {
    const cached = loadCatalogFromOfflineCache();
    return !(cached.hasCache && cached.items.length > 0);
  });
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
  const [modalCargaMasiva, setModalCargaMasiva] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const handleExportarCatalogo = () => {
    const headers = [
      { key: 'sku', label: 'SKU' },
      { key: 'nombre', label: 'Nombre' },
      { key: 'presentacion', label: 'Presentacion' },
      { key: 'precioUnitario', label: 'Precio_Unitario_COP' },
      { key: 'precioSugeridoPublico', label: 'Precio_Sugerido_COP' },
      { key: 'stockDisponible', label: 'Stock_Disponible' },
      { key: 'estado', label: 'Estado' },
      { key: 'esRetornable', label: 'Retornable' }
    ];
    exportToCsv('Catalogo_Productos_PRISMA', headers, productos);
  };
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

  const isFetchingRef = useRef(false);

  const cargarProductos = async (silencioso = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (!silencioso) setCargando(true);
    try {
      const data = await proveedorService.getMisProductos();
      const lista = Array.isArray(data) ? data : [];
      setProductos(lista);
      saveCatalogToOfflineCache(lista);
      setErrorApi('');
      setUltimaActualizacion(new Date());
      setSegundosDesdeSync(0);
    } catch (err) {
      const cached = loadCatalogFromOfflineCache();
      if (cached.hasCache) {
        setProductos(cached.items);
        setErrorApi('');
      } else {
        setErrorApi(cached.message || err.message || 'No se pudieron cargar los productos del proveedor');
      }
    } finally {
      setCargando(false);
      isFetchingRef.current = false;
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
      if (typeof document !== 'undefined' && document.hidden) return;
      cargarProductos(true);
    }, 15000);

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

    const prodActualizado = {
      ...prodEnEdicion,
      precioUnitario: parseFloat(prodEnEdicion.precioUnitario),
      precioSugeridoPublico: parseFloat(prodEnEdicion.precioSugeridoPublico),
      esPromocion: prodEnEdicion.estado === 'PROMOCION',
    };

    // Actualización reactiva instantánea
    setProductos(prev => {
      const updated = prev.map(p => p.id === prodEnEdicion.id ? { ...p, ...prodActualizado } : p);
      saveCatalogToOfflineCache(updated);
      return updated;
    });
    setModalEditarAbierto(false);
    setProdEnEdicion(null);

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
    } catch (err) {
      console.warn('Sincronización backend diferida:', err.message);
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const handleEliminarProducto = async (productoId, nombre) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar "${nombre}" del catálogo? Las tiendas ya no podrán solicitarlo.`)) {
      return;
    }
    setProductos(prev => {
      const updated = prev.filter(p => p.id !== productoId);
      saveCatalogToOfflineCache(updated);
      return updated;
    });
    try {
      await proveedorService.eliminarProducto(productoId);
    } catch (err) {
      console.warn('Eliminación backend diferida:', err.message);
    }
  };

  const handleCambiarEstadoRapido = async (productoId, nuevoEstado) => {
    // Actualización optimista local inmediata
    setProductos(prev => {
      const updated = prev.map(p => p.id === productoId ? { ...p, estado: nuevoEstado, esPromocion: nuevoEstado === 'PROMOCION' } : p);
      saveCatalogToOfflineCache(updated);
      return updated;
    });

    try {
      await proveedorService.actualizarProducto(productoId, {
        estado: nuevoEstado,
        stockDisponible: nuevoEstado === 'AGOTADO' ? 0 : 9999,
      });
    } catch (err) {
      console.warn('Sincronización backend diferida:', err.message);
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
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

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportarCatalogo}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-prisma-border hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold transition shadow-sm cursor-pointer"
            title="Exportar a CSV para Excel"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={() => setModalCargaMasiva(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            title="Importar productos por lote"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
            <span>Carga Masiva</span>
          </button>
          <button
            onClick={() => setModalAbierto(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-prisma-teal hover:bg-prisma-teal-dark text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
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
                        src={resolveProductImage(prod)}
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
                        src={resolveProductImage(prod)}
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
                          title="Editar precio y producto"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleCambiarEstadoRapido(prod.id, prod.estado === 'PROMOCION' ? 'ACTIVO' : 'PROMOCION')}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition flex items-center gap-0.5 ${
                            prod.estado === 'PROMOCION'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-sm'
                              : 'bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-800'
                          }`}
                          title={prod.estado === 'PROMOCION' ? 'Quitar de promociones' : 'Poner en promoción rápida'}
                        >
                          <Tag className="w-3 h-3" />
                          <span>{prod.estado === 'PROMOCION' ? 'Promo' : '+Promo'}</span>
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
                          src={resolveProductImage(prod)}
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
                            title="Editar precio y producto"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleCambiarEstadoRapido(prod.id, prod.estado === 'PROMOCION' ? 'ACTIVO' : 'PROMOCION')}
                            className={`px-2 py-1 rounded text-[10px] font-bold transition flex items-center gap-0.5 ${
                              prod.estado === 'PROMOCION'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-800'
                            }`}
                            title={prod.estado === 'PROMOCION' ? 'Quitar de promociones' : 'Poner en promoción'}
                          >
                            <Tag className="w-3 h-3" />
                            <span>{prod.estado === 'PROMOCION' ? 'Promo' : '+Promo'}</span>
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 overflow-y-auto p-4 sm:p-6 flex items-center justify-center min-h-screen">
          <div className="relative bg-white rounded-3xl max-w-xl w-full my-auto shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-prisma-teal" />
                <h3 className="font-bold text-base text-prisma-text-primary">Registrar Producto en Catálogo</h3>
              </div>
              <button 
                type="button"
                onClick={() => setModalAbierto(false)} 
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearProducto} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      type="text"
                      placeholder="https://ejemplo.com/imagen.jpg o ruta local /products/..."
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
              </div>

              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 border border-prisma-border rounded-xl font-semibold hover:bg-gray-100 text-gray-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2.5 bg-prisma-teal hover:bg-prisma-teal-dark text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 overflow-y-auto p-4 sm:p-6 flex items-center justify-center min-h-screen">
          <div className="relative bg-white rounded-3xl max-w-xl w-full my-auto shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-prisma-teal" />
                <h3 className="font-bold text-base text-prisma-text-primary">Editar Información del Producto</h3>
              </div>
              <button 
                type="button"
                onClick={() => { setModalEditarAbierto(false); setProdEnEdicion(null); }} 
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarEdicion} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      <span className="text-[10px] text-gray-400 font-semibold">Descuento oferta:</span>
                      {[5, 10, 15, 20].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => {
                            const base = parseFloat(prodEnEdicion.precioUnitario) || 0;
                            const descontado = Math.round(base * (1 - pct / 100));
                            setProdEnEdicion({
                              ...prodEnEdicion,
                              precioUnitario: descontado,
                              estado: 'PROMOCION'
                            });
                          }}
                          className="text-[10px] px-1.5 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded font-bold transition"
                          title={`Aplicar ${pct}% de descuento y activar en Promociones`}
                        >
                          -{pct}%
                        </button>
                      ))}
                    </div>
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
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className="text-[10px] text-gray-400 font-semibold">Margen para el tendero:</span>
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        +{calcularMargenTendero(prodEnEdicion.precioUnitario, prodEnEdicion.precioSugeridoPublico)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-prisma-text-primary mb-1">Imagen del Producto</label>
                  <div className="flex gap-3 items-center mb-2">
                    <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                      <img
                        src={prodEnEdicion.imagenUrl || PRESET_IMAGENES[0].url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <input
                      type="text"
                      value={prodEnEdicion.imagenUrl}
                      onChange={(e) => setProdEnEdicion({ ...prodEnEdicion, imagenUrl: e.target.value })}
                      placeholder="/products/... o https://..."
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
              </div>

              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => { setModalEditarAbierto(false); setProdEnEdicion(null); }}
                  className="px-4 py-2 border border-prisma-border rounded-xl font-semibold hover:bg-gray-100 text-gray-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoEdicion}
                  className="px-5 py-2.5 bg-prisma-teal hover:bg-prisma-teal-dark text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {guardandoEdicion ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Actualizar Producto</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <CargaMasivaModal
        isOpen={modalCargaMasiva}
        onClose={() => setModalCargaMasiva(false)}
        onImportSuccess={() => {
          cargarProductos();
        }}
        apiCall={(lista) => proveedorService.crearProductosLote(lista)}
      />
    </div>
  );
};
