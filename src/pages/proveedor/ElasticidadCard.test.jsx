import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ElasticidadCard } from './ElasticidadCard';
import { analyticsService } from '../../services/api';

vi.mock('../../services/api', () => ({
  analyticsService: { getPrescripcionDescuentos: vi.fn() },
}));

const ELASTICA = {
  zona: 'Norte', producto_id: 10, nombre_producto: 'Coca-Cola 1.5L',
  coeficiente_elasticidad: -6.579, tipo_demanda: 'Elástica', descuento_bloqueado: false, motivo_bloqueo: null,
  recomendacion_estrategica: 'La demanda de Coca-Cola 1.5L en la zona Norte es elástica.',
  incremento_volumen_esperado_pct: 188.9,
  escalas_prescritas: [
    { escala_unidades: '>= 10 unidades', descripcion: 'Por la compra de 10 unidades, 1 unidad bonificada', descuento_porcentaje: 9.1, precio_unitario_final: 4318.18, incremento_volumen_pct: 87.2, variacion_margen_pct: 53.2, protege_margen: true },
  ],
  alternativas_prescritas: [], alcance_datos: 'ZONA', datos_simulados: false,
};

const INELASTICA = {
  zona: 'Norte', producto_id: 13, nombre_producto: 'Arroz Blanco 500g',
  coeficiente_elasticidad: -0.581, tipo_demanda: 'Inelástica', descuento_bloqueado: true,
  motivo_bloqueo: 'La demanda es inelástica (|ε| = 0.58 ≤ 1). Se bloquea el descuento directo para cuidar tu margen.',
  recomendacion_estrategica: 'No apliques descuentos directos a Arroz Blanco 500g en la zona Norte.',
  incremento_volumen_esperado_pct: 0, escalas_prescritas: [],
  alternativas_prescritas: [
    { tipo: 'EXHIBIDOR', titulo: 'Exhibidor en punto de venta', descripcion: 'Instala un exhibidor en las tiendas de la zona Norte.' },
    { tipo: 'BUNDLE', titulo: 'Paquete cruzado: Arroz Blanco 500g + Aceite Vegetal 1L', descripcion: 'Ofrécelos como paquete.' },
  ],
  alcance_datos: 'ZONA', datos_simulados: false,
};

describe('HU-30 Elasticidad precio-demanda por producto y zona', () => {
  beforeEach(() => vi.clearAllMocks());

  it('criterio 1: con demanda elástica muestra el descuento por escala en unidades bonificadas', async () => {
    analyticsService.getPrescripcionDescuentos.mockResolvedValue(ELASTICA);
    render(<ElasticidadCard />);

    expect(await screen.findByText('Por la compra de 10 unidades, 1 unidad bonificada')).toBeInTheDocument();
    expect(screen.getByText(/Elástica \(ε = -6\.579\)/)).toBeInTheDocument();
    expect(screen.queryByText(/descuento directo bloqueado/i)).not.toBeInTheDocument();
    expect(analyticsService.getPrescripcionDescuentos).toHaveBeenCalledWith(10, 'Norte');
  });

  it('criterio 2: con demanda inelástica bloquea el descuento y prescribe exhibidor y bundle', async () => {
    analyticsService.getPrescripcionDescuentos.mockResolvedValue(INELASTICA);
    render(<ElasticidadCard />);

    expect(await screen.findByText(/descuento directo bloqueado/i)).toBeInTheDocument();
    expect(screen.getByText(/se bloquea el descuento directo para cuidar tu margen/i)).toBeInTheDocument();
    expect(screen.getByText('Exhibidor en punto de venta')).toBeInTheDocument();
    expect(screen.getByText('Paquete cruzado: Arroz Blanco 500g + Aceite Vegetal 1L')).toBeInTheDocument();
    expect(screen.queryByText(/unidad bonificada/i)).not.toBeInTheDocument();
  });

  it('recalcula al cambiar el producto y la zona', async () => {
    const user = userEvent.setup();
    analyticsService.getPrescripcionDescuentos.mockResolvedValue(ELASTICA);
    render(<ElasticidadCard />);
    await screen.findByText('Por la compra de 10 unidades, 1 unidad bonificada');

    analyticsService.getPrescripcionDescuentos.mockResolvedValue(INELASTICA);
    await user.selectOptions(screen.getByLabelText('Producto'), '13');
    await user.selectOptions(screen.getByLabelText('Zona'), 'Sur');

    await waitFor(() => expect(analyticsService.getPrescripcionDescuentos).toHaveBeenLastCalledWith(13, 'Sur'));
    expect(await screen.findByText(/descuento directo bloqueado/i)).toBeInTheDocument();
  });

  it('avisa cuando el cálculo usa todas las zonas por falta de datos en la elegida', async () => {
    analyticsService.getPrescripcionDescuentos.mockResolvedValue({ ...ELASTICA, alcance_datos: 'TODAS_LAS_ZONAS' });
    render(<ElasticidadCard />);
    expect(await screen.findByText(/el cálculo usa el historial de todas las zonas/i)).toBeInTheDocument();
  });
});
