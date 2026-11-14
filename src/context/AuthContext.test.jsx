import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';

const TestComponent = () => {
  const { user, login, logout } = useAuth();
  return (
    <div>
      <div data-testid="user-email">{user ? user.email : 'anonimo'}</div>
      <div data-testid="user-rol">{user ? user.rol : 'sin-rol'}</div>
      <button
        onClick={() =>
          login({
            id: 1,
            email: 'admin@prisma.com.co',
            nombreCompleto: 'Admin Prisma',
            rol: 'ROLE_ADMIN',
            token: 'fake.jwt.token'
          })
        }
      >
        Iniciar Sesión
      </button>
      <button onClick={logout}>Cerrar Sesión</button>
    </div>
  );
};

describe('AuthContext y AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('inicia con estado anónimo cuando no hay sesión en localStorage', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user-email')).toHaveTextContent('anonimo');
    expect(screen.getByTestId('user-rol')).toHaveTextContent('sin-rol');
  });

  it('permite iniciar sesión y persiste el usuario en localStorage', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(screen.getByTestId('user-email')).toHaveTextContent('admin@prisma.com.co');
    expect(screen.getByTestId('user-rol')).toHaveTextContent('ROLE_ADMIN');
    expect(localStorage.getItem('prisma_user')).toContain('admin@prisma.com.co');
  });

  it('permite cerrar sesión y remueve la información de localStorage', async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      'prisma_user',
      JSON.stringify({ id: 1, email: 'admin@prisma.com.co', rol: 'ROLE_ADMIN' })
    );

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user-email')).toHaveTextContent('admin@prisma.com.co');

    await user.click(screen.getByRole('button', { name: /cerrar sesión/i }));

    expect(screen.getByTestId('user-email')).toHaveTextContent('anonimo');
    expect(localStorage.getItem('prisma_user')).toBeNull();
  });
});
