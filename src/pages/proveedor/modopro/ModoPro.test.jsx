import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModoProRankingPage } from './ModoProRankingPage';
import { ModoProAlertasPage } from './ModoProAlertasPage';
import { ModoProRecomendacionesPage } from './ModoProRecomendacionesPage';
import { analyticsService } from '../../../services/api';
import * as AuthContextModule from '../../../context/AuthContext';

vi.mock('../../../services/api', () => ({
  analyticsService: {
    getModoProRanking: vi.fn(),
    getModoProAlertas: vi.fn(),
    getModoProRecomendaciones: vi.fn(),
  },
}));

const VACIO = { suficientes_datos: false, mensaje: 'Aún no hay suficientes datos' };

describe('N-11 /modo-pro/ranking', () => {
  beforeEach(() => vi.clearAllMocks());

  it('muestra los productos ordenados y filtra por zona', async () => {
    const user = userEvent.setup();
    analyticsService.getModoProRanking.mockResolvedValue({
      total_ingresos: 966600, suficientes_datos: true,
      productos: [
        { posicion: 1, producto_id: 10, nombre_producto: 'Coca-Cola 1.5L', categoria: 'Bebidas', unidades: 138, ingresos: 597600, participacion_pct: 61.82, zonas_con_ventas: ['Centro', 'Norte'] },
        { posicion: 2, producto_id: 11, nombre_producto: 'Papas Fritas 150g', categoria: 'Snacks', unidades: 120, ingresos: 286000, participacion_pct: 29.59, zonas_con_ventas: ['Norte'] },
      ],
    });
    render(<ModoProRankingPage />);

    expect(await screen.findByText('Coca-Cola 1.5L')).toBeInTheDocument();
    expect(screen.getByText('Papas Fritas 150g')).toBeInTheDocument();
    expect(screen.getByText('61.82%')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Zona'), 'Sur');
    await waitFor(() => expect(analyticsService.getModoProRanking).toHaveBeenLastCalledWith(1, 'Sur'));
  });

  it('estado vacío: "Aún no hay suficientes datos"', async () => {
    analyticsService.getModoProRanking.mockResolvedValue({ ...VACIO, productos: [] });
    render(<ModoProRankingPage />);
    expect(await screen.findByText('Aún no hay suficientes datos')).toBeInTheDocument();
  });

  it('marca cuando se muestran datos de demostración', async () => {
    analyticsService.getModoProRanking.mockResolvedValue({ ...VACIO, productos: [], demostracion: true });
    render(<ModoProRankingPage />);
    expect(await screen.findByText('Datos de demostración')).toBeInTheDocument();
  });
});

describe('N-11 + HU-16 /modo-pro/alertas', () => {
  beforeEach(() => vi.clearAllMocks());

  it('criterio 1: muestra la alerta de desabastecimiento artificial con su prescripción', async () => {
    analyticsService.getModoProAlertas.mockResolvedValue({
      suficientes_datos: true,
      alertas: [{
        tipo: 'DESABASTECIMIENTO_ARTIFICIAL', producto_id: 11, nombre_producto: 'Papas Fritas 150g',
        zona_lider: 'Occidente', unidades_zona_lider: 50, zona_rezagada: 'Centro', unidades_zona_rezagada: 0,
        mensaje: 'Papas Fritas 150g es superventas en la zona Occidente.', prescripcion: 'Evalúa una promoción de introducción en Centro.',
      }],
    });
    render(<ModoProAlertasPage />);

    expect(await screen.findByText('Papas Fritas 150g')).toBeInTheDocument();
    expect(screen.getByText('Desabastecimiento artificial')).toBeInTheDocument();
    expect(screen.getByText(/zona occidente · 50 uds/i)).toBeInTheDocument();
    expect(screen.getByText(/zona centro · 0 uds/i)).toBeInTheDocument();
    expect(screen.getByText(/promoción de introducción/i)).toBeInTheDocument();
  });

  it('criterio 2: sin brechas no muestra alertas', async () => {
    analyticsService.getModoProAlertas.mockResolvedValue({ suficientes_datos: true, alertas: [], mensaje: null });
    render(<ModoProAlertasPage />);
    expect(await screen.findByText('Sin brechas de penetración')).toBeInTheDocument();
    expect(screen.queryByText('Desabastecimiento artificial')).not.toBeInTheDocument();
  });

  it('estado vacío cuando no hay datos suficientes', async () => {
    analyticsService.getModoProAlertas.mockResolvedValue({ ...VACIO, alertas: [] });
    render(<ModoProAlertasPage />);
    expect(await screen.findByText('Aún no hay suficientes datos')).toBeInTheDocument();
  });
});

describe('N-11 + HU-17 /modo-pro/recomendaciones', () => {
  beforeEach(() => vi.clearAllMocks());

  const MATRIZ = { categoria: 'Bebidas', zona: 'Norte', coeficiente_elasticidad: -6.579, tipo_demanda: 'Elástica', descuento_bloqueado: false };

  it('criterio 1: publica la recomendación narrativa generada con IA', async () => {
    analyticsService.getModoProRecomendaciones.mockResolvedValue({
      suficientes_datos: true, generado_en: '2026-11-17T07:00:00Z',
      recomendaciones: [{ categoria: 'Bebidas', zona: 'Norte', estado: 'GENERADA', fuente: 'IA_GENERATIVA', narrativa: 'Lanza una promoción 10+1 en Norte.', matriz: MATRIZ }],
    });
    render(<ModoProRecomendacionesPage />);

    expect(await screen.findByText('Lanza una promoción 10+1 en Norte.')).toBeInTheDocument();
    expect(screen.getByText('Generada con IA')).toBeInTheDocument();
    expect(screen.queryByText('Recomendación narrativa no disponible temporalmente')).not.toBeInTheDocument();
  });

  it('criterio 2: si la IA falló muestra el mensaje y la matriz numérica cruda', async () => {
    analyticsService.getModoProRecomendaciones.mockResolvedValue({
      suficientes_datos: true,
      recomendaciones: [{
        categoria: 'Bebidas', zona: 'Norte', estado: 'NARRATIVA_NO_DISPONIBLE', fuente: 'PLANTILLA', narrativa: null,
        mensaje: 'Recomendación narrativa no disponible temporalmente', resumen_plantilla: 'Resumen por plantilla.', matriz: MATRIZ,
      }],
    });
    render(<ModoProRecomendacionesPage />);

    expect(await screen.findByText('Recomendación narrativa no disponible temporalmente')).toBeInTheDocument();
    expect(screen.getByText('Datos crudos')).toBeInTheDocument();
    expect(screen.getByText('Coeficiente de elasticidad')).toBeInTheDocument();
    expect(screen.getByText('-6.579')).toBeInTheDocument();
    expect(screen.getByText('Resumen por plantilla.')).toBeInTheDocument();
  });

  it('estado vacío cuando aún no hay recomendaciones', async () => {
    analyticsService.getModoProRecomendaciones.mockResolvedValue({ ...VACIO, recomendaciones: [] });
    render(<ModoProRecomendacionesPage />);
    expect(await screen.findByText('Aún no hay suficientes datos')).toBeInTheDocument();
  });
});

describe('HU-04 aislamiento: Modo Pro consulta solo los datos del proveedor autenticado', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({ user: { rol: 'ROLE_PROVEEDOR', proveedorId: 2 } });
    analyticsService.getModoProRanking.mockResolvedValue({ ...VACIO, productos: [] });
    analyticsService.getModoProAlertas.mockResolvedValue({ ...VACIO, alertas: [] });
    analyticsService.getModoProRecomendaciones.mockResolvedValue({ ...VACIO, recomendaciones: [] });
  });

  it('ranking, alertas y recomendaciones piden los datos del proveedor 2, no los del 1', async () => {
    render(<ModoProRankingPage />);
    render(<ModoProAlertasPage />);
    render(<ModoProRecomendacionesPage />);

    await waitFor(() => expect(analyticsService.getModoProRanking).toHaveBeenCalledWith(2, ''));
    expect(analyticsService.getModoProAlertas).toHaveBeenCalledWith(2);
    expect(analyticsService.getModoProRecomendaciones).toHaveBeenCalledWith(2);
    expect(analyticsService.getModoProRanking).not.toHaveBeenCalledWith(1, expect.anything());
  });
});
