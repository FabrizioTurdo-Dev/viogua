// Agenda de VioGua del lado del servidor. Es la misma que `src/data/estudio.ts` (AGENDA):
// `tests/agenda.test.ts` falla si no coinciden. Sin imports, para que la usen Deno y Vitest.

const ENTRE_SEMANA = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
export const AGENDA = {
  /** Horarios de inicio por día de la semana (0 = domingo). */
  horarios: {
    1: ENTRE_SEMANA,
    2: ENTRE_SEMANA,
    3: ENTRE_SEMANA,
    4: ENTRE_SEMANA,
    5: ENTRE_SEMANA,
    6: ['10:00', '11:00', '12:00'],
  } as Record<number, string[]>,
  duracionMin: 60,
  avisoMinHoras: 24,
  horizonteDias: 60,
};

const DIA = 86_400_000;
/** Argentina no tiene horario de verano: siempre UTC−3. */
const ZONA = '-03:00';

export interface Horario { hora: string; libre: boolean }
/** Un tramo ocupado, en milisegundos. */
export interface Ocupado { inicio: number; fin: number }

/** Instante de un día y hora de Argentina: ('2026-10-29', '15:00') → 2026-10-29T18:00Z. */
export const instante = (fecha: string, hora: string) => new Date(`${fecha}T${hora}:00${ZONA}`);

/** Día y hora de Argentina de un instante: '2026-10-29T15:00'. */
export const local = (d: Date) => new Date(d.getTime() - 3 * 3_600_000).toISOString().slice(0, 16);

/** Día de la semana de 'AAAA-MM-DD' (0 = domingo), sin depender de la zona del servidor. */
const diaSemana = (fecha: string) => new Date(`${fecha}T12:00:00Z`).getUTCDay();
const siguiente = (fecha: string) => new Date(Date.parse(`${fecha}T12:00:00Z`) + DIA).toISOString().slice(0, 10);

/** ¿Es un horario de la agenda, con el aviso mínimo y dentro del horizonte? */
export function enAgenda(fecha: string, hora: string, ahora = Date.now()): boolean {
  if (!(AGENDA.horarios[diaSemana(fecha)] ?? []).includes(hora)) return false;
  const inicio = instante(fecha, hora).getTime();
  return inicio - ahora >= AGENDA.avisoMinHoras * 3_600_000 && inicio - ahora <= AGENDA.horizonteDias * DIA;
}

/** Horarios de `desde` a `hasta` (inclusive); los que se pisan con algo ocupado van con libre = false. */
export function horarios(desde: string, hasta: string, ocupados: Ocupado[], ahora = Date.now()): Record<string, Horario[]> {
  const dias: Record<string, Horario[]> = {};
  const duracion = AGENDA.duracionMin * 60_000;
  for (let fecha = desde; fecha <= hasta; fecha = siguiente(fecha)) {
    const lista = (AGENDA.horarios[diaSemana(fecha)] ?? [])
      .filter(hora => enAgenda(fecha, hora, ahora))
      .map(hora => {
        const inicio = instante(fecha, hora).getTime();
        return { hora, libre: !ocupados.some(o => o.inicio < inicio + duracion && o.fin > inicio) };
      });
    if (lista.length) dias[fecha] = lista;
  }
  return dias;
}
