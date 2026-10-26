import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RoleRoute } from '../../App';

const ADMIN = ['ROLE_PLATFORM_ADMIN', 'ROLE_ADMIN', 'ROLE_SOPORTE'];

const montar = (rol) =>
  render(
    <MemoryRouter initialEntries={['/auditoria']}>
      <Routes>
        <Route path="/" element={<div>pantalla de inicio</div>} />
        <Route
          path="/auditoria"
          element={
            <RoleRoute allowedRoles={ADMIN} userRol={rol}>
              <div>auditoría confidencial</div>
            </RoleRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );

describe('RoleRoute (acceso por rol a las pantallas)', () => {
  it.each(ADMIN)('%s puede ver la pantalla de administración', (rol) => {
    montar(rol);
    expect(screen.getByText('auditoría confidencial')).toBeInTheDocument();
  });

  it.each(['ROLE_PROVEEDOR', 'ROLE_PROVEEDOR_ADMIN', 'ROLE_TENDERO', 'ROLE_REPARTIDOR'])(
    '%s es redirigido al inicio y no ve la pantalla de administración',
    (rol) => {
      montar(rol);
      expect(screen.queryByText('auditoría confidencial')).not.toBeInTheDocument();
      expect(screen.getByText('pantalla de inicio')).toBeInTheDocument();
    }
  );

  it('un rol indefinido (sesión sin rol) también es redirigido', () => {
    montar(undefined);
    expect(screen.queryByText('auditoría confidencial')).not.toBeInTheDocument();
    expect(screen.getByText('pantalla de inicio')).toBeInTheDocument();
  });
});
