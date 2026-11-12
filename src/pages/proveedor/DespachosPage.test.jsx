import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { DespachosPage } from './DespachosPage';
import { proveedorService } from '../../services/api';

// Mock del componente de Mapa para pruebas unitarias
vi.mock('../../components/mapa/MapaRutaEnVivo', () => ({
  MapaRutaEnVivo: ({ ruta }) => (
    <div data-testid="mapa-ruta-en-vivo">
      <span>Mapa Camion {ruta?.placaCamion}</span>
      <span>Codigo {ruta?.codigoRuta}</span>
    </div>
  )
}));

// Mock del servicio de proveedor
vi.mock('../../services/api', () => ({
  proveedorService: {
    getPedidosNuevos: vi.fn(),
    getRutasProgreso: vi.fn(),
    reportarProblemaPedido: vi.fn(),
    reprogramarPedido: vi.fn(),
    reportarVarado: vi.fn(),
    simularPosicionGps: vi.fn()
  }
}));

const mockRutas = [
  {
    rutaId: 101,
    codigoRuta: 'RUT-NORTE-01',
    placaCamion: 'ABC-123',
    modeloCamion: 'Chevrolet FVR',
    nombreRepartidor: 'Carlos Gomez',
    zonaSector: 'Zona Norte - Usaquen',
    estado: 'EN_RUTA',
    paradasCompletadas: 1,
    totalParadas: 3,
    recaudoEsperado: 850000,
    totalRecaudado: 320000,
    ubicacionActual: {
      latitud: 4.6980,
      longitud: -74.0320,
      velocidadKmh: 42.5
    },
    paradas: [
      {
        pedidoId: 1,
        ordenParada: 1,
        nombreTienda: 'Tienda La Esperanza',
        direccion: 'Calle 140 #11-20',
        latitud: 4.6950,
        longitud: -74.0350,
        estado: 'ENTREGADO',
        totalAPagar: 320000
      },
      {
        pedidoId: 2,
        ordenParada: 2,
        nombreTienda: 'Minimarket Los Pinos',
        direccion: 'Carrera 15 #145-30',
        latitud: 4.7010,
        longitud: -74.0310,
        estado: 'EN_RUTA',
        totalAPagar: 250000
      },
      {
        pedidoId: 3,
        ordenParada: 3,
        nombreTienda: 'Cigarreria El Sol',
        direccion: 'Calle 150 #19-45',
        latitud: 4.7100,
        longitud: -74.0280,
        estado: 'PENDIENTE',
        totalAPagar: 280000
      }
    ]
  },
  {
    rutaId: 102,
    codigoRuta: 'RUT-SUR-02',
    placaCamion: 'XYZ-789',
    modeloCamion: 'Hino Dutro',
    nombreRepartidor: 'Mario Bross',
    zonaSector: 'Zona Sur - Kennedy',
    estado: 'EN_RUTA',
    paradasCompletadas: 0,
    totalParadas: 2,
    recaudoEsperado: 540000,
    totalRecaudado: 0,
    ubicacionActual: {
      latitud: 4.6150,
      longitud: -74.1520,
      velocidadKmh: 36.0
    },
    paradas: [
      {
        pedidoId: 4,
        ordenParada: 1,
        nombreTienda: 'Abarrotes El Ahorro',
        direccion: 'Av Primero de Mayo #40-12',
        latitud: 4.6180,
        longitud: -74.1500,
        estado: 'PENDIENTE',
        totalAPagar: 300000
      }
    ]
  }
];

const mockPedidos = [
  {
    id: 1,
    numeroPedido: 'PED-001',
    tiendaNombre: 'Tienda La Esperanza',
    tiendaDireccion: 'Calle 140 #11-20',
    estado: 'ENTREGADO',
    total: 320000
  }
];

