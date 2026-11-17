import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SuscripcionPage, construirSolicitud } from './SuscripcionPage';
import { proveedorService } from '../../services/api';

vi.mock('../../services/api', () => ({
  proveedorService: {
    getSuscripcion: vi.fn(),
    pagarSuscripcion: vi.fn(),
  },
}));

const BASE = {
  plan: 'DISTRIBUIDOR_PRO',
  nombrePlan: 'Prisma Pro Distribuidor',
  precioMensual: 120000,
  valorNeto: 100840.34,
  valorIva: 19159.66,
  beneficios: ['Copiloto de IA para tu operación de distribución'],
  simulada: true,
};
const SIN_SUSCRIPCION = { ...BASE, estado: 'SIN_SUSCRIPCION', vigenteHasta: null, diasRestantes: 0, pagos: [] };
const PAGO_OK = {
  id: 1, referencia: 'PRISMA-SUS-1-ABCD1234', estado: 'APROBADO', aprobado: true, monto: 120000,
  detalleMedio: 'Nequi ••• 1111', periodoDesde: '2026-11-17', periodoHasta: '2026-12-16', creadoEn: '2026-11-17T10:00:00-05:00',
};
const ACTIVA = { ...BASE, estado: 'ACTIVA', vigenteHasta: '2026-12-16', diasRestantes: 30, pagos: [PAGO_OK] };

const montar = () => render(<SuscripcionPage demoraPasosMs={0} />);

describe('MVP Suscripción Prisma Pro del distribuidor', () => {
  beforeEach(() => vi.clearAllMocks());

  it('muestra el plan de $120.000 con IVA y que aún no hay suscripción', async () => {
    proveedorService.getSuscripcion.mockResolvedValue(SIN_SUSCRIPCION);
    montar();

    expect(await screen.findByText('Prisma Pro Distribuidor')).toBeInTheDocument();
    expect(screen.getByText('Sin suscripción')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pagar \$120\.?000/i })).toBeEnabled();
  });

  it('paga con Nequi, queda activa y aparece en el historial', async () => {
    const user = userEvent.setup();
    proveedorService.getSuscripcion.mockResolvedValueOnce(SIN_SUSCRIPCION).mockResolvedValue(ACTIVA);
    proveedorService.pagarSuscripcion.mockResolvedValue(PAGO_OK);
    montar();

    await user.type(await screen.findByLabelText('Celular asociado a Nequi'), '3991111111');
    await user.click(screen.getByRole('button', { name: /pagar \$120\.?000/i }));

    expect(await screen.findByText(/pago aprobado/i)).toBeInTheDocument();
    expect(proveedorService.pagarSuscripcion).toHaveBeenCalledWith({ medio: 'NEQUI', celular: '3991111111' });
    expect(await screen.findByText('Activa')).toBeInTheDocument();
    expect(screen.getByText('PRISMA-SUS-1-ABCD1234')).toBeInTheDocument();
  });

  it('si el banco rechaza muestra el mensaje exacto y el motivo', async () => {
    const user = userEvent.setup();
    proveedorService.getSuscripcion.mockResolvedValue(SIN_SUSCRIPCION);
    proveedorService.pagarSuscripcion.mockResolvedValue({
      ...PAGO_OK, estado: 'RECHAZADO', aprobado: false, motivoRechazo: 'Nequi rechazó la transacción: fondos insuficientes',
    });
    montar();

    await user.type(await screen.findByLabelText('Celular asociado a Nequi'), '3992222222');
    await user.click(screen.getByRole('button', { name: /pagar \$120\.?000/i }));

    expect(await screen.findByText('El pago no pudo ser procesado, intenta con otro medio')).toBeInTheDocument();
    expect(screen.getByText(/fondos insuficientes/i)).toBeInTheDocument();
  });

  it('HU-19: si la pasarela no está disponible muestra el mensaje del circuit breaker', async () => {
    const user = userEvent.setup();
    proveedorService.getSuscripcion.mockResolvedValue(SIN_SUSCRIPCION);
    proveedorService.pagarSuscripcion.mockRejectedValue(new Error('Servicio de pagos temporalmente no disponible'));
    montar();

    await user.type(await screen.findByLabelText('Celular asociado a Nequi'), '3991111111');
    await user.click(screen.getByRole('button', { name: /pagar \$120\.?000/i }));

    expect(await screen.findByText('Servicio de pagos temporalmente no disponible')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: /pagar \$120\.?000/i })).toBeEnabled());
  });

  it('el CVV nunca se envía al servidor', () => {
    const solicitud = construirSolicitud('TARJETA', {
      numeroTarjeta: '4242 4242 4242 4242', titular: 'FEMSA', vencimiento: '12/30', cvv: '123', cuotas: '3',
    });
    expect(solicitud).toEqual({ medio: 'TARJETA', numeroTarjeta: '4242 4242 4242 4242', titular: 'FEMSA', vencimiento: '12/30', cuotas: 3 });
    expect(solicitud).not.toHaveProperty('cvv');
  });
});
