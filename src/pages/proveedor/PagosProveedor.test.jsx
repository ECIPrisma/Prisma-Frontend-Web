import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PagosProveedorPage } from './PagosProveedorPage';
import { proveedorService } from '../../services/api';

vi.mock('../../services/api', () => ({
  proveedorService: {
    getCuentaCobro: vi.fn(),
    vincularCuentaCobro: vi.fn(),
    desvincularCuentaCobro: vi.fn(),
    getRecaudosEnLinea: vi.fn(),
  },
}));

const SIN_VINCULAR = {
  disponible: true, simulada: true, vinculada: false, habilitadoPagosDivididos: false,
  comisionPrismaPorcentaje: 3.5, porcentajeProveedor: 96.5,
};
const VINCULADA = {
  ...SIN_VINCULAR, vinculada: true, habilitadoPagosDivididos: true, cuentaExternaId: 'WMP-SBX-4K8Z2QH1',
  banco: 'Bancolombia', tipoCuenta: 'AHORROS', numeroCuentaEnmascarado: '•••• 8912', titular: 'FEMSA Colombia',
  modoProduccion: false, vinculadaEn: '2026-11-12T10:00:00-05:00',
};
const SIN_RECAUDOS = { totalEnGarantia: 0, totalLiberado: 0, cantidadEnGarantia: 0, cantidadLiberados: 0, pagos: [] };

const montar = () => render(<PagosProveedorPage demoraVerificacionMs={0} />);

const llenarFormulario = async (user, numeroCuenta) => {
  await user.click(await screen.findByRole('button', { name: /vincular cuenta de cobro/i }));
  await user.selectOptions(screen.getByLabelText('Banco'), 'Bancolombia');
  await user.type(screen.getByLabelText('Número de cuenta'), numeroCuenta);
  await user.type(screen.getByLabelText('Titular de la cuenta'), 'FEMSA Colombia');
  await user.click(screen.getByRole('button', { name: /verificar y vincular/i }));
};

describe('HU-12 Cuenta de cobro del proveedor (pasarela simulada)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    proveedorService.getRecaudosEnLinea.mockResolvedValue(SIN_RECAUDOS);
  });

  it('sin cuenta vinculada muestra el 96,5% y el aviso de ambiente simulado', async () => {
    proveedorService.getCuentaCobro.mockResolvedValue(SIN_VINCULAR);
    montar();

    expect(await screen.findByText('96,5%')).toBeInTheDocument();
    expect(screen.getByText(/ambiente de pruebas simulado/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /vincular cuenta de cobro/i })).toBeEnabled();
  });

  it('criterio 1: vincula la cuenta y muestra solo los últimos 4 dígitos', async () => {
    const user = userEvent.setup();
    proveedorService.getCuentaCobro.mockResolvedValue(SIN_VINCULAR);
    proveedorService.vincularCuentaCobro.mockResolvedValue(VINCULADA);
    montar();

    await llenarFormulario(user, '12345678912');

    expect(await screen.findByText(/tu cuenta de cobro quedó vinculada/i)).toBeInTheDocument();
    expect(screen.getByText(/habilitado para recibir pagos divididos/i)).toBeInTheDocument();
    expect(screen.getByText('•••• 8912')).toBeInTheDocument();
    expect(proveedorService.vincularCuentaCobro).toHaveBeenCalledWith({
      banco: 'Bancolombia', tipoCuenta: 'AHORROS', numeroCuenta: '12345678912', titular: 'FEMSA Colombia',
    });
  });

  it('criterio 2: si la pasarela rechaza la cuenta muestra el mensaje exacto y no queda vinculada', async () => {
    const user = userEvent.setup();
    proveedorService.getCuentaCobro.mockResolvedValue(SIN_VINCULAR);
    proveedorService.vincularCuentaCobro.mockRejectedValue(new Error('No se pudo vincular tu cuenta de cobro, intenta nuevamente'));
    montar();

    await llenarFormulario(user, '1234560000');

    expect(await screen.findByText('No se pudo vincular tu cuenta de cobro, intenta nuevamente')).toBeInTheDocument();
    expect(screen.queryByText(/habilitado para recibir pagos divididos/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /verificar y vincular/i })).toBeEnabled();
  });

  it('con la cuenta vinculada permite desvincular tras confirmar', async () => {
    const user = userEvent.setup();
    proveedorService.getCuentaCobro.mockResolvedValue(VINCULADA);
    proveedorService.desvincularCuentaCobro.mockImplementation(async () => {
      proveedorService.getCuentaCobro.mockResolvedValue(SIN_VINCULAR);
      return null;
    });
    montar();

    await user.click(await screen.findByRole('button', { name: /desvincular cuenta/i }));
    await user.click(screen.getByRole('button', { name: /sí, desvincular/i }));

    await waitFor(() => expect(proveedorService.desvincularCuentaCobro).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/fue desvinculada/i)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /vincular cuenta de cobro/i })).toBeInTheDocument();
  });

  it('N-08: lista los pagos en línea de tenderos con su estado de garantía', async () => {
    proveedorService.getCuentaCobro.mockResolvedValue(VINCULADA);
    proveedorService.getRecaudosEnLinea.mockResolvedValue({
      totalEnGarantia: 120625, totalLiberado: 0, cantidadEnGarantia: 1, cantidadLiberados: 0,
      pagos: [{
        id: 1, pedidoId: 10, numeroPedido: 'PED-2026-0042', nombreTienda: 'Tienda La Bendición',
        referencia: 'PRISMA-PED-2026-0042-AB12C', detalleMedio: 'Nequi ••• 1111',
        monto: 125000, comisionPrisma: 4375, montoProveedor: 120625, tarifaPasarela: 2237.5, estado: 'EN_GARANTIA',
      }],
    });
    montar();

    expect(await screen.findByText('PED-2026-0042')).toBeInTheDocument();
    // HU-13: división 3.5% / 96.5% y tarifa Wompi aparte
    // (es-CO puede no agrupar números de 4 cifras: se acepta "4.375" o "4375")
    expect(screen.getByText(/^\$4\.?375$/)).toBeInTheDocument();
    expect(screen.getByText(/^\$2\.?238$/)).toBeInTheDocument();
    expect(screen.getByText('Tienda La Bendición')).toBeInTheDocument();
    expect(screen.getByText('En garantía')).toBeInTheDocument();
    expect(screen.getByText('Nequi ••• 1111')).toBeInTheDocument();
  });
});
