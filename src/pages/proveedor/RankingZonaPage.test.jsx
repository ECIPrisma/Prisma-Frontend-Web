import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { RankingZonaPage } from './RankingZonaPage';
import { proveedorService } from '../../services/api';

vi.mock('../../services/api', () => ({
  proveedorService: { getRankingPorZona: vi.fn() },
}));

const conDatos = {
  dias: 30,
  hayDatos: true,
  zonas: [
    {
      zona: 'Kennedy',
      unidadesTotales: 14,
      productos: [
        { posicion: 1, productoId: 2, nombre: 'Coca-Cola Sin Azúcar Lata 330ml', unidades: 9 },
        { posicion: 2, productoId: 1, nombre: 'Coca-Cola Original 400ml', unidades: 5 },
      ],
    },
    {
      zona: 'Suba',
      unidadesTotales: 3,
      productos: [{ posicion: 1, productoId: 1, nombre: 'Coca-Cola Original 400ml', unidades: 3 }],
    },
  ],
};

describe('RankingZonaPage (HU-15)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('pide el ranking de 30 días al abrir y muestra cada zona con sus productos en el orden recibido', async () => {
    proveedorService.getRankingPorZona.mockResolvedValue(conDatos);
    render(<RankingZonaPage />);

    const kennedy = await screen.findByRole('region', { name: 'Zona Kennedy' });
    expect(proveedorService.getRankingPorZona).toHaveBeenCalledWith(30);
    const filas = within(kennedy).getAllByRole('listitem');
    expect(filas).toHaveLength(2);
    expect(filas[0]).toHaveTextContent('Coca-Cola Sin Azúcar Lata 330ml');
    expect(filas[0]).toHaveTextContent('9');
    expect(filas[1]).toHaveTextContent('Coca-Cola Original 400ml');
    expect(within(kennedy).getByText('14 unidades')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Zona Suba' })).toBeInTheDocument();
  });

  it('sin datos muestra el mensaje acordado y NO dibuja zonas ni listas vacías', async () => {
    proveedorService.getRankingPorZona.mockResolvedValue({
      dias: 30,
      hayDatos: false,
      mensaje: 'Aún no hay suficientes datos para generar este reporte',
      zonas: [],
    });
    render(<RankingZonaPage />);

    expect(await screen.findByText('Aún no hay suficientes datos para generar este reporte')).toBeInTheDocument();
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('si el servidor responde hayDatos=true pero sin zonas, también muestra el mensaje (no un ranking vacío)', async () => {
    proveedorService.getRankingPorZona.mockResolvedValue({ dias: 30, hayDatos: true, zonas: [] });
    render(<RankingZonaPage />);

    expect(await screen.findByText('Aún no hay suficientes datos para generar este reporte')).toBeInTheDocument();
  });

  it('cambiar el periodo vuelve a consultar con esos días y marca el botón activo', async () => {
    proveedorService.getRankingPorZona.mockResolvedValue(conDatos);
    render(<RankingZonaPage />);
    await screen.findByRole('region', { name: 'Zona Kennedy' });

    fireEvent.click(screen.getByRole('button', { name: '90 días' }));

    await waitFor(() => expect(proveedorService.getRankingPorZona).toHaveBeenLastCalledWith(90));
    expect(screen.getByRole('button', { name: '90 días' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '30 días' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('si la consulta falla muestra el error y no muestra datos ni el mensaje de "sin datos"', async () => {
    proveedorService.getRankingPorZona.mockRejectedValue(new Error('Acceso denegado'));
    render(<RankingZonaPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Acceso denegado');
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
    expect(screen.queryByText(/Aún no hay suficientes datos/)).not.toBeInTheDocument();
  });

  it('un error al cambiar de periodo no deja visibles los datos del periodo anterior', async () => {
    proveedorService.getRankingPorZona.mockResolvedValueOnce(conDatos);
    render(<RankingZonaPage />);
    await screen.findByRole('region', { name: 'Zona Kennedy' });

    proveedorService.getRankingPorZona.mockRejectedValueOnce(new Error('Error HTTP 500'));
    fireEvent.click(screen.getByRole('button', { name: '7 días' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Error HTTP 500');
    expect(screen.queryByRole('region', { name: 'Zona Kennedy' })).not.toBeInTheDocument();
  });
});
