import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Navbar } from './Navbar';
import { proveedorService } from '../../services/api';

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { rol: 'ROLE_PROVEEDOR', nombreCompleto: 'Carlos Morales', email: 'logistica@femsa.com.co' },
    logout: vi.fn(),
  }),
}));

vi.mock('../../services/api', () => ({
  adminService: { getDisputas: vi.fn().mockResolvedValue([]) },
  authService: { logout: vi.fn().mockResolvedValue(null) },
  proveedorService: {
    getMisPqrs: vi.fn(),
    getCamiones: vi.fn(),
    getMisNotificaciones: vi.fn(),
  },
}));

const AVISO_PAGO = {
  id: 1,
  tipo: 'PAGO_CONFIRMADO',
  titulo: 'Pago confirmado: pedido #PED-2026-0042',
  cuerpo: 'Tienda La Bendición pagó en línea $125000 COP. El pago está en garantía: ya puedes iniciar el despacho.',
  pedidoId: 42,
  numeroPedido: 'PED-2026-0042',
  enviadoEn: '2026-11-12T10:00:00-05:00',
};

const montar = () =>
  render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>
  );

describe('HU-14 Aviso al proveedor de pago confirmado (campana de notificaciones)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    proveedorService.getMisPqrs.mockResolvedValue([]);
    proveedorService.getCamiones.mockResolvedValue([]);
  });

  it('muestra el pago confirmado para iniciar el despacho', async () => {
    const user = userEvent.setup();
    // El mismo pedido notificado dos veces se muestra una sola vez; otros tipos no se mezclan aquí
    proveedorService.getMisNotificaciones.mockResolvedValue([
      AVISO_PAGO,
      { ...AVISO_PAGO, id: 2 },
      { id: 3, tipo: 'NUEVO_PEDIDO', titulo: 'Nuevo pedido recibido', pedidoId: 7 },
    ]);
    montar();

    await waitFor(() => expect(proveedorService.getMisNotificaciones).toHaveBeenCalled());
    await user.click(screen.getByTitle('Centro de Notificaciones'));

    expect(await screen.findByText('Pago confirmado: pedido #PED-2026-0042')).toBeInTheDocument();
    expect(screen.getAllByText('Pago confirmado: pedido #PED-2026-0042')).toHaveLength(1);
    expect(screen.getByText(/listo para despacho/i)).toBeInTheDocument();
    expect(screen.queryByText('Nuevo pedido recibido')).not.toBeInTheDocument();
  });

  it('si el servicio de notificaciones falla, la campana sigue funcionando', async () => {
    const user = userEvent.setup();
    proveedorService.getMisNotificaciones.mockRejectedValue(new Error('sin conexión'));
    montar();

    await waitFor(() => expect(proveedorService.getMisNotificaciones).toHaveBeenCalled());
    await user.click(screen.getByTitle('Centro de Notificaciones'));

    expect(await screen.findByText('Todo al día')).toBeInTheDocument();
  });
});
