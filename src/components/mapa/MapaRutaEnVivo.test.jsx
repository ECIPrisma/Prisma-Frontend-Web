import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MapaRutaEnVivo } from './MapaRutaEnVivo';

// Mock de react-leaflet para entorno JSDOM
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children, position }) => (
    <div data-testid="marker" data-lat={position[0]} data-lng={position[1]}>
      {children}
    </div>
  ),
  Popup: ({ children }) => <div data-testid="popup">{children}</div>,
  Polyline: () => <div data-testid="polyline" />,
  useMap: () => ({ fitBounds: vi.fn() })
}));

// Mock del servicio api
vi.mock('../../services/api', () => ({
  proveedorService: {
    simularPosicionGps: vi.fn().mockResolvedValue({ exito: true })
  }
}));

describe('MapaRutaEnVivo Component', () => {
  const rutaMock = {
    rutaId: 101,
    codigoRuta: 'RUT-NORTE-01',
    placaCamion: 'ABC-123',
    nombreRepartidor: 'Carlos Gómez',
    paradasCompletadas: 1,
    ubicacionActual: {
      latitud: 4.6500,
      longitud: -74.0800,
      velocidadKmh: 42.5
    },
    paradas: [
      {
        pedidoId: 1,
        ordenParada: 1,
        nombreTienda: 'Tienda La Esperanza',
        direccion: 'Calle 100 #15-20',
        latitud: 4.6510,
        longitud: -74.0810,
        estado: 'ENTREGADO',
        totalAPagar: 350000
      },
      {
        pedidoId: 2,
        ordenParada: 2,
        nombreTienda: 'Minimarket San Jorge',
        direccion: 'Carrera 15 #102-30',
        latitud: 4.6580,
        longitud: -74.0850,
        estado: 'EN_RUTA',
        totalAPagar: 180000
      }
    ]
  };

  it('renderiza la cabecera de telemetría y datos del camión', () => {
    render(<MapaRutaEnVivo ruta={rutaMock} />);
    expect(screen.getByText('ABC-123')).toBeInTheDocument();
    expect(screen.getByText('RUT-NORTE-01')).toBeInTheDocument();
    expect(screen.getByText('Carlos Gómez')).toBeInTheDocument();
    expect(screen.getByText('42.5')).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  it('renderiza el contenedor del mapa y las capas de Leaflet', () => {
    render(<MapaRutaEnVivo ruta={rutaMock} />);
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    expect(screen.getByTestId('tile-layer')).toBeInTheDocument();
    expect(screen.getByTestId('polyline')).toBeInTheDocument();
  });

  it('permite alternar el botón de simulación de avance', () => {
    render(<MapaRutaEnVivo ruta={rutaMock} />);
    const botonSimular = screen.getByText(/Simular Avance en Vivo/i);
    expect(botonSimular).toBeInTheDocument();

    fireEvent.click(botonSimular);
    expect(screen.getByText(/Pausar Simulación/i)).toBeInTheDocument();
  });

  it('permite solicitar la geolocalización del usuario y renderiza su marcador', () => {
    const mockGeolocation = {
      getCurrentPosition: vi.fn().mockImplementationOnce((success) =>
        success({
          coords: {
            latitude: 4.6097,
            longitude: -74.0817
          }
        })
      )
    };
    global.navigator.geolocation = mockGeolocation;

    render(<MapaRutaEnVivo ruta={rutaMock} />);
    const botonUbicacion = screen.getByRole('button', { name: /Mi GPS|Localizar/i });
    expect(botonUbicacion).toBeInTheDocument();

    fireEvent.click(botonUbicacion);
    expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
  });
});
