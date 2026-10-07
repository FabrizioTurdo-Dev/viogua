// Conexión con el backend (Supabase Edge Functions). Sin PUBLIC_API_URL queda el modo demo:
// horarios de ejemplo y confirmación local, sin guardar ni enviar nada.
import { AGENDA } from '../../data/estudio';
import type { Picks } from '../../data/test';
import { desdeIso, mensajeConfirmacion } from '../mensajes';

const API = (import.meta.env.PUBLIC_API_URL as string | undefined)?.replace(/\/$/, '');
export const DEMO = !API;
export const WHATSAPP_AUTO = import.meta.env.PUBLIC_WHATSAPP_AUTO === 'true';

export interface Horario { hora: string; libre: boolean }
/** Horarios por día ('AAAA-MM-DD'). */
export type Disponibilidad = Record<string, Horario[]>;

export class ErrorApi extends Error {
  constructor(mensaje: string, public estado: number) {
    super(mensaje);
  }
}

async function pedir<T>(ruta: string, init?: RequestInit): Promise<T> {
  let r: Response;
  try {
    r = await fetch(`${API}/${ruta}`, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  } catch {
    throw new ErrorApi('No pudimos conectarnos. Revisá tu conexión y probá de nuevo.', 0);
  }
  const cuerpo = await r.json().catch(() => ({}));
  if (!r.ok) throw new ErrorApi(cuerpo.error ?? 'Algo salió mal. Probá de nuevo en un momento.', r.status);
  return cuerpo as T;
}

const esperar = (ms: number) => new Promise(ok => setTimeout(ok, ms));
export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const desdeIsoLocal = (s: string) => {
  const [a, m, d] = s.split('-').map(Number);
  return new Date(a, m - 1, d);
};

/* ---------- Disponibilidad ---------- */
function demoDisponibilidad(desde: string, hasta: string): Disponibilidad {
  const dias: Disponibilidad = {};
  const ahora = Date.now();
  const limite = new Date();
  limite.setDate(limite.getDate() + AGENDA.horizonteDias);
  for (let d = desdeIsoLocal(desde); d <= desdeIsoLocal(hasta); d.setDate(d.getDate() + 1)) {
    const base = AGENDA.horarios[d.getDay()] ?? [];
    if (!base.length || d > limite) continue;
    const horarios = base
      .map((hora, i) => {
        const [h, m] = hora.split(':').map(Number);
        const inicio = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m).getTime();
        // Ocupados de ejemplo, siempre los mismos para un mismo día.
        const ocupado = (d.getDate() * 7 + i * 3 + d.getMonth()) % 5 === 0;
        return { hora, libre: !ocupado, inicio };
      })
      .filter(h => h.inicio - ahora >= AGENDA.avisoMinHoras * 3600_000)
      .map(({ hora, libre }) => ({ hora, libre }));
    if (horarios.length) dias[iso(d)] = horarios;
  }
  return dias;
}

export async function disponibilidad(desde: string, hasta: string): Promise<Disponibilidad> {
  if (DEMO) {
    await esperar(350);
    return demoDisponibilidad(desde, hasta);
  }
  const r = await pedir<{ dias: Disponibilidad }>(`disponibilidad?desde=${desde}&hasta=${hasta}`);
  return r.dias;
}

/* ---------- Reserva ---------- */
export interface PedidoReserva {
  nombre: string;
  email: string;
  whatsapp: string;
  cantidad: number;
  ambientes: string[];
  fecha: string;
  hora: string;
  consentimiento: boolean;
  web: string; // trampa para bots
}
export interface Reserva {
  token: string | null;
  inicio: string;
  meetUrl: string | null;
  mensaje: string;
}

export async function reservar(p: PedidoReserva, testUrl: (token: string | null) => string): Promise<Reserva> {
  if (DEMO) {
    await esperar(900);
    const mensaje = mensajeConfirmacion({
      nombre: p.nombre,
      fecha: desdeIso(p.fecha),
      hora: p.hora,
      ambientes: p.ambientes,
      meetUrl: null,
      testUrl: testUrl(null),
    });
    return { token: null, inicio: `${p.fecha}T${p.hora}`, meetUrl: null, mensaje };
  }
  return pedir<Reserva>('reservar', { method: 'POST', body: JSON.stringify(p) });
}

/* ---------- Después de reservar ---------- */
export async function subirFotos(token: string, fotos: { blob: Blob; nombre: string; ambiente: string }[]) {
  if (DEMO || !fotos.length) return;
  const datos = new FormData();
  datos.append('token', token);
  fotos.forEach((f, i) => {
    datos.append(`foto${i}`, f.blob, f.nombre);
    datos.append(`ambiente${i}`, f.ambiente);
  });
  const r = await fetch(`${API}/subir-fotos`, { method: 'POST', body: datos });
  if (!r.ok) throw new ErrorApi('No pudimos subir las fotos.', r.status);
}

export async function enviarTest(token: string, picks: Picks, imagen: Blob) {
  if (DEMO) return;
  const datos = new FormData();
  datos.append('token', token);
  datos.append('picks', JSON.stringify(picks));
  datos.append('moodboard', imagen, 'moodboard.png');
  const r = await fetch(`${API}/enviar-test`, { method: 'POST', body: datos });
  if (!r.ok) throw new ErrorApi('No pudimos enviar tu test.', r.status);
}

export interface MiTurno {
  nombre: string;
  inicio: string;
  ambientes: string[];
  meetUrl: string | null;
  picks: Picks | null;
}
export const miTurno = (token: string) => pedir<MiTurno>(`mi-turno?t=${encodeURIComponent(token)}`);
