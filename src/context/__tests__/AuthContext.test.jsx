import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../AuthContext';
import { EVENTO_SESION_EXPIRADA } from '../../services/api';

const Sonda = ({ datos }) => {
  const { user, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="rol">{user?.rol ?? 'sin-sesion'}</span>
      <span data-testid="token">{user?.token ?? 'sin-token'}</span>
      <span data-testid="proveedor">{String(user?.proveedorId ?? 'ninguno')}</span>
      <button onClick={() => login(datos)}>entrar</button>
      <button onClick={logout}>salir</button>
    </div>
  );
};

const montar = (datos) =>
  render(
    <AuthProvider>
      <Sonda datos={datos} />
    </AuthProvider>
  );

describe('AuthContext', () => {
  it('sin sesión guardada arranca sin usuario', () => {
    montar({});
    expect(screen.getByTestId('rol')).toHaveTextContent('sin-sesion');
  });

  it('login con la respuesta plana del backend guarda usuario y persiste en localStorage', async () => {
    const user = userEvent.setup();
    montar({ token: 't-1', id: 5, email: 'f@femsa.com', rol: 'ROLE_PROVEEDOR', proveedorId: 1 });

    await user.click(screen.getByText('entrar'));

    expect(screen.getByTestId('rol')).toHaveTextContent('ROLE_PROVEEDOR');
    expect(screen.getByTestId('token')).toHaveTextContent('t-1');
    expect(screen.getByTestId('proveedor')).toHaveTextContent('1');
    expect(JSON.parse(localStorage.getItem('prisma_user')).token).toBe('t-1');
  });

  it('login con la respuesta anidada { token, usuario: {...} } deja rol y proveedor en la raíz', async () => {
    const user = userEvent.setup();
    montar({ token: 't-2', usuario: { id: 1, email: 'a@prisma.com', rol: 'ROLE_ADMIN', proveedorId: 7 } });

    await user.click(screen.getByText('entrar'));

    expect(screen.getByTestId('rol')).toHaveTextContent('ROLE_ADMIN');
    expect(screen.getByTestId('token')).toHaveTextContent('t-2');
    expect(screen.getByTestId('proveedor')).toHaveTextContent('7');
  });

  it('logout limpia el estado y borra la sesión guardada', async () => {
    const user = userEvent.setup();
    montar({ token: 't-3', rol: 'ROLE_ADMIN' });
    await user.click(screen.getByText('entrar'));
    expect(localStorage.getItem('prisma_user')).not.toBeNull();

    await user.click(screen.getByText('salir'));

    expect(screen.getByTestId('rol')).toHaveTextContent('sin-sesion');
    expect(localStorage.getItem('prisma_user')).toBeNull();
  });

  it('restaura la sesión guardada al recargar la página', () => {
    localStorage.setItem('prisma_user', JSON.stringify({ token: 't-4', rol: 'ROLE_PROVEEDOR_ADMIN' }));
    montar({});
    expect(screen.getByTestId('rol')).toHaveTextContent('ROLE_PROVEEDOR_ADMIN');
    expect(screen.getByTestId('token')).toHaveTextContent('t-4');
  });

  it('una sesión guardada corrupta no rompe la app: arranca sin usuario y la descarta', () => {
    localStorage.setItem('prisma_user', '{corrupto');
    montar({});
    expect(screen.getByTestId('rol')).toHaveTextContent('sin-sesion');
    expect(localStorage.getItem('prisma_user')).toBeNull();
  });

  it('cuando la API avisa que la sesión venció, cierra la sesión automáticamente', async () => {
    const user = userEvent.setup();
    montar({ token: 't-5', rol: 'ROLE_ADMIN' });
    await user.click(screen.getByText('entrar'));
    expect(screen.getByTestId('rol')).toHaveTextContent('ROLE_ADMIN');

    act(() => {
      window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA));
    });

    expect(screen.getByTestId('rol')).toHaveTextContent('sin-sesion');
  });
});
