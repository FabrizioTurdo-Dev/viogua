import { describe, expect, it } from 'vitest';
import { AGENDA as SITIO } from '../src/data/estudio';
import { AGENDA, enAgenda, horarios, instante, local } from '../supabase/functions/_shared/agenda';

// Lunes 26 de octubre de 2026, 12:00 en Argentina.
const AHORA = instante('2026-10-26', '12:00').getTime();

describe('agenda del servidor', () => {
  it('es la misma que la del sitio', () => {
    expect(AGENDA.horarios).toEqual(SITIO.horarios);
    expect([AGENDA.duracionMin, AGENDA.avisoMinHoras, AGENDA.horizonteDias]).toEqual([
      SITIO.duracionMin,
      SITIO.avisoMinHoras,
      SITIO.horizonteDias,
    ]);
  });
  it('usa la hora de Argentina', () => {
    expect(instante('2026-10-29', '15:00').toISOString()).toBe('2026-10-29T18:00:00.000Z');
    expect(local(new Date('2026-10-29T18:00:00Z'))).toBe('2026-10-29T15:00');
  });
  it('pide 24 h de aviso y no ofrece domingos', () => {
    expect(enAgenda('2026-10-27', '11:00', AHORA)).toBe(false);
    expect(enAgenda('2026-10-27', '12:00', AHORA)).toBe(true);
    expect(enAgenda('2026-11-01', '10:00', AHORA)).toBe(false);
    expect(enAgenda('2026-10-28', '10:30', AHORA)).toBe(false);
  });
  it('marca ocupado lo que se pisa con otra reunión', () => {
    const turno = instante('2026-10-31', '11:00').getTime();
    const dias = horarios('2026-10-31', '2026-11-01', [{ inicio: turno, fin: turno + 3_600_000 }], AHORA);
    expect(dias).toEqual({
      '2026-10-31': [
        { hora: '10:00', libre: true },
        { hora: '11:00', libre: false },
        { hora: '12:00', libre: true },
      ],
    });
  });
});
