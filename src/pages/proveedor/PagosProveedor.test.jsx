import React, { StrictMode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PagosProveedorPage } from './PagosProveedorPage';
import { PagosCallbackPage } from './PagosCallbackPage';
import { proveedorService } from '../../services/api';

vi.mock('../../services/api', () => ({
  proveedorService: {
    getCuentaCobro: vi.fn(),
    iniciarVinculacionCobro: vi.fn(),
    completarVinculacionCobro: vi.fn(),
    desvincularCuentaCobro: vi.fn(),
  },
}));

const SIN_VINCULAR = {
  disponible: true, vinculada: false, habilitadoPagosDivididos: false,
  comisionPrismaPorcentaje: 3.5, porcentajeProveedor: 96.5,
};
const VINCULADA = {
  ...SIN_VINCULAR, vinculada: true, habilitadoPagosDivididos: true,
  cuentaExternaId: '123456789', modoProduccion: false, vinculadaEn: '2026-11-11T10:00:00-05:00',
};

const montar = (rutaInicial) =>
  render(
    <StrictMode>
      <MemoryRouter initialEntries={[rutaInicial]}>
        <Routes>
          <Route path="/proveedor/pagos" element={<PagosProveedorPage />} />
          <Route path="/proveedor/pagos/callback" element={<PagosCallbackPage />} />
        </Routes>
      </MemoryRouter>
    </StrictMode>
  );

describe('HU-12 Cuenta de cobro del proveedor', () => {
  const ubicacionOriginal = window.location;
  let assign;

  beforeEach(() => {
    vi.clearAllMocks();
    assign = vi.fn();
    Object.defineProperty(window, 'location', { configurable: true, value: { ...ubicacionOriginal, assign } });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: ubicacionOriginal });
  });

  it('sin cuenta vinculada muestra el 96.5% y redirige a Mercado Pago al vincular', async () => {
    const user = userEvent.setup();
    proveedorService.getCuentaCobro.mockResolvedValue(SIN_VINCULAR);
    proveedorService.iniciarVinculacionCobro.mockResolvedValue({ urlAutorizacion: 'https://auth.mercadopago.com/authorization?state=abc' });

    montar('/proveedor/pagos');

    expect(await screen.findByText('96,5%')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /vincular con mercado pago/i }));

    expect(proveedorService.iniciarVinculacionCobro).toHaveBeenCalledTimes(1);
    expect(assign).toHaveBeenCalledWith('https://auth.mercadopago.com/authorization?state=abc');
  });

  it('criterio 1: al volver autorizado envía code y state UNA sola vez y muestra la cuenta habilitada', async () => {
    proveedorService.completarVinculacionCobro.mockResolvedValue(VINCULADA);
    proveedorService.getCuentaCobro.mockResolvedValue(VINCULADA);

    montar('/proveedor/pagos/callback?code=TG-123&state=abc');

    expect(await screen.findByText(/tu cuenta de cobro quedó vinculada/i)).toBeInTheDocument();
    expect(await screen.findByText(/habilitado para recibir pagos divididos/i)).toBeInTheDocument();
    expect(proveedorService.completarVinculacionCobro).toHaveBeenCalledTimes(1);
    expect(proveedorService.completarVinculacionCobro).toHaveBeenCalledWith({ code: 'TG-123', state: 'abc', error: null });
  });

  it('criterio 2: si se cancela en Mercado Pago no queda vinculada y muestra el mensaje exacto', async () => {
    proveedorService.completarVinculacionCobro.mockRejectedValue(new Error('No se pudo vincular tu cuenta de cobro, intenta nuevamente'));
    proveedorService.getCuentaCobro.mockResolvedValue(SIN_VINCULAR);

    montar('/proveedor/pagos/callback?error=access_denied&state=abc');

    expect(await screen.findByText('No se pudo vincular tu cuenta de cobro, intenta nuevamente')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /vincular con mercado pago/i })).toBeInTheDocument();
    expect(proveedorService.completarVinculacionCobro).toHaveBeenCalledWith({ code: null, state: 'abc', error: 'access_denied' });
  });

  it('con la cuenta vinculada permite desvincular tras confirmar', async () => {
    const user = userEvent.setup();
    proveedorService.getCuentaCobro.mockResolvedValue(VINCULADA);
    proveedorService.desvincularCuentaCobro.mockImplementation(async () => {
      proveedorService.getCuentaCobro.mockResolvedValue(SIN_VINCULAR);
      return null;
    });

    montar('/proveedor/pagos');

    await user.click(await screen.findByRole('button', { name: /desvincular cuenta/i }));
    await user.click(screen.getByRole('button', { name: /sí, desvincular/i }));

    await waitFor(() => expect(proveedorService.desvincularCuentaCobro).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/fue desvinculada/i)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /vincular con mercado pago/i })).toBeInTheDocument();
  });

  it('si el servidor no tiene Mercado Pago configurado, el botón queda deshabilitado', async () => {
    proveedorService.getCuentaCobro.mockResolvedValue({ ...SIN_VINCULAR, disponible: false });

    montar('/proveedor/pagos');

    expect(await screen.findByRole('button', { name: /vincular con mercado pago/i })).toBeDisabled();
  });
});
