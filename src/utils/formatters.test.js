import { describe, it, expect } from 'vitest';
import { formatCOP, formatDate } from './formatters';

describe('formatCOP', () => {
  it('formatea valores numéricos a moneda colombiana COP sin decimales', () => {
    const formatted = formatCOP(50000);
    // En es-CO Intl formatea como "$ 50.000" o similar
    expect(formatted).toMatch(/50\.000/);
    expect(formatted).toMatch(/\$/);
  });

  it('retorna $0 para valor 0', () => {
    const formatted = formatCOP(0);
    expect(formatted).toMatch(/0/);
    expect(formatted).toMatch(/\$/);
  });

  it('retorna $0 para valores nulos, indefinidos o NaN', () => {
    expect(formatCOP(null)).toBe('$0');
    expect(formatCOP(undefined)).toBe('$0');
    expect(formatCOP(NaN)).toBe('$0');
    expect(formatCOP('invalido')).toBe('$0');
  });
});

describe('formatDate', () => {
  it('formatea fechas válidas en formato corto es-CO', () => {
    const fecha = '2026-11-04T12:00:00Z';
    const resultado = formatDate(fecha);
    expect(resultado).toMatch(/2026/);
    expect(resultado).toMatch(/nov/i);
  });

  it('retorna N/A cuando la fecha es nula o vacía', () => {
    expect(formatDate(null)).toBe('N/A');
    expect(formatDate('')).toBe('N/A');
    expect(formatDate(undefined)).toBe('N/A');
  });
});
