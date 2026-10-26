// Cliente con service role (las tablas no tienen políticas para anon), lectura de reservas y de
// lo que se adjunta a cada una (fotos y test).
import { createClient } from 'npm:@supabase/supabase-js@2';

export const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

export type Estado = 'pendiente' | 'confirmada' | 'cancelada';

export interface Reserva {
  id: string;
  estado: Estado;
  nombre: string;
  inicio: string;
  cantidad: number;
  ambientes: string[];
  meet_url: string | null;
  google_event_id: string | null;
}

/** Reserva vigente (pendiente o confirmada) por el token del link, o null. */
export async function reservaDe(token: string): Promise<Reserva | null> {
  const { data, error } = await db
    .from('reservas')
    .select('id, estado, nombre, inicio, cantidad, ambientes, meet_url, google_event_id')
    .eq('token', token)
    .neq('estado', 'cancelada')
    .maybeSingle();
  if (error) throw error;
  return data;
}

const DIA = 86_400;

/** Links firmados para ver archivos privados (por defecto, 30 días). */
export async function linksFirmados(bucket: string, rutas: string[], segundos = 30 * DIA): Promise<string[]> {
  if (!rutas.length) return [];
  const { data, error } = await db.storage.from(bucket).createSignedUrls(rutas, segundos);
  if (error) throw error;
  return data.map(d => d.signedUrl ?? '');
}

export interface Foto { ambiente: string; url: string }
export interface Test { picks: Record<string, string[]>; resumen: string | null; moodboard: string | null; actualizado: string }
export interface Adjuntos { fotos: Foto[]; test: Test | null }

/** Fotos y test de varias reservas, con links firmados por un día (se arman cada vez que se miran). */
export async function adjuntos(ids: string[]): Promise<Record<string, Adjuntos>> {
  const porReserva: Record<string, Adjuntos> = Object.fromEntries(ids.map(id => [id, { fotos: [], test: null }]));
  if (!ids.length) return porReserva;
  const [fotos, tests] = await Promise.all([
    db.from('fotos').select('reserva_id, ambiente, ruta').in('reserva_id', ids).order('creada'),
    db.from('tests').select('reserva_id, picks, resumen, moodboard, actualizado').in('reserva_id', ids),
  ]);
  if (fotos.error) throw fotos.error;
  if (tests.error) throw tests.error;

  const [linksFotos, linksMoodboards] = await Promise.all([
    linksFirmados('ambientes', fotos.data.map(f => f.ruta), DIA),
    linksFirmados('moodboards', tests.data.flatMap(t => (t.moodboard ? [t.moodboard] : [])), DIA),
  ]);
  fotos.data.forEach((f, i) => porReserva[f.reserva_id].fotos.push({ ambiente: f.ambiente, url: linksFotos[i] }));
  let m = 0;
  for (const t of tests.data) {
    porReserva[t.reserva_id].test = {
      picks: t.picks,
      resumen: t.resumen,
      moodboard: t.moodboard ? linksMoodboards[m++] || null : null,
      actualizado: t.actualizado,
    };
  }
  return porReserva;
}
