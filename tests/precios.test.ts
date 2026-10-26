import { describe, expect, it } from 'vitest';
import { desglose, precio, total } from '../src/data/estudio';

describe('precios', () => {
  it('suma el acompañamiento una sola vez y render + presupuesto por ambiente', () => {
    expect([1, 2, 3, 4].map(total)).toEqual([250_000, 400_000, 550_000, 700_000]);
  });
  it('escribe el precio en pesos', () => {
    expect(precio(1)).toBe('$250.000');
    expect(precio(4)).toBe('$700.000');
  });
  it('el desglose da el total', () => {
    [1, 2, 3, 4].forEach(n => expect(desglose(n).reduce((s, r) => s + r.monto, 0)).toBe(total(n)));
  });
  it('en la promo el quinto ambiente va de regalo', () => {
    expect(desglose(4).at(-1)).toMatchObject({ concepto: 'Quinto ambiente', monto: 0 });
    expect(desglose(3)).toHaveLength(3);
  });
});
