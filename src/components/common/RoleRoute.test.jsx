import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { RoleRoute } from './RoleRoute';
import { ROLES, ADMIN_ROLES } from '../../constants/roles';

describe('RoleRoute Component', () => {
  it('renderiza el contenido protegido si el rol del usuario está permitido', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <RoleRoute allowedRoles={ADMIN_ROLES} userRol={ROLES.ADMIN}>
          <div data-testid="admin-content">Panel Administrador Exclusivo</div>
        </RoleRoute>
      </MemoryRouter>
    );

    expect(screen.getByTestId('admin-content')).toBeInTheDocument();
    expect(screen.getByText('Panel Administrador Exclusivo')).toBeInTheDocument();
  });

  it('no renderiza el contenido y redirige si el rol no está autorizado', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <RoleRoute allowedRoles={ADMIN_ROLES} userRol={ROLES.TENDERO}>
          <div data-testid="admin-content">Panel Administrador Exclusivo</div>
        </RoleRoute>
      </MemoryRouter>
    );

    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
  });
});
