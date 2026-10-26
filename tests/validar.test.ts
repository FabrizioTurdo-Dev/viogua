import { describe, expect, it } from 'vitest';
import { validarPedido, validarPicks } from '../supabase/functions/_shared/validar';

const pedido = {
  nombre: ' Sofía Pérez ',
  email: 'Sofia@Gmail.com',
  whatsapp: '5491123456789',
  cantidad: 2,
  ambientes: ['Living', 'Cocina'],
  fecha: '2026-10-29',
  hora: '15:00',
  consentimiento: true,
  web: '',
};

describe('validarPedido', () => {
  it('limpia un pedido válido', () => {
    expect(validarPedido(pedido)).toEqual({
      nombre: 'Sofía Pérez',
      email: 'sofia@gmail.com',
      whatsapp: '5491123456789',
      cantidad: 2,
      ambientes: ['Living', 'Cocina'],
      fecha: '2026-10-29',
      hora: '15:00',
    });
  });
  it('en la promo pide cinco ambientes', () => {
    expect(validarPedido({ ...pedido, cantidad: 4, ambientes: ['A', 'B', 'C', 'D'] })).toBe('Revisá los nombres de los ambientes.');
    expect(validarPedido({ ...pedido, cantidad: 4, ambientes: ['A', 'B', 'C', 'D', 'E'] })).toHaveProperty('cantidad', 4);
  });
  it('rechaza bots, datos malos y sin consentimiento', () => {
    expect(validarPedido({ ...pedido, web: 'http://spam' })).toBe('Pedido inválido.');
    expect(validarPedido({ ...pedido, email: 'sofia@' })).toBe('Revisá tu email.');
    expect(validarPedido({ ...pedido, whatsapp: '15-2345' })).toBe('Revisá tu WhatsApp.');
    expect(validarPedido({ ...pedido, cantidad: 7 })).toBe('Elegí cuántos ambientes querés diseñar.');
    expect(validarPedido({ ...pedido, consentimiento: 'true' })).toBe('Necesitamos tu OK para usar estos datos.');
    expect(validarPedido(null)).toBe('Pedido inválido.');
  });
});

describe('validarPicks', () => {
  it('acepta hasta 4 por tipo', () => {
    const picks = { estilos: ['1', '2'], colores: ['lino'], sensaciones: [], materiales: ['nogal'] };
    expect(validarPicks(picks)).toEqual(picks);
    expect(validarPicks({ ...picks, estilos: ['1', '2', '3', '4', '5'] })).toBeNull();
    expect(validarPicks({ estilos: [] })).toBeNull();
  });
});
