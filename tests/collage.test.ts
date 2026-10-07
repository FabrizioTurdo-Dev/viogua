import { describe, expect, it } from 'vitest';
import { COLLAGE, COLLAGE_ALTO, PATRON, TIPOS, buscar, celdasDe, piezasDe, type Picks } from '../src/data/test';

// La selección de prueba: «Lino» aparece como color y como material, y hay nombres largos.
const PRUEBA: Picks = {
  estilos: ['2', '3', '6', '7'],
  colores: ['lino', 'ocre', 'mostaza', 'arena'],
  sensaciones: ['refugio', 'personalidad', 'luz', 'abrigo'],
  materiales: ['microcemento', 'lino', 'carrara', 'nogal'],
};

describe('collage', () => {
  it('usa las 16 elecciones, 4 de cada tipo', () => {
    const piezas = piezasDe(PRUEBA);
    expect(piezas).toHaveLength(16);
    for (const tipo of TIPOS) {
      const usados = piezas.filter(p => p.tipo === tipo).map(p => p.item.id);
      expect(new Set(usados).size).toBe(4);
      expect(usados.sort()).toEqual([...PRUEBA[tipo]].sort());
    }
  });

  it('distingue «Lino» color de «Lino» material', () => {
    const color = buscar('colores', 'lino');
    const material = buscar('materiales', 'lino');
    expect(color && 'hex' in color).toBe(true);
    expect(material && 'credito' in material).toBe(true);
    const piezas = piezasDe(PRUEBA).filter(p => p.item.id === 'lino');
    expect(piezas.map(p => p.tipo).sort()).toEqual(['colores', 'materiales']);
  });

  it('todas las piezas entran en el tablero', () => {
    for (const p of COLLAGE) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x + p.w).toBeLessThanOrEqual(100);
      expect(p.y + p.h).toBeLessThanOrEqual(COLLAGE_ALTO);
    }
  });

  it('las piezas no se superponen', () => {
    for (let i = 0; i < COLLAGE.length; i++) {
      for (let j = i + 1; j < COLLAGE.length; j++) {
        const a = COLLAGE[i], b = COLLAGE[j];
        const separadas = a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;
        expect(separadas, `${i} y ${j}`).toBe(true);
      }
    }
  });

  it('con elecciones incompletas no rompe', () => {
    expect(piezasDe({ estilos: ['1'], colores: [], sensaciones: [], materiales: [] })).toHaveLength(1);
  });
});

describe('carga', () => {
  it('cada fila y columna del patrón tiene los cuatro tipos', () => {
    for (let k = 0; k < 4; k++) {
      expect(new Set(PATRON.slice(k * 4, k * 4 + 4)).size).toBe(4);
      expect(new Set([0, 1, 2, 3].map(f => PATRON[f * 4 + k])).size).toBe(4);
    }
  });
  it('arma las 16 celdas con ítems reales', () => {
    const celdas = celdasDe(PRUEBA);
    expect(celdas).toHaveLength(16);
    expect(celdas.every(c => c.item)).toBe(true);
  });
});
