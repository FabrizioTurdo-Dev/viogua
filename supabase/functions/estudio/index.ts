// Panel del estudio (/estudio/), con la clave en el header «x-clave».
// GET → { quien, turnos }: del último mes en adelante, con fotos y test.
// POST { id, estado?, meetUrl? } → { turno } · 409 si al reactivar un turno su horario ya está tomado.
import { quienEntra } from '../_shared/acceso.ts';
import { local } from '../_shared/agenda.ts';
import { adjuntos, db, type Estado } from '../_shared/db.ts';
import { error, esToken, json, servir } from '../_shared/http.ts';

const CAMPOS = 'id, token, estado, nombre, email, whatsapp, cantidad, ambientes, inicio, meet_url, creada';
const ESTADOS: Estado[] = ['pendiente', 'confirmada', 'cancelada'];

interface Fila {
  id: string;
  token: string;
  estado: Estado;
  nombre: string;
  email: string;
  whatsapp: string;
  cantidad: number;
  ambientes: string[];
  inicio: string;
  meet_url: string | null;
  creada: string;
}

async function conAdjuntos(filas: Fila[]) {
  const extra = await adjuntos(filas.map(f => f.id));
  return filas.map(({ inicio, meet_url, ...f }) => ({ ...f, inicio: local(new Date(inicio)), meetUrl: meet_url, ...extra[f.id] }));
}

servir(['GET', 'POST'], async req => {
  const quien = await quienEntra(req);
  if (!quien) return error(req, 'La clave no es válida.', 401);

  if (req.method === 'GET') {
    const desde = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const { data, error: e } = await db.from('reservas').select(CAMPOS).gte('inicio', desde).order('inicio');
    if (e) throw e;
    return json(req, { quien, turnos: await conAdjuntos(data as Fila[]) }, 200, { 'Cache-Control': 'no-store' });
  }

  const cuerpo = await req.json().catch(() => null);
  if (!cuerpo || !esToken(cuerpo.id)) return error(req, 'Pedido inválido.', 400);
  const cambios: { estado?: Estado; meet_url?: string | null } = {};
  if (cuerpo.estado !== undefined) {
    if (!ESTADOS.includes(cuerpo.estado)) return error(req, 'Pedido inválido.', 400);
    cambios.estado = cuerpo.estado;
  }
  if (cuerpo.meetUrl !== undefined) {
    const url = typeof cuerpo.meetUrl === 'string' ? cuerpo.meetUrl.trim() : '';
    if (url && (url.length > 300 || !/^https:\/\/\S+$/.test(url))) return error(req, 'Revisá el link de la videollamada.', 400);
    cambios.meet_url = url || null;
  }
  if (!Object.keys(cambios).length) return error(req, 'Pedido inválido.', 400);

  const { data, error: e } = await db.from('reservas').update(cambios).eq('id', cuerpo.id).select(CAMPOS).maybeSingle();
  if (e) {
    if (e.code === '23505') return error(req, 'Ese horario ya lo tiene otro turno. Cancelá ese primero.', 409);
    throw e;
  }
  if (!data) return error(req, 'No encontramos ese turno.', 404);
  return json(req, { turno: (await conAdjuntos([data as Fila]))[0] });
});