describe('DespachosPage UI y Monitoreo Satelital GPS', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    proveedorService.getPedidosNuevos.mockResolvedValue(mockPedidos);
    proveedorService.getRutasProgreso.mockResolvedValue(mockRutas);
  });

  it('renderiza la cabecera principal y las 3 pestañas de navegación', async () => {
    render(<DespachosPage />);

    await waitFor(() => {
      expect(screen.getByText(/Despachos y Entregas/i)).toBeInTheDocument();
      expect(screen.getByText(/Rutas de Hoy/i)).toBeInTheDocument();
      expect(screen.getByText(/Lista de Pedidos/i)).toBeInTheDocument();
      expect(screen.getByText(/Mapa Satelital GPS/i)).toBeInTheDocument();
    });
  });

  it('permite acceder a la pestaña de Mapa Satelital GPS y muestra selector de flota y mapa', async () => {
    render(<DespachosPage />);

    await waitFor(() => {
      expect(screen.getByText(/Rutas de Hoy/i)).toBeInTheDocument();
    });

    const tabMapa = screen.getByText(/Mapa Satelital GPS/i);
    fireEvent.click(tabMapa);

    // Debe mostrar la cabecera de la flota
    expect(screen.getByText(/Flota de Reparto en Servicio/i)).toBeInTheDocument();
    expect(screen.getByText('ABC-123')).toBeInTheDocument();
    expect(screen.getByText('XYZ-789')).toBeInTheDocument();

    // Debe renderizar el contenedor del mapa para el primer camion
    expect(screen.getByTestId('mapa-ruta-en-vivo')).toBeInTheDocument();
    expect(screen.getByText('Mapa Camion ABC-123')).toBeInTheDocument();
    expect(screen.getByText('Monitoreo Satelital: Camión ABC-123')).toBeInTheDocument();
  });

  it('permite alternar entre camiones en el selector de la pestaña de Mapa', async () => {
    render(<DespachosPage />);

    await waitFor(() => {
      expect(screen.getByText(/Rutas de Hoy/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Mapa Satelital GPS/i));

    expect(screen.getByText('Mapa Camion ABC-123')).toBeInTheDocument();

    // Clic en la tarjeta del segundo camión XYZ-789
    const botonCamionSur = screen.getByRole('button', { name: /XYZ-789/i });
    fireEvent.click(botonCamionSur);

    // El mapa enfoca el segundo camión
    expect(screen.getByText('Mapa Camion XYZ-789')).toBeInTheDocument();
    expect(screen.getByText('Monitoreo Satelital: Camión XYZ-789')).toBeInTheDocument();
  });

  it('navega a la pestaña de mapa al presionar "Monitorear en Vivo" desde la pestaña de Rutas', async () => {
    render(<DespachosPage />);

    await waitFor(() => {
      expect(screen.getByText('ABC-123')).toBeInTheDocument();
    });

    // En la vista de Rutas, buscar los botones de Monitorear en Vivo
    const botonesMonitorear = screen.getAllByRole('button', { name: /Monitorear en Vivo/i });
    expect(botonesMonitorear.length).toBeGreaterThan(0);

    // Clic en el primer botón
    fireEvent.click(botonesMonitorear[0]);

    // Debe haber cambiado a la pestaña de mapa satelital
    expect(screen.getByText(/Flota de Reparto en Servicio/i)).toBeInTheDocument();
    expect(screen.getByTestId('mapa-ruta-en-vivo')).toBeInTheDocument();
    expect(screen.getByText('Mapa Camion ABC-123')).toBeInTheDocument();
  });

  it('permite abrir y cerrar el modal flotante de Vista Rápida del mapa', async () => {
    render(<DespachosPage />);

    await waitFor(() => {
      expect(screen.getByText('ABC-123')).toBeInTheDocument();
    });

    const botonesVistaRapida = screen.getAllByRole('button', { name: /Vista Rápida/i });
    fireEvent.click(botonesVistaRapida[0]);

    // Modal abierto con título y mapa
    expect(screen.getByText(/Ubicación GPS Satelital: ABC-123/i)).toBeInTheDocument();
    expect(screen.getByTestId('mapa-ruta-en-vivo')).toBeInTheDocument();

    // Botón de cerrar modal
    const botonCerrar = screen.getByRole('button', { name: /Cerrar Mapa de Ruta/i });
    fireEvent.click(botonCerrar);

    await waitFor(() => {
      expect(screen.queryByText(/Ubicación GPS Satelital: ABC-123/i)).not.toBeInTheDocument();
    });
  });
});
