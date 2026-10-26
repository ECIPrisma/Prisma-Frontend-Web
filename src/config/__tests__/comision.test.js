import { describe, it, expect } from 'vitest';
import { parsearComision, formatearComision, calcularSplit, COMISION_POR_DEFECTO } from '../comision';

describe('comision', () => {
  it('usa 3.5 por defecto', () => {
    expect(COMISION_POR_DEFECTO).toBe(3.5);
    expect(parsearComision(undefined)).toBe(3.5);
    expect(parsearComision('abc')).toBe(3.5);
    expect(parsearComision('150')).toBe(3.5);
  });
  it('acepta valores válidos, incluida coma decimal', () => {
    expect(parsearComision('2,5')).toBe(2.5);
    expect(parsearComision('0')).toBe(0);
  });
  it('formatea', () => {
    expect(formatearComision(3.5)).toBe('3.5%');
    expect(formatearComision(4)).toBe('4%');
  });
  it('split 3.5 / 96.5', () => {
    expect(calcularSplit(100000, 3.5)).toEqual({ comision: 3500, proveedor: 96500 });
    expect(calcularSplit('x', 3.5)).toEqual({ comision: 0, proveedor: 0 });
  });
});
