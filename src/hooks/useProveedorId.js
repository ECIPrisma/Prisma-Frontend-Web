import { useAuth } from '../context/AuthContext';

/**
 * Proveedor cuyos datos se consultan en el motor analítico: el del usuario autenticado (aislamiento
 * multi-tenant, HU-04). Un administrador de PRISMA sin proveedor asociado ve el proveedor 1.
 */
export const useProveedorId = () => useAuth()?.user?.proveedorId || 1;
