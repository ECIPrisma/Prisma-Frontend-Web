import { describe, it, expect } from 'vitest';
import { parsearComision, formatearComision, calcularSplit, COMISION_POR_DEFECTO } from '../comision';

describe('comisión de la plataforma', () => {
  it('por defecto coincide con la comisión vigente del backend (2.5%)', () => {
    expect(COMISION_POR_DEFECTO).toBe(2.5);
  });

  it.each([undefined, null, '', 'abc', '-1', '101', '150', NaN])(
    'valor inválido %p -> cae al valor por defecto',
    (valor) => {
      expect(parsearComision(valor)).toBe(COMISION_POR_DEFECTO);
    }
  );

  it.each([
    ['3.5', 3.5],
    ['2,5', 2.5], // coma decimal
    ['0', 0],
    ['100', 100],
    [4, 4],
  ])('valor válido %p -> %p', (valor, esperado) => {
    expect(parsearComision(valor)).toBe(esperado);
  });

  it('formatea sin ceros sobrantes', () => {
    expect(formatearComision(2.5)).toBe('2.5%');
    expect(formatearComision(4)).toBe('4%');
    expect(formatearComision(3.456)).toBe('3.46%');
  });

  it('calcula el split comisión / proveedor y suma siempre el total', () => {
    expect(calcularSplit(400000, 2.5)).toEqual({ comision: 10000, proveedor: 390000 });
    expect(calcularSplit(400000, 3.5)).toEqual({ comision: 14000, proveedor: 386000 });
    const { comision, proveedor } = calcularSplit(123457, 2.5);
    expect(comision + proveedor).toBeCloseTo(123457, 2);
  });

  it('un monto inválido o negativo cero no produce NaN', () => {
    expect(calcularSplit('x', 2.5)).toEqual({ comision: 0, proveedor: 0 });
    expect(calcularSplit(undefined, 2.5)).toEqual({ comision: 0, proveedor: 0 });
  });
});
