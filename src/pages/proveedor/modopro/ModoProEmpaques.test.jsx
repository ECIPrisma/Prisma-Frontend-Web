import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModoProEmpaquesPage } from './ModoProEmpaquesPage';
import { analyticsService, DEMO_FORMATOS_EMPAQUE } from '../../../services/api';
import * as AuthContextModule from '../../../context/AuthContext';

vi.mock('../../../services/api', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    analyticsService: { getModoProFormatosEmpaque: vi.fn() },
  };
});

describe('HU-31 /modo-pro/empaques', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({ user: { rol: 'ROLE_PROVEEDOR', proveedorId: 2 } });
  });

  it('criterio 1: muestra el rechazo sistemático y los formatos más accesibles', async () => {
    analyticsService.getModoProFormatosEmpaque.mockResolvedValue(DEMO_FORMATOS_EMPAQUE);
    render(<ModoProEmpaquesPage />);

    expect(await screen.findByText('Postobón Manzana · Zona Sur')).toBeInTheDocument();
    expect(screen.getByText('Rechazo sistemático')).toBeInTheDocument();
    expect(screen.getByText(/Postobón Manzana 2\.5L ·/)).toBeInTheDocument();
    expect(screen.getByText('Postobón Manzana 1.25L')).toBeInTheDocument();
    expect(screen.getByText('Caja institucional 6 x Postobón Manzana 400ml')).toBeInTheDocument();
    expect(screen.getByText('Empaque fraccionado')).toBeInTheDocument();
    expect(screen.getByText('Formato institucional')).toBeInTheDocument();
    // Pide los datos del proveedor autenticado (HU-04)
    expect(analyticsService.getModoProFormatosEmpaque).toHaveBeenCalledWith(2, '');
  });

  it('criterio 2: sin reglas suficientes no muestra ninguna prescripción y explica el motivo', async () => {
    analyticsService.getModoProFormatosEmpaque.mockResolvedValue({
      algoritmo: 'FP-Growth', suficientes_datos: true, prescripciones: [],
      mensaje: 'No se detectaron patrones de rechazo con soporte y confianza suficientes: no se emite ninguna prescripción de empaque',
      referencias_sin_patron: [
        { referencia: 'Agua Cristal', zona: 'Centro', motivo: 'No hay una regla con confianza suficiente hacia Agua Cristal 600ml (mínimo 80%)' },
      ],
    });
    render(<ModoProEmpaquesPage />);

    expect(await screen.findByText('Sin prescripciones de empaque')).toBeInTheDocument();
    expect(screen.queryByText('Rechazo sistemático')).not.toBeInTheDocument();
    expect(screen.getByText('No se detectaron patrones de rechazo con soporte y confianza suficientes: no se emite ninguna prescripción de empaque')).toBeInTheDocument();
    expect(screen.getByText(/No hay una regla con confianza suficiente/)).toBeInTheDocument();
  });

  it('sin referencias en varias presentaciones muestra el estado vacío', async () => {
    analyticsService.getModoProFormatosEmpaque.mockResolvedValue({
      suficientes_datos: false, prescripciones: [], referencias_sin_patron: [],
      mensaje: 'No hay referencias vendidas en más de una presentación para analizar',
    });
    render(<ModoProEmpaquesPage />);
    expect(await screen.findByText('No hay referencias vendidas en más de una presentación para analizar')).toBeInTheDocument();
  });

  it('filtra por zona', async () => {
    const user = userEvent.setup();
    analyticsService.getModoProFormatosEmpaque.mockResolvedValue(DEMO_FORMATOS_EMPAQUE);
    render(<ModoProEmpaquesPage />);
    await screen.findByText('Postobón Manzana · Zona Sur');

    await user.selectOptions(screen.getByLabelText('Zona'), 'Centro');
    await waitFor(() => expect(analyticsService.getModoProFormatosEmpaque).toHaveBeenLastCalledWith(2, 'Centro'));
  });
});
