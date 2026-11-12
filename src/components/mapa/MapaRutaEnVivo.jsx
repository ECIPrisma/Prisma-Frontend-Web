import React, { useState, useEffect, useRef, useMemo } from 'react';
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

export const MapaRutaEnVivo = ({ ruta, onActualizarRuta }) => {
  const paradas = ruta?.paradas || [];
  const placa = ruta?.placaCamion || 'Camión';

  // Coordenadas base de paradas (tiendas)
  const puntosTiendas = useMemo(() => {
    return paradas
      .filter((p) => p.latitud && p.longitud)
      .map((p, index) => ({
        ...p,
        orden: index + 1,
        lat: Number(p.latitud),
        lng: Number(p.longitud),
        entregado: p.estado === 'ENTREGADO'
      }));
  }, [paradas]);

  // Posición inicial del camión
  const posInicial = useMemo(() => {
    if (ruta?.ubicacionActual?.latitud && ruta?.ubicacionActual?.longitud) {
      return [Number(ruta.ubicacionActual.latitud), Number(ruta.ubicacionActual.longitud)];
    }
    if (puntosTiendas.length > 0) {
      return [puntosTiendas[0].lat, puntosTiendas[0].lng];
    }
    return [4.60971, -74.08175]; // Centro Bogotá
  }, [ruta, puntosTiendas]);

  const [posCamion, setPosCamion] = useState(posInicial);
  const [velocidad, setVelocidad] = useState(Number(ruta?.ubicacionActual?.velocidadKmh || 0));
  const [simulando, setSimulando] = useState(false);
  const [pasoSimulacion, setPasoSimulacion] = useState(0);

  // Línea poligonal para el trayecto entre paradas
  const coordenadasRuta = useMemo(() => {
    if (puntosTiendas.length === 0) return [posCamion];
    return [posCamion, ...puntosTiendas.map((p) => [p.lat, p.lng])];
  }, [posCamion, puntosTiendas]);

  // Límites para auto-centrar el mapa
  const bounds = useMemo(() => {
    const todos = [posCamion, ...puntosTiendas.map((p) => [p.lat, p.lng])];
    return todos;
  }, [posCamion, puntosTiendas]);

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

  return (
    <div className="space-y-4">
      {/* Barra de Controles y Telemetría en Vivo */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
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

        {/* Telemetría GPS */}
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

        {/* Botones de Simulación para Sustentación */}
        <div className="flex items-center gap-2">
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
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition border border-slate-700"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Visor de Mapa Interactivo Leaflet */}
      <div className="h-[420px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative z-0">
        <MapContainer
          center={posCamion}
          zoom={14}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          {/* Capa de OpenStreetMap estándar mundial sin costo */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <RecenterAuto bounds={bounds} />

          {/* Trazado de ruta conectando las tiendas */}
          <Polyline
            positions={coordenadasRuta}
            color="#0d9488"
            weight={4}
            dashArray="6, 8"
            opacity={0.85}
          />

          {/* Marcador del Camión */}
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

          {/* Marcadores de Tiendas (Paradas) */}
          {puntosTiendas.map((tienda) => (
            <Marker
              key={tienda.pedidoId}
              position={[tienda.lat, tienda.lng]}
              icon={crearIconoTienda(tienda.orden, tienda.entregado)}
            >
              <Popup>
                <div className="p-1.5 space-y-1 text-xs min-w-[180px]">
                  <div className="flex items-center justify-between gap-2 border-b pb-1">
                    <span className="font-bold text-slate-900">Parada #{tienda.orden}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        tienda.entregado
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {tienda.estado}
                    </span>
                  </div>
                  <p className="font-bold text-slate-900 flex items-center gap-1">
                    <Store className="w-3.5 h-3.5 text-teal-600" />
                    <span>{tienda.nombreTienda}</span>
                  </p>
                  <p className="text-slate-600">{tienda.direccion}</p>
                  {tienda.telefono && (
                    <p className="text-slate-500 text-[11px]">Tel: {tienda.telefono}</p>
                  )}
                  <p className="text-slate-700 font-semibold pt-1">
                    Total Pedido: ${Number(tienda.totalAPagar || 0).toLocaleString('es-CO')}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Leyenda y Lista de Paradas */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between text-xs gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-teal-600 border border-white inline-block"></span>
            <span className="text-slate-700 font-medium">Camión de Reparto</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-sky-600 border border-white inline-block"></span>
            <span className="text-slate-700 font-medium">Tienda Pendiente</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 border border-white inline-block"></span>
            <span className="text-slate-700 font-medium">Tienda Entregada</span>
          </div>
        </div>

        <p className="text-slate-400 text-[11px]">
          Mapeado con OpenStreetMap & Leaflet • Satélite B2B en Tiempo Real
        </p>
      </div>
    </div>
  );
};
