import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import * as AuthContextModule from '../context/AuthContext';
import { authService } from '../services/api';
import { Login } from './Login';
import { SeguridadPage } from './SeguridadPage';

vi.mock('qrcode', () => ({
  default: { toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,qr') },
}));

vi.mock('../services/api', () => ({
  authService: {
    getTotpStatus: vi.fn(),
    setupTotp: vi.fn(),
    enableTotp: vi.fn(),
    disableTotp: vi.fn(),
  },
}));

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
};

describe('SeguridadPage', () => {
  const logout = vi.fn();

  const renderPage = () => render(
    <MemoryRouter initialEntries={['/seguridad']}>
      <Routes>
        <Route path="/seguridad" element={<SeguridadPage />} />
        <Route path="/login" element={<Login />} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    authService.getTotpStatus.mockResolvedValue({ enabled: false });
    authService.setupTotp.mockResolvedValue({
      secret: 'JBSWY3DPEHPK3PXP',
      otpauthUri: 'otpauth://totp/Prisma:test?secret=JBSWY3DPEHPK3PXP',
    });
    authService.enableTotp.mockResolvedValue({});
    authService.disableTotp.mockResolvedValue({});
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({ logout });
  });

  it('carga el estado y permite cancelar la configuración limpiando el secreto', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: /activar autenticación en dos pasos/i }));
    expect(await screen.findByAltText(/código qr de configuración totp/i)).toHaveAttribute('src', 'data:image/png;base64,qr');
    expect(screen.getByText('JBSWY3DPEHPK3PXP')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^cancelar$/i }));
    expect(screen.queryByText('JBSWY3DPEHPK3PXP')).not.toBeInTheDocument();
    expect(authService.enableTotp).not.toHaveBeenCalled();
  });

  it('no ofrece cambios cuando la respuesta del estado no contiene enabled booleano', async () => {
    authService.getTotpStatus.mockResolvedValue({});
    renderPage();

    expect(await screen.findByText('No disponible')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('estado de autenticación en dos pasos no válido');
    expect(screen.queryByRole('button', { name: /activar autenticación en dos pasos/i })).not.toBeInTheDocument();
  });

  it('activa TOTP con un código válido y termina la sesión', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: /activar autenticación en dos pasos/i }));
    await screen.findByAltText(/código qr de configuración totp/i);
    await user.type(screen.getByLabelText(/código de 6 dígitos/i), '123456');
    await user.click(screen.getByRole('button', { name: /confirmar y activar/i }));

    await waitFor(() => {
      expect(authService.enableTotp).toHaveBeenCalledWith('123456');
      expect(logout).toHaveBeenCalledOnce();
      expect(screen.getByTestId('location')).toHaveTextContent('/login');
    });
    expect(screen.getByText('La autenticación en dos pasos se activó. Por seguridad, debes volver a iniciar sesión.')).toBeInTheDocument();
  });

  it('confirma la desactivación con contraseña y TOTP y limpia la contraseña', async () => {
    const user = userEvent.setup();
    authService.getTotpStatus.mockResolvedValue({ enabled: true });
    renderPage();

    await user.click(await screen.findByRole('button', { name: /desactivar autenticación en dos pasos/i }));
    const passwordInput = screen.getByLabelText(/contraseña actual/i);
    await user.type(passwordInput, 'no-persistir-esta-clave');
    await user.type(screen.getByLabelText(/código de 6 dígitos/i), '654321');
    await user.click(screen.getByRole('button', { name: /confirmar desactivación/i }));

    await waitFor(() => expect(authService.disableTotp).toHaveBeenCalledWith('no-persistir-esta-clave', '654321'));
    expect(screen.getByText(/estado:/i).parentElement).toHaveTextContent('Desactivada');
    expect(passwordInput).not.toBeInTheDocument();
    expect(localStorage.getItem('prisma_user') || '').not.toContain('no-persistir-esta-clave');
  });

  it('limpia la contraseña al cancelar una desactivación', async () => {
    const user = userEvent.setup();
    authService.getTotpStatus.mockResolvedValue({ enabled: true });
    renderPage();

    await user.click(await screen.findByRole('button', { name: /desactivar autenticación en dos pasos/i }));
    const passwordInput = screen.getByLabelText(/contraseña actual/i);
    await user.type(passwordInput, 'temporal');
    await user.click(screen.getByRole('button', { name: /^cancelar$/i }));

    expect(passwordInput).not.toBeInTheDocument();
    expect(authService.disableTotp).not.toHaveBeenCalled();
  });

  it('rechaza códigos con longitud incorrecta antes de llamar al servicio', async () => {
    authService.getTotpStatus.mockResolvedValue({ enabled: true });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /desactivar autenticación en dos pasos/i }));

    expect(screen.getByLabelText(/código de 6 dígitos/i)).toHaveAttribute('pattern', '[0-9]{6}');
    expect(screen.getByRole('button', { name: /confirmar desactivación/i })).toBeDisabled();
    expect(authService.disableTotp).not.toHaveBeenCalled();
  });
});
