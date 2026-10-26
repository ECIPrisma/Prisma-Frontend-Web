import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminService, proveedorService } from '../../services/api';
import { 
  LogOut, 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  MessageSquare, 
  Truck, 
  ChevronRight, 
  X, 
  CheckCheck 
} from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const rol = user?.rol || user?.usuario?.rol;
  const nombre = user?.nombreCompleto || user?.usuario?.nombreCompleto || 'Usuario';
  const email = user?.email || user?.usuario?.email || '';
  const isPlatformAdmin = rol === 'ROLE_PLATFORM_ADMIN' || rol === 'ROLE_ADMIN' || rol === 'ROLE_SOPORTE';

  const [isOpen, setIsOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [leidas, setLeidas] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('prisma_notificaciones_leidas') || '[]');
    } catch {
      return [];
    }
  });
  const popoverRef = useRef(null);

  // Cierre al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Carga periódica de alertas reales según el rol (cada 4s silencioso)
  useEffect(() => {
    let cancelado = false;

    const cargarAlertas = async () => {
      if (!user) return;
      try {
        const items = [];

        if (isPlatformAdmin) {
          // Admin Prisma: Disputas abiertas y contingencias de entrega
          const disputas = await adminService.getDisputas();
          if (Array.isArray(disputas)) {
            disputas.forEach((d) => {
              const esProveedor = d.proveedor != null || (d.tipoIncidente && d.tipoIncidente.includes('COMISION'));
              const esAbierto = d.estado === 'ABIERTO';
              items.push({
                id: `disp-${d.id}`,
                tipo: esAbierto ? 'alerta' : 'info',
                titulo: `Disputa #${d.ticketNumero}`,
                subtitulo: esProveedor 
                  ? `Reclamo de ${d.proveedor?.nombreComercial || 'Productor'}` 
                  : `Incidente en pedido #${d.pedido?.numeroPedido || 'N/A'}`,
                descripcion: d.descripcion,
                fecha: d.fechaReporte ? new Date(d.fechaReporte).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Reciente',
                estado: d.estado,
                ruta: '/disputas',
                icono: esProveedor ? 'proveedor' : 'tienda',
              });
            });
          }
        } else {
          // Proveedor: Reclamos de tenderos y respuestas de Prisma
          const pqrs = await proveedorService.getMisPqrs();
          if (Array.isArray(pqrs)) {
            pqrs.forEach((item) => {
              const esMio = item.origen === 'PROVEEDOR_A_PRISMA';
              const esAbierto = item.estado === 'ABIERTO';
              items.push({
                id: `pqrs-${item.id}`,
                tipo: esAbierto ? 'alerta' : 'exito',
                titulo: esMio ? `Disputa a Prisma #${item.ticketNumero}` : `Reclamo de Tienda #${item.ticketNumero}`,
                subtitulo: esMio 
                  ? `Estado: ${item.estado}` 
                  : (item.pedido?.tienda?.nombreTienda || 'Tienda cliente'),
                descripcion: item.descripcion,
                fecha: item.fechaReporte ? new Date(item.fechaReporte).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Hoy',
                estado: item.estado,
                ruta: '/pqrs',
                icono: 'mensaje',
              });
            });
          }

          // Alerta logística de flota: camiones o rutas con percance
          try {
            const camiones = await proveedorService.getCamiones();
            if (Array.isArray(camiones)) {
              camiones.forEach((c) => {
                if (c.estado === 'VARADO' || c.estado === 'MANTENIMIENTO') {
                  items.unshift({
                    id: `camion-${c.id}`,
                    tipo: 'urgente',
                    titulo: `Vehículo ${c.placa} en auxilio mecánico`,
                    subtitulo: `Modelo: ${c.marcaModelo}`,
                    descripcion: 'El vehículo reportó percance mecánico en ruta. Requiere atención inmediata.',
                    fecha: 'En curso',
                    estado: 'VARADO',
                    ruta: '/flota',
                    icono: 'camion',
                  });
                }
              });
            }
          } catch {
            // Ignorar silencioso
          }
        }

        if (!cancelado) {
          setNotificaciones(items);
        }
      } catch (err) {
        // Silencioso
      }
    };

    cargarAlertas();
    const interval = setInterval(cargarAlertas, 4000);
    return () => {
      cancelado = true;
      clearInterval(interval);
    };
  }, [user, isPlatformAdmin]);

  const noLeidas = notificaciones.filter(n => !leidas.includes(n.id));
  const cantidadNoLeidas = noLeidas.length;

  const handleMarcarTodasLeidas = () => {
    const todosIds = notificaciones.map(n => n.id);
    const nuevasLeidas = Array.from(new Set([...leidas, ...todosIds]));
    setLeidas(nuevasLeidas);
    localStorage.setItem('prisma_notificaciones_leidas', JSON.stringify(nuevasLeidas));
  };

  const handleAbrirNotificacion = (notif) => {
    if (!leidas.includes(notif.id)) {
      const nuevasLeidas = [...leidas, notif.id];
      setLeidas(nuevasLeidas);
      localStorage.setItem('prisma_notificaciones_leidas', JSON.stringify(nuevasLeidas));
    }
    setIsOpen(false);
    navigate(notif.ruta);
  };

  return (
    <header className="bg-white border-b border-prisma-border h-16 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-3">
        <img 
          src="/logo_icono_tienda.png" 
          alt="PRISMA Logo" 
          className="h-10 w-10 object-contain rounded-lg p-1 bg-prisma-teal/10"
        />
        <div>
          <span className="text-xl font-bold tracking-tight text-prisma-text-primary">
            PRISMA
          </span>
          <span className="text-xs ml-2 px-2.5 py-0.5 rounded-full bg-prisma-orange/20 text-prisma-orange-dark font-semibold">
            {isPlatformAdmin ? 'Administrador' : 'Distribuidor'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Campanita Interactiva con Popover */}
        <div className="relative" ref={popoverRef}>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            title="Centro de Notificaciones"
            className={`relative p-2 rounded-full transition cursor-pointer ${
              isOpen 
                ? 'bg-prisma-teal/10 text-prisma-teal' 
                : 'text-prisma-text-secondary hover:text-prisma-text-primary hover:bg-gray-100'
            }`}
          >
            <Bell className="w-5 h-5" />
            {cantidadNoLeidas > 0 && (
              <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 bg-prisma-orange text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-sm">
                {cantidadNoLeidas > 9 ? '9+' : cantidadNoLeidas}
              </span>
            )}
          </button>

          {/* Menú Flotante de Notificaciones */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-prisma-border overflow-hidden z-50 animate-in fade-in duration-200">
              <div className="p-4 bg-gray-50/80 border-b border-prisma-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-prisma-text-primary">Notificaciones</h3>
                  {cantidadNoLeidas > 0 && (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      {cantidadNoLeidas} nuevas
                    </span>
                  )}
                </div>
                {cantidadNoLeidas > 0 && (
                  <button 
                    onClick={handleMarcarTodasLeidas}
                    className="text-[11px] text-prisma-teal hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Marcar leídas
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                {notificaciones.length === 0 ? (
                  <div className="p-8 text-center text-xs text-prisma-text-secondary space-y-2">
                    <CheckCircle className="w-8 h-8 mx-auto text-emerald-500 opacity-80" />
                    <p className="font-semibold text-prisma-text-primary">Todo al día</p>
                    <p>No tienes incidentes ni alertas pendientes en la red.</p>
                  </div>
                ) : (
                  notificaciones.map((n) => {
                    const estaLeida = leidas.includes(n.id);
                    return (
                      <div
                        key={n.id}
                        onClick={() => handleAbrirNotificacion(n)}
                        className={`p-3.5 flex items-start gap-3 hover:bg-gray-50/80 transition cursor-pointer ${
                          estaLeida ? 'opacity-65 bg-white' : 'bg-emerald-50/20'
                        }`}
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          {n.icono === 'camion' ? (
                            <span className="p-2 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
                              <Truck className="w-4 h-4" />
                            </span>
                          ) : n.estado === 'ABIERTO' || n.tipo === 'alerta' ? (
                            <span className="p-2 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                              <AlertTriangle className="w-4 h-4" />
                            </span>
                          ) : (
                            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                              <CheckCircle className="w-4 h-4" />
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-bold text-prisma-text-primary truncate">
                              {n.titulo}
                            </p>
                            <span className="text-[10px] text-gray-400 flex-shrink-0">
                              {n.fecha}
                            </span>
                          </div>
                          <p className="text-[11px] font-medium text-prisma-text-secondary truncate">
                            {n.subtitulo}
                          </p>
                          <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                            {n.descripcion}
                          </p>
                        </div>

                        <ChevronRight className="w-4 h-4 text-gray-400 self-center flex-shrink-0" />
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-2.5 bg-gray-50 text-center border-t border-prisma-border">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate(isPlatformAdmin ? '/disputas' : '/pqrs');
                  }}
                  className="text-xs text-prisma-teal font-semibold hover:underline cursor-pointer"
                >
                  Ver centro de gestión completo &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pl-3 border-l border-prisma-border">
          <div className="w-8 h-8 rounded-full bg-prisma-teal text-white flex items-center justify-center font-bold text-sm">
            {nombre.charAt(0) || 'U'}
          </div>
          <div className="hidden md:block text-left text-xs">
            <p className="font-semibold text-prisma-text-primary leading-tight">{nombre}</p>
            <p className="text-prisma-text-secondary">{email}</p>
          </div>
        </div>

        <button
          onClick={logout}
          title="Cerrar sesión"
          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
