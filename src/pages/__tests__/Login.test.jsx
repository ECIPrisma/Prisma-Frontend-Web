import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../../services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  authService: { login: vi.fn() },
}));

import { authService } from '../../services/api';
import { AuthProvider } from '../../context/AuthContext';
import { Login } from '../Login';

const montar = () =>
  render(
    <AuthProvider>
      <Login />
    </AuthProvider>
  );

const correo = () => screen.getByPlaceholderText('ejemplo@prisma.com.co');
const clave = () => screen.getByPlaceholderText('••••••••');

describe('pantalla de Login', () => {
  beforeEach(() => {
    authService.login.mockReset();
  });

  it('NO precarga credenciales de administrador en el formulario', () => {
    montar();
    expect(correo()).toHaveValue('');
    expect(clave()).toHaveValue('');
  });

  it('envía lo digitado y, si el backend acepta, guarda la sesión', async () => {
    const user = userEvent.setup();
    authService.login.mockResolvedValue({ token: 'jwt-ok', rol: 'ROLE_ADMIN', email: 'admin@prisma.com.co' });
    montar();

    await user.type(correo(), 'admin@prisma.com.co');
    await user.type(clave(), 'admin123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(authService.login).toHaveBeenCalledWith('admin@prisma.com.co', 'admin123');
    await waitFor(() => expect(JSON.parse(localStorage.getItem('prisma_user')).token).toBe('jwt-ok'));
  });

  it('si el backend rechaza las credenciales muestra el mensaje y NO guarda sesión', async () => {
    const user = userEvent.setup();
    authService.login.mockRejectedValue(new Error('Credenciales inválidas'));
    montar();

    await user.type(correo(), 'x@y.com');
    await user.type(clave(), 'mala');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(await screen.findByText('Credenciales inválidas')).toBeInTheDocument();
    expect(localStorage.getItem('prisma_user')).toBeNull();
  });

  it('mientras autentica deshabilita el botón (evita doble envío) y luego lo rehabilita', async () => {
    const user = userEvent.setup();
    let resolver;
    authService.login.mockReturnValue(new Promise((res) => { resolver = res; }));
    montar();

    await user.type(correo(), 'x@y.com');
    await user.type(clave(), 'clave');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(screen.getByRole('button', { name: /autenticando/i })).toBeDisabled();
    resolver({ token: 't', rol: 'ROLE_ADMIN' });
    await waitFor(() => expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeEnabled());
  });

  it('no permite enviar con el correo vacío o con formato inválido', async () => {
    const user = userEvent.setup();
    montar();

    await user.type(clave(), 'algo');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));
    await user.type(correo(), 'sin-arroba');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(authService.login).not.toHaveBeenCalled();
  });
});
