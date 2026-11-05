import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProtectedRoute } from './ProtectedRoute';
import * as AuthContextModule from '../../context/AuthContext';

vi.mock('../../pages/Login', () => ({
  Login: () => <div data-testid="login-fallback">Pantalla de Login</div>
}));

describe('ProtectedRoute Component', () => {
  it('renderiza el contenido hijo si el usuario está autenticado', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: 1, email: 'usuario@prisma.com' }
    });

    render(
      <ProtectedRoute>
        <div data-testid="dashboard">Dashboard Privado</div>
      </ProtectedRoute>
    );

    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    expect(screen.queryByTestId('login-fallback')).not.toBeInTheDocument();
  });

  it('renderiza la pantalla de Login si el usuario no está autenticado', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null
    });

    render(
      <ProtectedRoute>
        <div data-testid="dashboard">Dashboard Privado</div>
      </ProtectedRoute>
    );

    expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument();
    expect(screen.getByTestId('login-fallback')).toBeInTheDocument();
  });
});
