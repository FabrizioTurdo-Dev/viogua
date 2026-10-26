// Conexión con el backend (Supabase Edge Functions). Sin PUBLIC_API_URL (CON_BACKEND en false) el
// turno se pide por WhatsApp sin guardar nada: horarios de la agenda y reserva local.
import { AGENDA, CON_BACKEND } from '../../data/estudio';
import type { Picks } from '../../data/test';

const API = (import.meta.env.PUBLIC_API_URL as string | undefined)?.replace(/\/$/, '');
export const WHATSAPP_AUTO = import.meta.env.PUBLIC_WHATSAPP_AUTO === 'true';

export interface Horario { hora: string; libre: boolean }
/** Horarios por día ('AAAA-MM-DD'). */
export type Disponibilidad = Record<string, Horario[]>;

export class ErrorApi extends Error {
  constructor(mensaje: string, public estado: number) {
    super(mensaje);
  }
}

export async function pedir<T>(ruta: string, init?: RequestInit): Promise<T> {
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
// Sin backend: todos los horarios de la agenda, con el aviso mínimo y el horizonte. VioGua
// confirma a mano, así que un horario pedido dos veces se resuelve al responder.
function disponibilidadLocal(desde: string, hasta: string): Disponibilidad {
  const dias: Disponibilidad = {};
  const ahora = Date.now();
  const limite = new Date();
  limite.setDate(limite.getDate() + AGENDA.horizonteDias);
  for (let d = desdeIsoLocal(desde); d <= desdeIsoLocal(hasta); d.setDate(d.getDate() + 1)) {
    const base = AGENDA.horarios[d.getDay()] ?? [];
    if (!base.length || d > limite) continue;
    const horarios = base
      .filter(hora => {
        const [h, m] = hora.split(':').map(Number);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m).getTime() - ahora >= AGENDA.avisoMinHoras * 3600_000;
      })
      .map(hora => ({ hora, libre: true }));
    if (horarios.length) dias[iso(d)] = horarios;
  }
  return dias;
}

export async function disponibilidad(desde: string, hasta: string): Promise<Disponibilidad> {
  if (!CON_BACKEND) {
    await esperar(350);
    return disponibilidadLocal(desde, hasta);
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
export type EstadoTurno = 'pendiente' | 'confirmada' | 'cancelada';
export interface Reserva {
  /** Link del test y de la ficha del pedido. Sin backend no hay. */
  token: string | null;
  /** Pendiente hasta que VioGua lo confirma; confirmada de entrada con Google Calendar. */
  estado: EstadoTurno;
  inicio: string;
  meetUrl: string | null;
  /** Confirmación que arma el backend. Por WhatsApp no hay: la pantalla arma el pedido. */
  mensaje: string | null;
}

export async function reservar(p: PedidoReserva): Promise<Reserva> {
  if (!CON_BACKEND) {
    await esperar(600);
    return { token: null, estado: 'pendiente', inicio: `${p.fecha}T${p.hora}`, meetUrl: null, mensaje: null };
  }
  return pedir<Reserva>('reservar', { method: 'POST', body: JSON.stringify(p) });
}

/* ---------- Después de reservar ---------- */
export async function subirFotos(token: string, fotos: { blob: Blob; nombre: string; ambiente: string }[]) {
  if (!CON_BACKEND || !fotos.length) return;
  const datos = new FormData();
  datos.append('token', token);
  fotos.forEach((f, i) => {
    datos.append(`foto${i}`, f.blob, f.nombre);
    datos.append(`ambiente${i}`, f.ambiente);
  });
  const r = await fetch(`${API}/subir-fotos`, { method: 'POST', body: datos });
  if (!r.ok) throw new ErrorApi('No pudimos subir las fotos.', r.status);
}

/** `resumen`: las elecciones con nombre, para que el estudio las lea en el panel o en el evento. */
export async function enviarTest(token: string, picks: Picks, resumen: string, imagen: Blob) {
  if (!CON_BACKEND) return;
  const datos = new FormData();
  datos.append('token', token);
  datos.append('picks', JSON.stringify(picks));
  datos.append('resumen', resumen);
  datos.append('moodboard', imagen, 'moodboard.png');
  const r = await fetch(`${API}/enviar-test`, { method: 'POST', body: datos });
  if (!r.ok) throw new ErrorApi('No pudimos enviar tu test.', r.status);
}

export interface FotoAmbiente { ambiente: string; url: string }
export interface MiTurno {
  nombre: string;
  estado: EstadoTurno;
  /** 'AAAA-MM-DDTHH:MM', hora de Argentina. */
  inicio: string;
  cantidad: number;
  ambientes: string[];
  meetUrl: string | null;
  picks: Picks | null;
  fotos: FotoAmbiente[];
  /** Link firmado de la imagen del moodboard (vale un día). */
  moodboard: string | null;
}
export const miTurno = (token: string) => pedir<MiTurno>(`mi-turno?t=${encodeURIComponent(token)}`);

/* ---------- Panel del estudio (/estudio/) ---------- */
export interface TurnoEstudio {
  id: string;
  token: string;
  estado: EstadoTurno;
  nombre: string;
  email: string;
  whatsapp: string;
  cantidad: number;
  ambientes: string[];
  /** 'AAAA-MM-DDTHH:MM', hora de Argentina. */
  inicio: string;
  meetUrl: string | null;
  creada: string;
  fotos: FotoAmbiente[];
  test: { picks: Picks; resumen: string | null; moodboard: string | null; actualizado: string } | null;
}

const conClave = (clave: string, init?: RequestInit): RequestInit => ({ ...init, headers: { 'x-clave': clave, ...init?.headers } });

export const turnosEstudio = (clave: string) => pedir<{ quien: string; turnos: TurnoEstudio[] }>('estudio', conClave(clave));

export const cambiarTurno = (clave: string, id: string, cambios: { estado?: EstadoTurno; meetUrl?: string }) =>
  pedir<{ turno: TurnoEstudio }>('estudio', conClave(clave, { method: 'POST', body: JSON.stringify({ id, ...cambios }) }));
