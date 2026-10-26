import React, { useState, useEffect } from 'react';
import { proveedorService } from '../../services/api';
import { 
  Store, 
  Plus, 
  Search, 
  MapPin, 
  Phone, 
  User, 
  DollarSign, 
  ShoppingBag, 
  Calendar, 
  TrendingUp, 
  BarChart3, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Tag, 
  Package, 
  ChevronRight,
  RefreshCw,
  Edit2,
  Trash2
} from 'lucide-react';

export const TiendasProveedorPage = () => {
  const [tiendas, setTiendas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroDia, setFiltroDia] = useState('TODOS');

  // Modal Crear Tienda
  const [modalCrear, setModalCrear] = useState(false);
  const [guardandoTienda, setGuardandoTienda] = useState(false);
  const [nuevaTienda, setNuevaTienda] = useState({
    nombreTienda: '',
    nombreTendero: '',
    telefono: '',
    direccion: '',
    barrio: '',
    ciudad: 'Bogotá',
    nitOIdentificacion: '',
    diaEntrega: 'LUNES'
  });

  // Modal Editar Tienda
  const [modalEditar, setModalEditar] = useState(false);
  const [tiendaEnEdicion, setTiendaEnEdicion] = useState(null);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  // Modal / Drawer Detalle de Ventas
  const [tiendaSeleccionada, setTiendaSeleccionada] = useState(null);
  const [analisisVentas, setAnalisisVentas] = useState(null);
  const [cargandoAnalisis, setCargandoAnalisis] = useState(false);
  const [errorAnalisis, setErrorAnalisis] = useState(null);

  const cargarTiendas = async (silencioso = false) => {
    try {
      if (!silencioso && tiendas.length === 0) setCargando(true);
      const data = await proveedorService.getTiendasClientes();
      setTiendas(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      if (!silencioso && tiendas.length === 0) {
        setError(err.message || 'No fue posible cargar las tiendas clientes');
      }
    } finally {
      if (!silencioso && tiendas.length === 0) setCargando(false);
    }
  };

  useEffect(() => {
    cargarTiendas();
    // Auto-actualización continua y silenciosa cada 4 segundos sin intervención del usuario
    const interval = setInterval(() => {
      cargarTiendas(true);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const abrirAnalisisTienda = async (tienda) => {
    setTiendaSeleccionada(tienda);
    setCargandoAnalisis(true);
    setErrorAnalisis(null);
    try {
      const tiendaId = tienda.id || tienda.tiendaId;
      const data = await proveedorService.getAnalisisVentasTienda(tiendaId);
      setAnalisisVentas(data);
    } catch (err) {
      setErrorAnalisis(err.message || 'No fue posible obtener el detalle de ventas de la tienda');
    } finally {
      setCargandoAnalisis(false);
    }
  };

  const handleCrearTienda = async (e) => {
    e.preventDefault();
    if (!nuevaTienda.nombreTienda.trim() || !nuevaTienda.nombreTendero.trim() || !nuevaTienda.direccion.trim()) {
      alert('Por favor complete los campos obligatorios: nombre de la tienda, tendero y dirección.');
      return;
    }

    try {
      setGuardandoTienda(true);
      await proveedorService.crearTiendaCliente(nuevaTienda);
      setModalCrear(false);
      setNuevaTienda({
        nombreTienda: '',
        nombreTendero: '',
        telefono: '',
        direccion: '',
        barrio: '',
        ciudad: 'Bogotá',
        nitOIdentificacion: '',
        diaEntrega: 'LUNES'
      });
      await cargarTiendas();
    } catch (err) {
      alert(err.message || 'Error al registrar la nueva tienda');
    } finally {
      setGuardandoTienda(false);
    }
  };

  const handleAbrirEditar = (tienda) => {
    setTiendaEnEdicion({
      id: tienda.id || tienda.tiendaId,
      nombreTienda: tienda.nombreTienda || '',
      nombreTendero: tienda.nombreTendero || '',
      telefono: tienda.telefono || '',
      direccion: tienda.direccion || '',
      barrio: tienda.barrio || '',
      ciudad: tienda.ciudad || 'Bogotá',
      nitOIdentificacion: tienda.nitOCedula || tienda.nitOIdentificacion || '',
      diaEntrega: tienda.diaPreferidoEntrega || tienda.diaEntrega || 'LUNES'
    });
    setModalEditar(true);
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    if (!tiendaEnEdicion) return;
    try {
      setGuardandoEdicion(true);
      await proveedorService.actualizarTiendaCliente(tiendaEnEdicion.id, {
        nombreTienda: tiendaEnEdicion.nombreTienda,
        nombreTendero: tiendaEnEdicion.nombreTendero,
        telefono: tiendaEnEdicion.telefono,
        direccion: tiendaEnEdicion.direccion,
        barrio: tiendaEnEdicion.barrio,
        ciudad: tiendaEnEdicion.ciudad,
        nitOIdentificacion: tiendaEnEdicion.nitOIdentificacion,
        diaEntrega: tiendaEnEdicion.diaEntrega
      });
      setModalEditar(false);
      setTiendaEnEdicion(null);
      await cargarTiendas(true);
    } catch (err) {
      alert(err.message || 'Error al actualizar tienda');
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const handleEliminarTienda = async (id, nombre) => {
    if (!confirm(`¿Estás seguro de dar de baja la tienda "${nombre}"? Ya no aparecerá en las rutas activas de entrega.`)) {
      return;
    }
    try {
      await proveedorService.eliminarTiendaCliente(id);
      await cargarTiendas(true);
    } catch (err) {
      alert(err.message || 'Error al inactivar tienda');
    }
  };

  const tiendasFiltradas = tiendas.filter(t => {
    const query = busqueda.toLowerCase();
    const nit = t.nitOCedula || t.nitOIdentificacion || '';
    const dia = t.diaPreferidoEntrega || t.diaEntrega || '';
    const coincideTexto = 
      (t.nombreTienda && t.nombreTienda.toLowerCase().includes(query)) ||
      (t.nombreTendero && t.nombreTendero.toLowerCase().includes(query)) ||
      (t.barrio && t.barrio.toLowerCase().includes(query)) ||
      (t.direccion && t.direccion.toLowerCase().includes(query)) ||
      nit.toLowerCase().includes(query);

    const coincideDia = filtroDia === 'TODOS' || dia.toUpperCase().includes(filtroDia);
    return coincideTexto && coincideDia;
  });

  const totalVentasGlobal = tiendas.reduce((acc, t) => acc + (Number(t.totalComprado ?? t.totalComprasHistoricas) || 0), 0);
  const totalPedidosGlobal = tiendas.reduce((acc, t) => acc + (Number(t.totalPedidos) || 0), 0);
  const tiendasConPedidos = tiendas.filter(t => (t.totalPedidos || 0) > 0).length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-prisma-teal/10 flex items-center justify-center text-prisma-teal">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-prisma-text-primary tracking-tight">
                Mis Tiendas Clientes
              </h1>
              <p className="text-sm text-prisma-text-secondary">
                Cartera de tiendas de barrio, pedidos despachados y análisis de lo que compra y vende cada negocio
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setModalCrear(true)}
            className="flex items-center gap-2 px-4 py-2 bg-prisma-teal text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Nueva Tienda</span>
          </button>
        </div>
      </div>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-prisma-border shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-prisma-text-secondary uppercase tracking-wider">Tiendas en Cartera</span>
            <div className="p-2 rounded-lg bg-teal-50 text-prisma-teal">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-prisma-text-primary">{tiendas.length}</div>
          <p className="text-xs text-prisma-text-secondary mt-1">Puntos de venta atendidos</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-prisma-border shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-prisma-text-secondary uppercase tracking-wider">Volumen Comprado</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-prisma-text-primary">
            ${totalVentasGlobal.toLocaleString('es-CO')}
          </div>
          <p className="text-xs text-prisma-text-secondary mt-1">Total despachado a la red</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-prisma-border shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-prisma-text-secondary uppercase tracking-wider">Pedidos Atendidos</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-prisma-text-primary">{totalPedidosGlobal}</div>
          <p className="text-xs text-prisma-text-secondary mt-1">Pedidos entregados o en curso</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-prisma-border shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-prisma-text-secondary uppercase tracking-wider">Tiendas Activas</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-prisma-text-primary">
            {tiendasConPedidos} <span className="text-sm font-normal text-prisma-text-secondary">/ {tiendas.length}</span>
          </div>
          <p className="text-xs text-prisma-text-secondary mt-1">Tiendas con compras registradas</p>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white p-4 rounded-2xl border border-prisma-border shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-prisma-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar tienda, tendero, barrio o dirección..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-prisma-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-prisma-teal/20 focus:border-prisma-teal transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-medium text-prisma-text-secondary whitespace-nowrap">Día de Reparto:</span>
          {['TODOS', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'].map((dia) => (
            <button
              key={dia}
              onClick={() => setFiltroDia(dia)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                filtroDia === dia
                  ? 'bg-prisma-teal text-white shadow-sm'
                  : 'bg-gray-100 text-prisma-text-secondary hover:bg-gray-200'
              }`}
            >
              {dia === 'TODOS' ? 'Todos' : dia.charAt(0) + dia.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Tiendas */}
      {cargando ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-prisma-border">
          <RefreshCw className="w-8 h-8 text-prisma-teal animate-spin mx-auto mb-3" />
          <p className="text-sm text-prisma-text-secondary">Cargando catálogo de tiendas...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-red-700">{error}</p>
          <button
            onClick={() => cargarTiendas()}
            className="mt-3 px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition"
          >
            Reintentar
          </button>
        </div>
      ) : tiendasFiltradas.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-prisma-border p-8">
          <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-prisma-text-primary">No se encontraron tiendas</h3>
          <p className="text-sm text-prisma-text-secondary max-w-md mx-auto mt-1 mb-4">
            {busqueda || filtroDia !== 'TODOS'
              ? 'No hay tiendas que coincidan con los criterios de búsqueda seleccionados.'
              : 'Aún no tiene tiendas registradas en su cartera de distribución. Agregue su primera tienda para comenzar.'}
          </p>
          <button
            onClick={() => setModalCrear(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-prisma-teal text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Tienda</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tiendasFiltradas.map((tienda) => {
            const id = tienda.id || tienda.tiendaId;
            const totalComprado = Number(tienda.totalComprado ?? tienda.totalComprasHistoricas) || 0;
            const diaEntrega = tienda.diaPreferidoEntrega || tienda.diaEntrega;
            const nit = tienda.nitOCedula || tienda.nitOIdentificacion;
            return (
              <div
                key={id}
                className="bg-white rounded-2xl border border-prisma-border p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-prisma-teal font-bold text-lg">
                        {tienda.nombreTienda ? tienda.nombreTienda.charAt(0).toUpperCase() : 'T'}
                      </div>
                      <div>
                        <h3 className="font-bold text-prisma-text-primary text-base line-clamp-1">
                          {tienda.nombreTienda}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-prisma-text-secondary mt-0.5">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span>{tienda.nombreTendero || 'Tendero asignado'}</span>
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                      {diaEntrega ? `Reparto: ${diaEntrega}` : 'Activa'}
                    </span>
                  </div>

                  {/* Detalles de Ubicación y Contacto */}
                  <div className="space-y-1.5 py-3 border-y border-gray-100 text-xs text-prisma-text-secondary">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{tienda.direccion} {tienda.barrio ? `· ${tienda.barrio}` : ''}</span>
                    </div>
                    {tienda.telefono && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{tienda.telefono}</span>
                      </div>
                    )}
                    {nit && (
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>NIT / CC: {nit}</span>
                      </div>
                    )}
                  </div>

                  {/* Métricas Comerciales */}
                  <div className="grid grid-cols-2 gap-3 py-3">
                    <div className="bg-gray-50 rounded-xl p-2.5">
                      <span className="text-[11px] text-prisma-text-secondary block font-medium">Total Comprado</span>
                      <span className="text-sm font-bold text-prisma-text-primary">
                        ${totalComprado.toLocaleString('es-CO')}
                      </span>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-2.5">
                      <span className="text-[11px] text-prisma-text-secondary block font-medium">Pedidos Realizados</span>
                      <span className="text-sm font-bold text-prisma-text-primary">
                        {tienda.totalPedidos || 0} pedidos
                      </span>
                    </div>
                  </div>

                {tienda.ultimoPedidoFecha && (
                  <div className="flex items-center gap-1.5 text-[11px] text-prisma-text-secondary mb-3">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span>Último pedido: {new Date(tienda.ultimoPedidoFecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                )}
              </div>

              {/* Acciones de la Tienda */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => abrirAnalisisTienda(tienda)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-teal-50 hover:bg-teal-100 text-prisma-teal rounded-xl text-xs font-semibold transition border border-teal-200"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Ver Ventas</span>
                  <ChevronRight className="w-3 h-3 ml-auto text-prisma-teal" />
                </button>
                <button
                  onClick={() => handleAbrirEditar(tienda)}
                  className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl transition border border-gray-200"
                  title="Editar datos de la tienda"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleEliminarTienda(tienda.id || tienda.tiendaId, tienda.nombreTienda)}
                  className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition border border-red-200"
                  title="Dar de baja / Inactivar tienda"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Registrar Nueva Tienda */}
      {modalCrear && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-prisma-border animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-prisma-border mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-50 rounded-xl text-prisma-teal">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-prisma-text-primary">Registrar Nueva Tienda</h3>
                  <p className="text-xs text-prisma-text-secondary">Agregar punto de venta a su red de clientes</p>
                </div>
              </div>
              <button
                onClick={() => setModalCrear(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearTienda} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-prisma-text-secondary mb-1">
                    Nombre del Negocio / Tienda *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Tienda Mi Esperanza"
                    value={nuevaTienda.nombreTienda}
                    onChange={(e) => setNuevaTienda({ ...nuevaTienda, nombreTienda: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-prisma-border rounded-xl focus:outline-none focus:ring-2 focus:ring-prisma-teal/20 focus:border-prisma-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-prisma-text-secondary mb-1">
                    Nombre del Tendero / Responsable *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Carmen Mendoza"
                    value={nuevaTienda.nombreTendero}
                    onChange={(e) => setNuevaTienda({ ...nuevaTienda, nombreTendero: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-prisma-border rounded-xl focus:outline-none focus:ring-2 focus:ring-prisma-teal/20 focus:border-prisma-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-prisma-text-secondary mb-1">
                    Teléfono de Contacto
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 315 889 0012"
                    value={nuevaTienda.telefono}
                    onChange={(e) => setNuevaTienda({ ...nuevaTienda, telefono: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-prisma-border rounded-xl focus:outline-none focus:ring-2 focus:ring-prisma-teal/20 focus:border-prisma-teal"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-prisma-text-secondary mb-1">
                    Dirección Completa *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Carrera 15 # 45-20"
                    value={nuevaTienda.direccion}
                    onChange={(e) => setNuevaTienda({ ...nuevaTienda, direccion: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-prisma-border rounded-xl focus:outline-none focus:ring-2 focus:ring-prisma-teal/20 focus:border-prisma-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-prisma-text-secondary mb-1">
                    Barrio / Sector
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Chapinero"
                    value={nuevaTienda.barrio}
                    onChange={(e) => setNuevaTienda({ ...nuevaTienda, barrio: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-prisma-border rounded-xl focus:outline-none focus:ring-2 focus:ring-prisma-teal/20 focus:border-prisma-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-prisma-text-secondary mb-1">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    value={nuevaTienda.ciudad}
                    onChange={(e) => setNuevaTienda({ ...nuevaTienda, ciudad: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-prisma-border rounded-xl focus:outline-none focus:ring-2 focus:ring-prisma-teal/20 focus:border-prisma-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-prisma-text-secondary mb-1">
                    NIT o Cédula
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 900.123.456-1"
                    value={nuevaTienda.nitOIdentificacion}
                    onChange={(e) => setNuevaTienda({ ...nuevaTienda, nitOIdentificacion: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-prisma-border rounded-xl focus:outline-none focus:ring-2 focus:ring-prisma-teal/20 focus:border-prisma-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-prisma-text-secondary mb-1">
                    Día Preferido de Entrega
                  </label>
                  <select
                    value={nuevaTienda.diaEntrega}
                    onChange={(e) => setNuevaTienda({ ...nuevaTienda, diaEntrega: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-prisma-border rounded-xl focus:outline-none focus:ring-2 focus:ring-prisma-teal/20 focus:border-prisma-teal"
                  >
                    <option value="LUNES">Lunes</option>
                    <option value="MARTES">Martes</option>
                    <option value="MIERCOLES">Miércoles</option>
                    <option value="JUEVES">Jueves</option>
                    <option value="VIERNES">Viernes</option>
                    <option value="SABADO">Sábado</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-prisma-border mt-5">
                <button
                  type="button"
                  onClick={() => setModalCrear(false)}
                  className="px-4 py-2 text-sm text-prisma-text-secondary hover:text-prisma-text-primary rounded-xl font-medium transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoTienda}
                  className="px-5 py-2 bg-prisma-teal text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {guardandoTienda ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Guardar Tienda</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Tienda */}
      {modalEditar && tiendaEnEdicion && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-prisma-border animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-prisma-border mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-50 rounded-xl text-prisma-teal">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-prisma-text-primary">Editar Información de la Tienda</h3>
                  <p className="text-xs text-prisma-text-secondary">Actualizar datos de contacto y entrega</p>
                </div>
              </div>
              <button
                onClick={() => { setModalEditar(false); setTiendaEnEdicion(null); }}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarEdicion} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-prisma-text-secondary mb-1">
                    Nombre del Negocio / Tienda *
                  </label>
                  <input
                    type="text"
                    required
                    value={tiendaEnEdicion.nombreTienda}
                    onChange={(e) => setTiendaEnEdicion({ ...tiendaEnEdicion, nombreTienda: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-prisma-border rounded-xl focus:outline-none focus:ring-2 focus:ring-prisma-teal/20 focus:border-prisma-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-prisma-text-secondary mb-1">
                    Nombre del Tendero / Responsable *
                  </label>
                  <input
                    type="text"
                    required
                    value={tiendaEnEdicion.nombreTendero}
                    onChange={(e) => setTiendaEnEdicion({ ...tiendaEnEdicion, nombreTendero: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-prisma-border rounded-xl focus:outline-none focus:ring-2 focus:ring-prisma-teal/20 focus:border-prisma-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-prisma-text-secondary mb-1">
                    Teléfono de Contacto
                  </label>
                  <input
                    type="text"
                    value={tiendaEnEdicion.telefono}
                    onChange={(e) => setTiendaEnEdicion({ ...tiendaEnEdicion, telefono: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-prisma-border rounded-xl focus:outline-none focus:ring-2 focus:ring-prisma-teal/20 focus:border-prisma-teal"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-prisma-text-secondary mb-1">
                    Dirección Completa *
                  </label>
                  <input
                    type="text"
                    required
                    value={tiendaEnEdicion.direccion}
                    onChange={(e) => setTiendaEnEdicion({ ...tiendaEnEdicion, direccion: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-prisma-border rounded-xl focus:outline-none focus:ring-2 focus:ring-prisma-teal/20 focus:border-prisma-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-prisma-text-secondary mb-1">
                    Barrio / Sector
                  </label>
                  <input
                    type="text"
                    value={tiendaEnEdicion.barrio}
                    onChange={(e) => setTiendaEnEdicion({ ...tiendaEnEdicion, barrio: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-prisma-border rounded-xl focus:outline-none focus:ring-2 focus:ring-prisma-teal/20 focus:border-prisma-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-prisma-text-secondary mb-1">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    value={tiendaEnEdicion.ciudad}
                    onChange={(e) => setTiendaEnEdicion({ ...tiendaEnEdicion, ciudad: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-prisma-border rounded-xl focus:outline-none focus:ring-2 focus:ring-prisma-teal/20 focus:border-prisma-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-prisma-text-secondary mb-1">
                    NIT o Cédula
                  </label>
                  <input
                    type="text"
                    value={tiendaEnEdicion.nitOIdentificacion}
                    onChange={(e) => setTiendaEnEdicion({ ...tiendaEnEdicion, nitOIdentificacion: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-prisma-border rounded-xl focus:outline-none focus:ring-2 focus:ring-prisma-teal/20 focus:border-prisma-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-prisma-text-secondary mb-1">
                    Día Preferido de Entrega
                  </label>
                  <select
                    value={tiendaEnEdicion.diaEntrega}
                    onChange={(e) => setTiendaEnEdicion({ ...tiendaEnEdicion, diaEntrega: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-prisma-border rounded-xl focus:outline-none focus:ring-2 focus:ring-prisma-teal/20 focus:border-prisma-teal"
                  >
                    <option value="LUNES">Lunes</option>
                    <option value="MARTES">Martes</option>
                    <option value="MIERCOLES">Miércoles</option>
                    <option value="JUEVES">Jueves</option>
                    <option value="VIERNES">Viernes</option>
                    <option value="SABADO">Sábado</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-prisma-border mt-5">
                <button
                  type="button"
                  onClick={() => { setModalEditar(false); setTiendaEnEdicion(null); }}
                  className="px-4 py-2 text-sm text-prisma-text-secondary hover:text-prisma-text-primary rounded-xl font-medium transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoEdicion}
                  className="px-5 py-2 bg-prisma-teal text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {guardandoEdicion ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Guardar Cambios</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal / Drawer: Análisis de Ventas de la Tienda */}
      {tiendaSeleccionada && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl border border-prisma-border">
            {/* Encabezado Drawer */}
            <div className="flex items-start justify-between pb-4 border-b border-prisma-border mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-prisma-teal font-bold text-xl">
                  {tiendaSeleccionada.nombreTienda ? tiendaSeleccionada.nombreTienda.charAt(0).toUpperCase() : 'T'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-prisma-text-primary">
                      {tiendaSeleccionada.nombreTienda}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-prisma-teal border border-teal-200">
                      Cliente
                    </span>
                  </div>
                  <p className="text-xs text-prisma-text-secondary mt-0.5">
                    Responsable: {tiendaSeleccionada.nombreTendero} · {tiendaSeleccionada.direccion} {tiendaSeleccionada.barrio ? `(${tiendaSeleccionada.barrio})` : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setTiendaSeleccionada(null);
                  setAnalisisVentas(null);
                }}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cargandoAnalisis ? (
              <div className="text-center py-16">
                <RefreshCw className="w-8 h-8 text-prisma-teal animate-spin mx-auto mb-3" />
                <p className="text-sm text-prisma-text-secondary">Analizando ventas y compras históricas de la tienda...</p>
              </div>
            ) : errorAnalisis ? (
              <div className="p-5 bg-red-50 border border-red-200 rounded-2xl text-center text-red-700 text-sm">
                <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
                {errorAnalisis}
              </div>
            ) : analisisVentas ? (() => {
              const totalComprado = Number(analisisVentas.totalGastadoAcumulado ?? analisisVentas.totalCompradoCOP) || 0;
              const totalPedidos = analisisVentas.totalPedidosRealizados ?? analisisVentas.totalPedidos ?? 0;
              const totalUnidades = analisisVentas.totalUnidadesCompradas ?? 0;
              const listaProductos = analisisVentas.rankingProductos || analisisVentas.productosMasVendidos || [];
              const historial = analisisVentas.historialPedidos || [];

              return (
              <div className="space-y-6">
                {/* Resumen Comercial: Cuánto gano en esta tienda */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50/60 p-4 rounded-2xl border border-emerald-200">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                      Facturación Acumulada
                    </span>
                    <span className="text-2xl font-black text-emerald-900">
                      ${totalComprado.toLocaleString('es-CO')}
                    </span>
                    <p className="text-[11px] text-emerald-700 mt-1 font-medium">Ingresos totales generados para tu empresa</p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50/40 p-4 rounded-2xl border border-blue-100">
                    <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider block mb-1">
                      Pedidos Recurrentes
                    </span>
                    <span className="text-2xl font-bold text-blue-900">
                      {totalPedidos} pedidos
                    </span>
                    <p className="text-[11px] text-blue-700 mt-1">Día de entrega: {tiendaSeleccionada.diaPreferidoEntrega || 'Lunes y Jueves'}</p>
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-orange-50/40 p-4 rounded-2xl border border-amber-100">
                    <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block mb-1">
                      Unidades Totales
                    </span>
                    <span className="text-2xl font-bold text-amber-900">
                      {totalUnidades} unidades
                    </span>
                    <p className="text-[11px] text-amber-700 mt-1">Volumen acumulado despachado</p>
                  </div>
                </div>

                {/* Productos a los que está Suscrita / Compra Habitual */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-prisma-teal" />
                      <h4 className="font-bold text-prisma-text-primary text-sm">
                        Productos a los que está suscrita (Pedidos Habituales)
                      </h4>
                    </div>
                    <span className="text-xs text-prisma-text-secondary">
                      Portafolio activo de esta tienda
                    </span>
                  </div>

                  {listaProductos.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center text-xs text-prisma-text-secondary">
                      Esta tienda aún no registra líneas de pedido despachadas por su empresa.
                    </div>
                  ) : (
                    <div className="bg-white border border-prisma-border rounded-2xl overflow-hidden shadow-sm divide-y divide-gray-100">
                      {listaProductos.map((prod, idx) => {
                        const unidades = prod.unidades ?? prod.unidadesVendidas ?? 0;
                        const dinero = Number(prod.totalDinero ?? prod.totalVentasCOP) || 0;
                        const pct = prod.porcentajeVentas ?? prod.porcentajeDeVenta ?? 0;
                        return (
                          <div key={idx} className="p-4 hover:bg-gray-50/50 transition">
                            <div className="flex items-center justify-between gap-4 mb-2">
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-lg bg-gray-100 text-prisma-text-secondary text-xs font-bold flex items-center justify-center">
                                  #{idx + 1}
                                </span>
                                <div>
                                  <span className="font-bold text-sm text-prisma-text-primary">
                                    {prod.nombreProducto}
                                  </span>
                                  {prod.presentacion && (
                                    <span className="text-xs text-gray-400 ml-1">({prod.presentacion})</span>
                                  )}
                                  <span className="text-xs text-prisma-text-secondary ml-2">
                                    · {unidades} unidades
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-sm text-prisma-text-primary">
                                  ${dinero.toLocaleString('es-CO')}
                                </span>
                                <span className="text-xs text-prisma-teal font-semibold ml-2">
                                  {pct}% de sus compras
                                </span>
                              </div>
                            </div>

                            {/* Barra de progreso de participación */}
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-prisma-teal h-2 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Historial de Pedidos */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-prisma-teal" />
                    <h4 className="font-bold text-prisma-text-primary text-sm">
                      Historial de Pedidos Recientes
                    </h4>
                  </div>

                  {historial.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center text-xs text-prisma-text-secondary">
                      No hay pedidos registrados para esta tienda.
                    </div>
                  ) : (
                    <div className="border border-prisma-border rounded-2xl overflow-hidden shadow-sm">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 border-b border-prisma-border text-prisma-text-secondary font-semibold">
                          <tr>
                            <th className="py-2.5 px-4">Pedido</th>
                            <th className="py-2.5 px-4">Fecha</th>
                            <th className="py-2.5 px-4">Estado</th>
                            <th className="py-2.5 px-4 text-right">Total Facturado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {historial.map((ped) => {
                            const pedId = ped.numeroPedido || `#${ped.id || ped.pedidoId}`;
                            const fechaRaw = ped.fecha || ped.fechaCreacion;
                            const totalPed = Number(ped.total ?? ped.totalCOP) || 0;
                            return (
                              <tr key={ped.id || ped.pedidoId || ped.numeroPedido} className="hover:bg-gray-50/50 transition">
                                <td className="py-2.5 px-4 font-semibold text-prisma-text-primary">
                                  {pedId}
                                </td>
                                <td className="py-2.5 px-4 text-prisma-text-secondary">
                                  {fechaRaw
                                    ? new Date(fechaRaw).toLocaleDateString('es-CO', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                      })
                                    : 'Fecha no registrada'}
                                </td>
                                <td className="py-2.5 px-4">
                                  <span className={`px-2 py-0.5 rounded-full font-medium ${
                                    ped.estado === 'ENTREGADO'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : ped.estado === 'EN_RUTA'
                                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                                  }`}>
                                    {ped.estado}
                                  </span>
                                </td>
                                <td className="py-2.5 px-4 text-right font-bold text-prisma-text-primary">
                                  ${totalPed.toLocaleString('es-CO')}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
              );
            })() : null}

            {/* Pie de Drawer */}
            <div className="flex justify-end pt-5 border-t border-prisma-border mt-6">
              <button
                onClick={() => {
                  setTiendaSeleccionada(null);
                  setAnalisisVentas(null);
                }}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-prisma-text-primary rounded-xl text-xs font-semibold transition"
              >
                Cerrar Análisis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default TiendasProveedorPage;
