import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CircuitoPagosCard } from './CircuitoPagosCard';
import { adminService } from '../../services/api';

vi.mock('../../services/api', () => ({
  adminService: {
    getCircuitoPagos: vi.fn(),
    reiniciarCircuitoPagos: vi.fn(),
  },
}));

const BASE = {
  circuito: 'pasarelaPagos',
  umbralFallosPorcentaje: 50,
  ventanaLlamadas: 10,
  minimoLlamadas: 5,
  esperaAbiertoSegundos: 30,
  llamadasPruebaSemiabierto: 2,
};
const CERRADO = { ...BASE, estado: 'CLOSED', tasaFallosPorcentaje: -1, llamadasExitosas: 0, llamadasFallidas: 0, llamadasRechazadasPorCircuitoAbierto: 0 };
const ABIERTO = { ...BASE, estado: 'OPEN', tasaFallosPorcentaje: 100, llamadasExitosas: 0, llamadasFallidas: 5, llamadasRechazadasPorCircuitoAbierto: 3 };

describe('HU-19 Estado del circuit breaker de pagos (panel del administrador)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('con el circuito cerrado lo indica y no permite reiniciarlo', async () => {
    adminService.getCircuitoPagos.mockResolvedValue(CERRADO);
    render(<CircuitoPagosCard />);

    expect(await screen.findByText('Cerrado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cerrar circuito/i })).toBeDisabled();
  });

  it('con el circuito abierto muestra la degradación y el administrador puede cerrarlo', async () => {
    const user = userEvent.setup();
    adminService.getCircuitoPagos.mockResolvedValue(ABIERTO);
    adminService.reiniciarCircuitoPagos.mockResolvedValue(CERRADO);
    render(<CircuitoPagosCard />);

    expect(await screen.findByText('Abierto')).toBeInTheDocument();
    expect(screen.getByText(/servicio de pagos temporalmente no disponible/i)).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /cerrar circuito/i }));

    await waitFor(() => expect(adminService.reiniciarCircuitoPagos).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Cerrado')).toBeInTheDocument();
  });

  it('si el backend no responde muestra un aviso sin romper el panel', async () => {
    adminService.getCircuitoPagos.mockRejectedValue(new Error('404'));
    render(<CircuitoPagosCard />);

    expect(await screen.findByText(/no fue posible consultar el estado del circuito/i)).toBeInTheDocument();
  });
});
