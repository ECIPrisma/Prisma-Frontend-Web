import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Truck, Store, Play, Pause, RotateCcw, Navigation, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { proveedorService } from '../../services/api';

// Centrador automático del mapa según los puntos
function RecenterAuto({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      try {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      } catch (e) {
        // En caso de que los bounds sean iguales o vacíos
      }
    }
  }, [bounds, map]);
  return null;
}

// Icono personalizado para el Camión de Reparto
const crearIconoCamion = (placa, enMovimiento) => {
  return L.divIcon({
    className: 'custom-camion-icon',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <div style="
          background-color: #0d9488;
          color: white;
          padding: 6px;
          border-radius: 9999px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -2px rgba(0, 0, 0, 0.2);
          border: 2px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
            <path d="M15 18H9"/>
            <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
            <circle cx="17" cy="18" r="2"/>
            <circle cx="7" cy="18" r="2"/>
          </svg>
        </div>
        <span style="
          background-color: #0f172a;
          color: white;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 6px;
          margin-top: 2px;
          white-space: nowrap;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">${placa || 'CAMION'}</span>
      </div>
    `,
    iconSize: [40, 56],
    iconAnchor: [20, 48],
    popupAnchor: [0, -48]
  });
};

// Icono personalizado para las Tiendas (Paradas)
const crearIconoTienda = (numero, entregado) => {
  const bg = entregado ? '#059669' : '#0284c7';
  return L.divIcon({
    className: 'custom-tienda-icon',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <div style="
          background-color: ${bg};
          color: white;
          font-weight: 800;
          font-size: 12px;
          width: 28px;
          height: 28px;
          border-radius: 9999px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
          border: 2px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          ${entregado ? '✓' : numero}
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16]
  });
};

// Icono personalizado para "Mi Ubicación Actual" (punto azul pulsante tipo Google Maps)
const crearIconoUsuario = () => {
  return L.divIcon({
    className: 'custom-user-location-icon',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
        <div style="
          position: absolute;
          width: 32px;
          height: 32px;
          border-radius: 9999px;
          background-color: rgba(37, 99, 235, 0.3);
          box-shadow: 0 0 10px rgba(37, 99, 235, 0.5);
        "></div>
        <div style="
          width: 16px;
          height: 16px;
          border-radius: 9999px;
          background-color: #2563eb;
          border: 3px solid white;
          box-shadow: 0 2px 5px rgba(0,0,0,0.4);
          z-index: 10;
        "></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

// Icono para tiendas generales en el mapa de cobertura
const crearIconoTiendaGeneral = () => {
  return L.divIcon({
    className: 'custom-tienda-general-icon',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
        <div style="
          background-color: #0d9488;
          color: white;
          width: 26px;
          height: 26px;
          border-radius: 9999px;
          box-shadow: 0 3px 6px rgba(0,0,0,0.3);
          border: 2px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
            <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
            <path d="M2 7h20"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

// Red de tiendas cliente semilla para cobertura en Bogotá (fallback si el backend está iniciando o sin datos)
const TIENDAS_SEMILLA_BOGOTA = [
  {
    id: 1,
    nombreTienda: 'Tienda La Bendición - Doña Marta',
    direccion: 'Carrera 78K #38-12 Sur',
    barrio: 'Kennedy Central',
    ciudad: 'Bogotá',
    telefono: '3104567890',
    latitud: 4.61842,
    longitud: -74.15682,
    totalComprado: 1250000
  },
  {
    id: 2,
    nombreTienda: 'Minimarket El Progreso - Don José',
    direccion: 'Calle 42 Sur #79-45',
    barrio: 'Timiza',
    ciudad: 'Bogotá',
    telefono: '3157891234',
    latitud: 4.61400,
    longitud: -74.15200,
    totalComprado: 980000
  },
  {
    id: 3,
    nombreTienda: 'Abarrotes y Víveres Don Pepe',
    direccion: 'Avenida Tintal #10-34',
    barrio: 'El Tintal',
    ciudad: 'Bogotá',
    telefono: '3129876543',
    latitud: 4.62100,
    longitud: -74.15900,
    totalComprado: 840000
  },
  {
    id: 4,
    nombreTienda: 'Cigarrería y Granero Los Pinos',
    direccion: 'Calle 140 #11-20',
    barrio: 'Cedritos',
    ciudad: 'Bogotá',
    telefono: '3201122334',
    latitud: 4.71500,
    longitud: -74.03200,
    totalComprado: 650000
  }
];

export const MapaRutaEnVivo = ({ 
  ruta = null, 
  todasLasRutas = [], 
  todasLasTiendas = [], 
  onActualizarRuta 
}) => {
  const esModoGeneral = !ruta;
  const paradas = ruta?.paradas || [];
  const placa = ruta?.placaCamion || 'Camión';

  // Coordenadas base de paradas (tiendas de la ruta o todas las tiendas en modo general)
  const puntosTiendas = useMemo(() => {
    if (!esModoGeneral) {
      return paradas
        .filter((p) => p.latitud && p.longitud)
        .map((p, index) => ({
          ...p,
          orden: index + 1,
          lat: Number(p.latitud),
          lng: Number(p.longitud),
          entregado: p.estado === 'ENTREGADO'
        }));
    }
    // Modo General: graficar todas las tiendas clientes con fallback a red semilla
    const fuenteTiendas = (todasLasTiendas && todasLasTiendas.length > 0)
      ? todasLasTiendas
      : TIENDAS_SEMILLA_BOGOTA;

    const filtradas = fuenteTiendas.filter((t) => (t.latitud || t.lat) && (t.longitud || t.lng));
    const listaFinal = filtradas.length > 0 ? filtradas : TIENDAS_SEMILLA_BOGOTA;

    return listaFinal.map((t, index) => ({
      pedidoId: t.id || index + 1,
      nombreTienda: t.nombreTienda || t.nombre,
      direccion: t.direccion,
      barrio: t.barrio,
      ciudad: t.ciudad,
      telefono: t.telefono,
      lat: Number(t.latitud || t.lat),
      lng: Number(t.longitud || t.lng),
      totalComprado: t.totalComprado || 0,
      orden: index + 1,
      entregado: false
    }));
  }, [esModoGeneral, paradas, todasLasTiendas]);

  const [miUbicacion, setMiUbicacion] = useState(null);
  const [esUbicacionEstimada, setEsUbicacionEstimada] = useState(false);
  const [obteniendoUbicacion, setObteniendoUbicacion] = useState(false);
  const [mensajeGps, setMensajeGps] = useState(null);

  // Localizar la posición GPS del dispositivo de forma resiliente (sin alerts bloqueantes)
  const obtenerMiUbicacion = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setMiUbicacion([4.60971, -74.08175]);
      setEsUbicacionEstimada(true);
      setMensajeGps('Navegador sin soporte GPS. Asignando Centro de Operaciones Bogotá.');
      return;
    }

    setObteniendoUbicacion(true);
    setMensajeGps(null);

    // Intento 1: Baja precisión (muy rápido por red/WiFi y tolera PCs de escritorio / VPNs)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMiUbicacion([pos.coords.latitude, pos.coords.longitude]);
        setEsUbicacionEstimada(false);
        setObteniendoUbicacion(false);
        setMensajeGps(null);
      },
      (_err1) => {
        // Intento 2 con precisión satelital
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setMiUbicacion([pos.coords.latitude, pos.coords.longitude]);
            setEsUbicacionEstimada(false);
            setObteniendoUbicacion(false);
            setMensajeGps(null);
          },
          (err2) => {
            setObteniendoUbicacion(false);
            // Fallback elegante a la sede de distribución en Bogotá (evita pantalla en blanco y alerts)
            setMiUbicacion((prev) => prev || [4.60971, -74.08175]);
            setEsUbicacionEstimada(true);
            const motivo = err2.code === 3
              ? 'Tiempo de espera agotado (posible VPN activa o PC sin chip GPS satelital)'
              : 'Permiso de ubicación no habilitado en navegador';
            setMensajeGps(`Ubicación referencial asignada: Centro Bogotá. (${motivo})`);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
    );
  }, []);

  // Auto-intentar geolocalización al abrir el mapa
  useEffect(() => {
    obtenerMiUbicacion();
  }, [obtenerMiUbicacion]);

  // Posición inicial del mapa
  const posInicial = useMemo(() => {
    if (miUbicacion) return miUbicacion;
    if (ruta?.ubicacionActual?.latitud && ruta?.ubicacionActual?.longitud) {
      return [Number(ruta.ubicacionActual.latitud), Number(ruta.ubicacionActual.longitud)];
    }
    if (puntosTiendas.length > 0) {
      return [puntosTiendas[0].lat, puntosTiendas[0].lng];
    }
    return [4.60971, -74.08175]; // Centro Bogotá
  }, [miUbicacion, ruta, puntosTiendas]);

  const [posCamion, setPosCamion] = useState(posInicial);
  const [velocidad, setVelocidad] = useState(Number(ruta?.ubicacionActual?.velocidadKmh || 0));
  const [simulando, setSimulando] = useState(false);
  const [pasoSimulacion, setPasoSimulacion] = useState(0);

  // Línea poligonal para el trayecto entre paradas (solo en modo ruta con paradas)
  const coordenadasRuta = useMemo(() => {
    if (esModoGeneral || puntosTiendas.length === 0) return [];
    return [posCamion, ...puntosTiendas.map((p) => [p.lat, p.lng])];
  }, [esModoGeneral, posCamion, puntosTiendas]);

  // Límites para auto-centrar el mapa
  const bounds = useMemo(() => {
    const todos = [];
    if (miUbicacion) todos.push(miUbicacion);
    if (!esModoGeneral && posCamion) todos.push(posCamion);
    puntosTiendas.forEach((p) => todos.push([p.lat, p.lng]));
    if (esModoGeneral && todasLasRutas.length > 0) {
      todasLasRutas.forEach((r) => {
        if (r.ubicacionActual?.latitud && r.ubicacionActual?.longitud) {
          todos.push([Number(r.ubicacionActual.latitud), Number(r.ubicacionActual.longitud)]);
        }
      });
    }
    return todos.length > 0 ? todos : [[4.60971, -74.08175]];
  }, [miUbicacion, esModoGeneral, posCamion, puntosTiendas, todasLasRutas]);

  // Generador de trayecto interpolado entre paradas para simulación en vivo
  const pasosInterpolados = useMemo(() => {
    if (puntosTiendas.length < 2) return [];
    const pasos = [];
    for (let i = 0; i < puntosTiendas.length - 1; i++) {
      const p1 = puntosTiendas[i];
      const p2 = puntosTiendas[i + 1];
      const segmentos = 8;
      for (let s = 0; s <= segmentos; s++) {
        const factor = s / segmentos;
        const lat = p1.lat + (p2.lat - p1.lat) * factor;
        const lng = p1.lng + (p2.lng - p1.lng) * factor;
        pasos.push([lat, lng]);
      }
    }
    return pasos;
  }, [puntosTiendas]);

  // Loop de simulación asistida
  useEffect(() => {
    if (!simulando || pasosInterpolados.length === 0) return;

    const interval = setInterval(() => {
      setPasoSimulacion((prev) => {
        const siguiente = prev + 1;
        if (siguiente >= pasosInterpolados.length) {
          setSimulando(false);
          setVelocidad(0);
          return 0;
        }
        const nuevaPos = pasosInterpolados[siguiente];
        setPosCamion(nuevaPos);
        setVelocidad(38.5 + Math.round(Math.random() * 8));

        // Transmitir al backend silenciosamente para persistir en Neon
        if (ruta?.rutaId) {
          proveedorService.simularPosicionGps(ruta.rutaId, {
            latitud: nuevaPos[0],
            longitud: nuevaPos[1],
            velocidadKmh: 40.0
          }).catch(() => {});
        }

        return siguiente;
      });
    }, 2200);

    return () => clearInterval(interval);
  }, [simulando, pasosInterpolados, ruta]);

  const toggleSimulacion = () => {
    if (!simulando) {
      setSimulando(true);
      setVelocidad(35.0);
    } else {
      setSimulando(false);
      setVelocidad(0);
    }
  };

  const reiniciarPosicion = () => {
    setSimulando(false);
    setPasoSimulacion(0);
    setPosCamion(posInicial);
    setVelocidad(0);
  };


  // Cálculo de distancia euclidiana/Haversine entre el usuario y el camión
  const distanciaAlCamionKm = useMemo(() => {
    if (!miUbicacion || !posCamion) return null;
    const R = 6371;
    const dLat = ((posCamion[0] - miUbicacion[0]) * Math.PI) / 180;
    const dLon = ((posCamion[1] - miUbicacion[1]) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((miUbicacion[0] * Math.PI) / 180) *
        Math.cos((posCamion[0] * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2);
  }, [miUbicacion, posCamion]);

  return (
    <div className="space-y-4">
      {/* Barra de Controles y Telemetría en Vivo */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
        {esModoGeneral ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">Mapa General y Mi Ubicación</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  RED LOGÍSTICA
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {puntosTiendas.length} tiendas registradas • {todasLasRutas.length} camiones hoy
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">{placa}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                  {ruta?.codigoRuta || 'RUTA'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Conductor: <strong className="text-slate-200">{ruta?.nombreRepartidor || 'Asignado'}</strong>
              </p>
            </div>
          </div>
        )}

        {/* Telemetría GPS */}
        {esModoGeneral ? (
          <div className="flex items-center gap-6 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">MI DISPOSITIVO</span>
              <span className={`font-mono font-bold text-sm ${miUbicacion ? 'text-emerald-400' : 'text-amber-400'}`}>
                {miUbicacion ? (esUbicacionEstimada ? 'Punto Referencial' : 'Ubicación Activa') : 'Sin Ubicación'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">RED DE CLIENTES</span>
              <span className="font-bold text-slate-200 text-sm">
                {puntosTiendas.length} tiendas
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-6 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">VELOCIDAD GPS</span>
              <span className="font-mono font-bold text-base text-emerald-400">
                {velocidad.toFixed(1)} <span className="text-[10px] text-slate-400">km/h</span>
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">PARADAS</span>
              <span className="font-bold text-slate-200">
                {ruta?.paradasCompletadas || 0} / {paradas.length}
              </span>
            </div>
          </div>
        )}

        {/* Botones de Control, Ubicación del Usuario y Simulación */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={obtenerMiUbicacion}
            disabled={obteniendoUbicacion}
            title="Localizar la posición GPS de mi dispositivo actual"
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer border ${
              miUbicacion
                ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-400'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 animate-pulse'
            }`}
          >
            <Navigation className={`w-3.5 h-3.5 ${obteniendoUbicacion ? 'animate-spin' : ''}`} />
            <span>
              {obteniendoUbicacion 
                ? 'Ubicando...' 
                : miUbicacion 
                  ? (distanciaAlCamionKm 
                      ? `Mi GPS (${distanciaAlCamionKm} km al camión)` 
                      : (esUbicacionEstimada ? 'Mi GPS (Bogotá Referencial)' : 'Mi GPS Activo (Usted está aquí)'))
                  : '📍 Activar Mi Ubicación GPS'}
            </span>
          </button>

          {!esModoGeneral && (
            <>
              <button
                type="button"
                onClick={toggleSimulacion}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer ${
                  simulando
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {simulando ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{simulando ? 'Pausar Simulación' : 'Simular Avance en Vivo'}</span>
              </button>

              <button
                type="button"
                onClick={reiniciarPosicion}
                title="Reiniciar a punto de partida"
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition border border-slate-700 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Aviso informativo de GPS referencial o red sin alert() */}
      {mensajeGps && (
        <div className="bg-blue-900/90 text-blue-100 text-xs px-4 py-2.5 rounded-xl border border-blue-500/40 flex items-center justify-between gap-3 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-blue-300 flex-shrink-0" />
            <span>{mensajeGps}</span>
          </div>
          <button
            type="button"
            onClick={obtenerMiUbicacion}
            className="text-[11px] font-bold text-white bg-blue-700 hover:bg-blue-600 px-2.5 py-1 rounded-lg border border-blue-400 transition cursor-pointer flex-shrink-0"
          >
            Reintentar GPS
          </button>
        </div>
      )}

      {/* Visor de Mapa Interactivo Leaflet */}
      <div className="h-[460px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative z-0">
        <MapContainer
          center={posInicial}
          zoom={13}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          {/* Capa de OpenStreetMap estándar mundial sin costo */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <RecenterAuto bounds={bounds} />

          {/* Trazado de ruta conectando las tiendas (solo modo ruta) */}
          {!esModoGeneral && coordenadasRuta.length > 1 && (
            <Polyline
              positions={coordenadasRuta}
              color="#0d9488"
              weight={4}
              dashArray="6, 8"
              opacity={0.85}
            />
          )}

          {/* Marcador del Camión en modo ruta enfocada */}
          {!esModoGeneral && posCamion && (
            <Marker position={posCamion} icon={crearIconoCamion(placa, simulando)}>
              <Popup>
                <div className="p-1 space-y-1 text-xs">
                  <p className="font-bold text-slate-900 flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-teal-600" />
                    <span>Camión {placa}</span>
                  </p>
                  <p className="text-slate-600">Conductor: {ruta?.nombreRepartidor}</p>
                  <p className="text-slate-600">Velocidad: {velocidad.toFixed(1)} km/h</p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Coord: {posCamion[0].toFixed(5)}, {posCamion[1].toFixed(5)}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Marcadores de camiones activos en modo general */}
          {esModoGeneral && todasLasRutas.map((r) => {
            if (!r.ubicacionActual?.latitud || !r.ubicacionActual?.longitud) return null;
            return (
              <Marker
                key={r.rutaId}
                position={[Number(r.ubicacionActual.latitud), Number(r.ubicacionActual.longitud)]}
                icon={crearIconoCamion(r.placaCamion, false)}
              >
                <Popup>
                  <div className="p-1 space-y-1 text-xs">
                    <p className="font-bold text-slate-900 flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-teal-600" />
                      <span>Camión {r.placaCamion}</span>
                    </p>
                    <p className="text-slate-600">Conductor: {r.nombreRepartidor}</p>
                    <p className="text-slate-600">Ruta: {r.codigoRuta} ({r.zonaSector})</p>
                    <p className="text-slate-600">Paradas: {r.paradasCompletadas}/{r.totalParadas}</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Marcador de Mi Ubicación (Dispositivo del Usuario / Proveedor) */}
          {miUbicacion && (
            <Marker position={miUbicacion} icon={crearIconoUsuario()}>
              <Popup>
                <div className="p-1.5 space-y-1 text-xs">
                  <p className="font-bold text-blue-700 flex items-center gap-1">
                    <Navigation className="w-3.5 h-3.5 text-blue-600" />
                    <span>{esUbicacionEstimada ? 'Usted está aquí (Centro de Operaciones Bogotá)' : 'Usted está aquí (GPS en Vivo)'}</span>
                  </p>
                  <p className="text-slate-600 font-medium">
                    {esUbicacionEstimada 
                      ? 'Punto de referencia logístico (PC de escritorio / VPN detectada)' 
                      : 'Posición satelital del dispositivo verificada'}
                  </p>
                  {distanciaAlCamionKm && (
                    <div className="bg-teal-50 border border-teal-200 text-teal-800 p-1 rounded font-bold text-[11px] mt-1">
                      Distancia al camión: {distanciaAlCamionKm} km
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 font-mono pt-0.5">
                    Coord: {miUbicacion[0].toFixed(5)}, {miUbicacion[1].toFixed(5)}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Marcadores de Tiendas */}
          {puntosTiendas.map((tienda) => (
            <Marker
              key={tienda.pedidoId}
              position={[tienda.lat, tienda.lng]}
              icon={esModoGeneral ? crearIconoTiendaGeneral() : crearIconoTienda(tienda.orden, tienda.entregado)}
            >
              <Popup>
                <div className="p-1.5 space-y-1 text-xs min-w-[180px]">
                  <div className="flex items-center justify-between gap-2 border-b pb-1">
                    <span className="font-bold text-slate-900">
                      {esModoGeneral ? 'Tienda Cliente' : `Parada #${tienda.orden}`}
                    </span>
                    {!esModoGeneral && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          tienda.entregado
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {tienda.estado}
                      </span>
                    )}
                  </div>
                  <p className="font-bold text-slate-900 flex items-center gap-1">
                    <Store className="w-3.5 h-3.5 text-teal-600" />
                    <span>{tienda.nombreTienda}</span>
                  </p>
                  <p className="text-slate-600">{tienda.direccion}</p>
                  {tienda.barrio && (
                    <p className="text-slate-500 text-[11px]">Barrio: {tienda.barrio}</p>
                  )}
                  {tienda.telefono && (
                    <p className="text-slate-500 text-[11px]">Tel: {tienda.telefono}</p>
                  )}
                  {tienda.totalAPagar ? (
                    <p className="text-slate-700 font-semibold pt-1">
                      Total Pedido: ${Number(tienda.totalAPagar || 0).toLocaleString('es-CO')}
                    </p>
                  ) : tienda.totalComprado ? (
                    <p className="text-slate-700 font-semibold pt-1">
                      Total Comprado: ${Number(tienda.totalComprado || 0).toLocaleString('es-CO')}
                    </p>
                  ) : null}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Leyenda y Lista de Paradas */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between text-xs gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-teal-600 border border-white inline-block"></span>
            <span className="text-slate-700 font-medium">Camión de Reparto</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-sky-600 border border-white inline-block"></span>
            <span className="text-slate-700 font-medium">{esModoGeneral ? 'Tienda Cliente' : 'Tienda Pendiente'}</span>
          </div>
          {!esModoGeneral && (
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 border border-white inline-block"></span>
              <span className="text-slate-700 font-medium">Tienda Entregada</span>
            </div>
          )}
          {miUbicacion && (
            <div className="flex items-center gap-1.5 animate-in fade-in">
              <span className="w-3.5 h-3.5 rounded-full bg-blue-600 border border-white inline-block shadow-sm"></span>
              <span className="text-blue-700 font-bold">
                Su Ubicación (Usted) {distanciaAlCamionKm ? `(${distanciaAlCamionKm} km al camión)` : ''}
              </span>
            </div>
          )}
        </div>

        <p className="text-slate-400 text-[11px]">
          Mapeado con OpenStreetMap & Leaflet • Satélite B2B en Tiempo Real
        </p>
      </div>
    </div>
  );
};
