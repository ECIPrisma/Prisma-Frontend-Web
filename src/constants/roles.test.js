import { describe, it, expect } from 'vitest';
import { ROLES, ADMIN_ROLES, PROVEEDOR_ROLES } from './roles';

describe('Constantes de Roles del Sistema PRISMA', () => {
  it('define los 7 roles canónicos con prefijo ROLE_', () => {
    expect(ROLES.PLATFORM_ADMIN).toBe('ROLE_PLATFORM_ADMIN');
    expect(ROLES.ADMIN).toBe('ROLE_ADMIN');
    expect(ROLES.SOPORTE).toBe('ROLE_SOPORTE');
    expect(ROLES.PROVEEDOR_ADMIN).toBe('ROLE_PROVEEDOR_ADMIN');
    expect(ROLES.PROVEEDOR).toBe('ROLE_PROVEEDOR');
    expect(ROLES.TENDERO).toBe('ROLE_TENDERO');
    expect(ROLES.REPARTIDOR).toBe('ROLE_REPARTIDOR');
  });

  it('ADMIN_ROLES incluye los roles con permisos de administración de plataforma', () => {
    expect(ADMIN_ROLES).toContain(ROLES.PLATFORM_ADMIN);
    expect(ADMIN_ROLES).toContain(ROLES.ADMIN);
    expect(ADMIN_ROLES).toContain(ROLES.SOPORTE);
    expect(ADMIN_ROLES).not.toContain(ROLES.TENDERO);
    expect(ADMIN_ROLES).not.toContain(ROLES.REPARTIDOR);
  });

  it('PROVEEDOR_ROLES incluye roles con acceso a gestión de proveedores', () => {
    expect(PROVEEDOR_ROLES).toContain(ROLES.PROVEEDOR);
    expect(PROVEEDOR_ROLES).toContain(ROLES.PROVEEDOR_ADMIN);
    expect(PROVEEDOR_ROLES).toContain(ROLES.PLATFORM_ADMIN);
    expect(PROVEEDOR_ROLES).not.toContain(ROLES.TENDERO);
  });
});
