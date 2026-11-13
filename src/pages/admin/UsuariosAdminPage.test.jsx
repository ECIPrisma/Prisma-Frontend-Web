import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UsuariosAdminPage } from './UsuariosAdminPage';
import { adminService } from '../../services/api';

vi.mock('../../services/api', () => ({
  adminService: {
    getUsuariosAdmin: vi.fn(),
    resetTotpUsuario: vi.fn(),
  },
}));

const mockUsuarios = [
  {
    id: 1,
    email: 'admin@prisma.com.co',
    nombreCompleto: 'Juan Admin Prisma',
    telefono: '3001234567',
    rol: 'ROLE_PLATFORM_ADMIN',
    estado: 'ACTIVO',
    totpEnabled: true,
    proveedorId: null,
    proveedorNombre: null,
  },
  {
    id: 2,
    email: 'repartidor@femsa.com.co',
    nombreCompleto: 'Carlos Repartidor',
    telefono: '3109876543',
    rol: 'ROLE_REPARTIDOR',
    estado: 'ACTIVO',
    totpEnabled: false,
    proveedorId: 1,
    proveedorNombre: 'FEMSA Distribuciones',
  },
];

describe('UsuariosAdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza la lista de usuarios con sus estados de 2FA', async () => {
    adminService.getUsuariosAdmin.mockResolvedValueOnce(mockUsuarios);

    render(<UsuariosAdminPage />);

    expect(screen.getByText('Cargando directorio de usuarios...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Juan Admin Prisma')).toBeInTheDocument();
      expect(screen.getByText('Carlos Repartidor')).toBeInTheDocument();
    });

    expect(screen.getByText('2FA Activo')).toBeInTheDocument();
    expect(screen.getByText('2FA Inactivo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Restablecer 2FA/i })).toBeInTheDocument();
  });

  it('permite buscar usuarios por texto', async () => {
    const user = userEvent.setup();
    adminService.getUsuariosAdmin.mockResolvedValueOnce(mockUsuarios);

    render(<UsuariosAdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Juan Admin Prisma')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Buscar por nombre, correo, rol o empresa/i);
    await user.type(searchInput, 'Carlos');

    expect(screen.queryByText('Juan Admin Prisma')).not.toBeInTheDocument();
    expect(screen.getByText('Carlos Repartidor')).toBeInTheDocument();
  });

  it('permite filtrar usuarios que tienen 2FA activo', async () => {
    const user = userEvent.setup();
    adminService.getUsuariosAdmin.mockResolvedValueOnce(mockUsuarios);

    render(<UsuariosAdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Juan Admin Prisma')).toBeInTheDocument();
    });

    const filtroCon2FA = screen.getByRole('button', { name: /Con 2FA/i });
    await user.click(filtroCon2FA);

    expect(screen.getByText('Juan Admin Prisma')).toBeInTheDocument();
    expect(screen.queryByText('Carlos Repartidor')).not.toBeInTheDocument();
  });

  it('abre y cancela el modal de confirmación de restablecimiento de 2FA', async () => {
    const user = userEvent.setup();
    adminService.getUsuariosAdmin.mockResolvedValueOnce(mockUsuarios);

    render(<UsuariosAdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Juan Admin Prisma')).toBeInTheDocument();
    });

    const botonReset = screen.getByRole('button', { name: /Restablecer 2FA/i });
    await user.click(botonReset);

    expect(screen.getByText('¿Restablecer Doble Factor (2FA)?')).toBeInTheDocument();
    expect(screen.getAllByText(/admin@prisma.com.co/i).length).toBeGreaterThanOrEqual(2);

    const botonCancelar = screen.getByRole('button', { name: /Cancelar/i });
    await user.click(botonCancelar);

    expect(screen.queryByText('¿Restablecer Doble Factor (2FA)?')).not.toBeInTheDocument();
    expect(adminService.resetTotpUsuario).not.toHaveBeenCalled();
  });

  it('ejecuta el restablecimiento administrativo de 2FA y actualiza la lista', async () => {
    const user = userEvent.setup();
    adminService.getUsuariosAdmin
      .mockResolvedValueOnce(mockUsuarios)
      .mockResolvedValueOnce([
        { ...mockUsuarios[0], totpEnabled: false },
        mockUsuarios[1],
      ]);
    adminService.resetTotpUsuario.mockResolvedValueOnce({ exitoso: true });

    render(<UsuariosAdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Juan Admin Prisma')).toBeInTheDocument();
    });

    const botonReset = screen.getByRole('button', { name: /Restablecer 2FA/i });
    await user.click(botonReset);

    const botonConfirmar = screen.getByRole('button', { name: /Sí, Desactivar 2FA/i });
    await user.click(botonConfirmar);

    await waitFor(() => {
      expect(adminService.resetTotpUsuario).toHaveBeenCalledWith(1);
      expect(screen.getByText(/Se desactivó exitosamente el 2FA para Juan Admin Prisma/i)).toBeInTheDocument();
    });
  });
});
