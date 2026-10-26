// Textos del turno: fechas, listas, teléfono y el mensaje de confirmación.
// Un solo lugar para que la pantalla, el envío por WhatsApp y los tests digan lo mismo.

const ZONA = 'America/Argentina/Buenos_Aires';
const partesFecha = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: ZONA });
const listaY = new Intl.ListFormat('es', { style: 'long', type: 'conjunction' });

/** «martes 13 de octubre» (sin la coma que agrega Intl después del día de la semana). */
export function fechaLarga(fecha: Date): string {
  const p = Object.fromEntries(partesFecha.formatToParts(fecha).map(x => [x.type, x.value]));
  return `${p.weekday} ${p.day} de ${p.month}`;
}

/** «Martes 13 de octubre», para títulos. */
export const fechaTitulo = (fecha: Date) => {
  const t = fechaLarga(fecha);
  return t.charAt(0).toUpperCase() + t.slice(1);
};

/** «Living», «Living y Cocina», «Living, Cocina y Baño». */
export const lista = (items: string[]) => listaY.format(items.map(s => s.trim()).filter(Boolean));

/** Fecha local de un día del calendario (año, mes, día) a las 12 h, para formatear sin saltos de zona. */
export const desdeIso = (iso: string) => {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d, 15));
};

/**
 * Normaliza un WhatsApp argentino a E.164 sin «+» (549 + código de área + número).
 * Acepta 0 y 15, espacios, guiones y el +54. Un número de otro país con + se respeta.
 * Devuelve null si no se puede interpretar.
 */
export function normalizarTelefono(entrada: string): string | null {
  const texto = entrada.trim();
  let d = texto.replace(/\D/g, '');
  if (!d) return null;

  if (texto.startsWith('+') && !d.startsWith('54')) return d.length >= 8 && d.length <= 15 ? d : null;
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('54')) {
    d = d.slice(2);
    if (d.startsWith('9')) d = d.slice(1);
  }
  if (d.startsWith('0')) d = d.slice(1);
  // Código de área (2 a 4 cifras) seguido de 15: se saca el 15.
  if (d.length === 12) {
    for (const i of [2, 3, 4]) {
      if (d.slice(i, i + 2) === '15') {
        d = d.slice(0, i) + d.slice(i + 2);
        break;
      }
    }
  }
  return /^\d{10}$/.test(d) ? `549${d}` : null;
}

/** +54 9 11 2345-6789 (solo para mostrar). */
export function telefonoLegible(e164: string): string {
  const d = e164.match(/^549(\d{10})$/)?.[1];
  if (!d) return `+${e164}`;
  const area = d.startsWith('11') ? 2 : 3;
  return `+54 9 ${d.slice(0, area)} ${d.slice(area, 6)}-${d.slice(6)}`;
}

export const emailValido = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

export interface DatosTurno {
  nombre: string;
  fecha: Date;
  hora: string;
  ambientes: string[];
  meetUrl?: string | null;
  /** Link para hacer el test; null si ya lo hizo (no se ofrece). */
  testUrl: string | null;
}

/** Texto de confirmación (WhatsApp, voseo). Lo valida VioGua. */
export function mensajeConfirmacion(t: DatosTurno): string {
  const meet = t.meetUrl
    ? `• Videollamada por Google Meet: ${t.meetUrl}`
    : '• Videollamada por Google Meet (el link te llega por email)';
  return [
    `¡Hola, ${t.nombre.trim()}! Te escribimos de VioGua.`,
    '',
    'Tu reunión quedó confirmada:',
    `• Día: ${fechaLarga(t.fecha)}`,
    `• Hora: ${t.hora} hs (hora de Argentina)`,
    meet,
    '',
    `Vamos a conversar sobre: ${lista(t.ambientes)}.`,
    '',
    ...(t.testUrl ? [`Si querés, antes de la reunión hacé el test de estilo y te regalamos tu moodboard: ${t.testUrl}`, ''] : []),
    '¿Necesitás cambiar el horario? Respondé este mensaje y lo reprogramamos.',
    '¡Te esperamos!',
  ].join('\n');
}

export interface Pedido extends Pick<DatosTurno, 'nombre' | 'fecha' | 'hora' | 'ambientes'> {
  email: string;
  /** Total del diseño ya escrito: «$400.000». */
  total: string;
  promo: boolean;
  /** Con backend: link a la ficha del pedido (datos, fotos y test) en /estudio/. */
  ficha?: string | null;
}

/** Pedido de turno que la persona le manda al estudio por WhatsApp (sin Google Calendar). */
export function mensajePedido(p: Pedido): string {
  return [
    `¡Hola, VioGua! Soy ${p.nombre.trim()} y quiero agendar una reunión por Google Meet.`,
    '',
    `• Día: ${fechaLarga(p.fecha)}`,
    `• Hora: ${p.hora} hs (hora de Argentina)`,
    `• Ambientes: ${lista(p.ambientes)}${p.promo ? ' (promo 4 + 1)' : ''}`,
    `• Total del diseño: ${p.total}`,
    `• Email para la invitación: ${p.email.trim()}`,
    ...(p.ficha ? [`• Ficha del pedido: ${p.ficha}`] : []),
    '',
    '¿Me confirman el turno?',
  ].join('\n');
}

/** Aviso del estudio cuando no puede hacer la reunión (desde el panel /estudio/). */
export function mensajeCancelacion(t: Pick<DatosTurno, 'nombre' | 'fecha' | 'hora'> & { agendarUrl: string }): string {
  return [
    `¡Hola, ${t.nombre.trim()}! Te escribimos de VioGua.`,
    '',
    `No vamos a poder hacer la reunión del ${fechaLarga(t.fecha)} a las ${t.hora} hs. Te pedimos disculpas.`,
    '',
    `¿Elegimos otro día? Respondé este mensaje o pedí un turno nuevo en ${t.agendarUrl}`,
  ].join('\n');
}

/** Lo que escribe el cliente al estudio cuando el envío automático todavía no está activo. */
export const mensajeAlEstudio = (t: Pick<DatosTurno, 'nombre' | 'fecha' | 'hora'>) =>
  `¡Hola! Soy ${t.nombre.trim()}. Acabo de agendar una reunión con VioGua para el ${fechaLarga(t.fecha)} a las ${t.hora} hs.`;
