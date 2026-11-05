import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      login: mockLogin,
      user: null,
    });
  });

  it('renderiza correctamente el formulario de login y sus campos', () => {
    render(<Login />);

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

    render(<Login />);

    await user.type(screen.getByLabelText(/correo electrónico/i), 'admin@prisma.com.co');
    await user.type(screen.getByLabelText(/contraseña/i), 'admin123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(authService.login).toHaveBeenCalledWith('admin@prisma.com.co', 'admin123');
    expect(mockLogin).toHaveBeenCalledWith(mockAuthData);
  });

  it('muestra mensaje de alerta si el servicio de autenticación falla', async () => {
    const user = userEvent.setup();
    authService.login.mockRejectedValueOnce(new Error('Credenciales incorrectas'));

    render(<Login />);

    await user.type(screen.getByLabelText(/correo electrónico/i), 'bad@prisma.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    const errorMsg = await screen.findByText('Credenciales incorrectas');
    expect(errorMsg).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });
});
