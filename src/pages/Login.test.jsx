import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Login } from './Login';
import * as AuthContextModule from '../context/AuthContext';
import { authService } from '../services/api';

vi.mock('../services/api', () => ({
  authService: {
    login: vi.fn(),
  },
}));

describe('Login Page Component', () => {
  const mockLogin = vi.fn();

  const renderLogin = (initialEntries = ['/login']) =>
    render(
      <MemoryRouter initialEntries={initialEntries}>
        <Login />
      </MemoryRouter>
    );

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      login: mockLogin,
      user: null,
    });
  });

  it('renderiza correctamente el formulario de login y sus campos', () => {
    renderLogin();

    expect(screen.getByText('PRISMA Web')).toBeInTheDocument();
    expect(screen.getByText('Portal B2B de Proveedores y Administración')).toBeInTheDocument();
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it('autentica satisfactoriamente al ingresar credenciales correctas', async () => {
    const user = userEvent.setup();
    const mockAuthData = {
      token: 'jwt.token.valido',
      email: 'admin@prisma.com.co',
      rol: 'ROLE_ADMIN',
    };
    authService.login.mockResolvedValueOnce(mockAuthData);

    renderLogin();

    await user.type(screen.getByLabelText(/correo electrónico/i), 'admin@prisma.com.co');
    await user.type(screen.getByLabelText(/contraseña/i), 'admin123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(authService.login).toHaveBeenCalledWith('admin@prisma.com.co', 'admin123');
    expect(mockLogin).toHaveBeenCalledWith(mockAuthData);
  });

  it('muestra mensaje de alerta si el servicio de autenticación falla', async () => {
    const user = userEvent.setup();
    authService.login.mockRejectedValueOnce(new Error('Credenciales incorrectas'));

    renderLogin();

    await user.type(screen.getByLabelText(/correo electrónico/i), 'bad@prisma.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    const errorMsg = await screen.findByText('Credenciales incorrectas');
    expect(errorMsg).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('solicita y procesa el código TOTP sin perder las credenciales en memoria', async () => {
    const user = userEvent.setup();
    const mockAuthData = { token: 'jwt.totp', email: 'admin@prisma.com.co', rol: 'ROLE_ADMIN' };
    authService.login
      .mockRejectedValueOnce(new Error('Se requiere un código TOTP de 6 dígitos.'))
      .mockResolvedValueOnce(mockAuthData);

    renderLogin();
    await user.type(screen.getByLabelText(/correo electrónico/i), 'admin@prisma.com.co');
    await user.type(screen.getByLabelText(/contraseña/i), 'clave-segura');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    const totpInput = await screen.findByLabelText(/código de autenticación/i);
    expect(totpInput).toBeInTheDocument();
    await user.type(totpInput, '123456');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(authService.login).toHaveBeenNthCalledWith(1, 'admin@prisma.com.co', 'clave-segura');
    expect(authService.login).toHaveBeenNthCalledWith(2, 'admin@prisma.com.co', 'clave-segura', '123456');
    expect(mockLogin).toHaveBeenCalledWith(mockAuthData);
  });

  it('permite reintentar un código TOTP incorrecto y conserva el correo', async () => {
    const user = userEvent.setup();
    authService.login
      .mockRejectedValueOnce(new Error('Se requiere un código TOTP de 6 dígitos.'))
      .mockRejectedValueOnce(new Error('Código TOTP incorrecto.'));

    renderLogin();
    const emailInput = screen.getByLabelText(/correo electrónico/i);
    await user.type(emailInput, 'admin@prisma.com.co');
    await user.type(screen.getByLabelText(/contraseña/i), 'clave-segura');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));
    await user.type(await screen.findByLabelText(/código de autenticación/i), '123456');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Código TOTP incorrecto.');
    expect(emailInput).toHaveValue('admin@prisma.com.co');
    expect(screen.getByLabelText(/contraseña/i)).toHaveValue('clave-segura');
    expect(screen.getByLabelText(/código de autenticación/i)).toHaveValue('');
    expect(mockLogin).not.toHaveBeenCalled();
  });
});
