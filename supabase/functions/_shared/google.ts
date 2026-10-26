// Google Calendar + Meet con el refresh token de la cuenta de VioGua. Es opcional: sin los
// secretos GOOGLE_*, las funciones andan solo con la base (sin evento ni link de Meet).
import type { Ocupado } from './agenda.ts';

const CLIENTE = Deno.env.get('GOOGLE_CLIENT_ID');
const SECRETO = Deno.env.get('GOOGLE_CLIENT_SECRET');
const REFRESH = Deno.env.get('GOOGLE_REFRESH_TOKEN');
/** Calendario donde se crean los turnos (ej.: «VioGua · Turnos»). */
const CALENDARIO = Deno.env.get('GOOGLE_CALENDAR_ID') ?? 'primary';
/** Calendarios que también bloquean horarios (la agenda personal de Guada). */
const OCUPAN = [CALENDARIO, ...(Deno.env.get('GOOGLE_CALENDARIOS_OCUPADOS') ?? 'primary').split(',')]
  .map(c => c.trim())
  .filter((c, i, todos) => c && todos.indexOf(c) === i);
const ZONA = 'America/Argentina/Buenos_Aires';

export const conGoogle = Boolean(CLIENTE && SECRETO && REFRESH);

let acceso: { valor: string; vence: number } | null = null;
async function token(): Promise<string> {
  if (acceso && acceso.vence > Date.now() + 60_000) return acceso.valor;
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({ client_id: CLIENTE!, client_secret: SECRETO!, refresh_token: REFRESH!, grant_type: 'refresh_token' }),
  });
  if (!r.ok) throw new Error(`Google token ${r.status}: ${await r.text()}`);
  const j = await r.json();
  acceso = { valor: j.access_token, vence: Date.now() + j.expires_in * 1000 };
  return acceso.valor;
}

async function calendar<T>(ruta: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`https://www.googleapis.com/calendar/v3/${ruta}`, {
    ...init,
    headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' },
  });
  if (!r.ok) throw new Error(`Google ${ruta} ${r.status}: ${await r.text()}`);
  return r.json();
}
const cal = encodeURIComponent(CALENDARIO);

/** Lo ocupado en los calendarios de VioGua entre dos instantes. */
export async function ocupadosGoogle(desde: Date, hasta: Date): Promise<Ocupado[]> {
  if (!conGoogle) return [];
  const r = await calendar<{ calendars: Record<string, { busy: { start: string; end: string }[] }> }>('freeBusy', {
    method: 'POST',
    body: JSON.stringify({ timeMin: desde.toISOString(), timeMax: hasta.toISOString(), timeZone: ZONA, items: OCUPAN.map(id => ({ id })) }),
  });
  return Object.values(r.calendars).flatMap(c => c.busy.map(b => ({ inicio: Date.parse(b.start), fin: Date.parse(b.end) })));
}

/** Evento con link de Meet; Google le manda la invitación al email del cliente. */
export async function crearEvento(e: { titulo: string; descripcion: string; inicio: Date; fin: Date; email: string }) {
  const ev = await calendar<{ id: string; hangoutLink?: string }>(`calendars/${cal}/events?conferenceDataVersion=1&sendUpdates=all`, {
    method: 'POST',
    body: JSON.stringify({
      summary: e.titulo,
      description: e.descripcion,
      start: { dateTime: e.inicio.toISOString(), timeZone: ZONA },
      end: { dateTime: e.fin.toISOString(), timeZone: ZONA },
      attendees: [{ email: e.email }],
      conferenceData: { createRequest: { requestId: crypto.randomUUID(), conferenceSolutionKey: { type: 'hangoutsMeet' } } },
      reminders: { useDefault: true },
    }),
  });
  return { id: ev.id, meetUrl: ev.hangoutLink ?? null };
}

/**
 * Escribe (o reemplaza) una sección de la descripción del evento, sin avisar al cliente:
 * «— Fotos —», «— Test de estilo —».
 */
export async function seccionDelEvento(id: string, titulo: string, texto: string) {
  if (!conGoogle) return;
  const ruta = `calendars/${cal}/events/${encodeURIComponent(id)}`;
  const ev = await calendar<{ description?: string }>(ruta);
  const marca = `— ${titulo} —`;
  const partes = (ev.description ?? '').split(/\n\n(?=— .+ —\n)/).filter(p => p && !p.startsWith(marca));
  await calendar(`${ruta}?sendUpdates=none`, {
    method: 'PATCH',
    body: JSON.stringify({ description: [...partes, `${marca}\n${texto}`].join('\n\n') }),
  });
}
