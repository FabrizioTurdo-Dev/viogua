// POST multipart { token, picks (JSON), resumen, moodboard (PNG) } → { ok: true }
// Se puede mandar de nuevo si repite el test: reemplaza las elecciones y la imagen.
import { db, linksFirmados, reservaDe } from '../_shared/db.ts';
import { seccionDelEvento } from '../_shared/google.ts';
import { error, esToken, json, servir } from '../_shared/http.ts';
import { validarPicks } from '../_shared/validar.ts';

servir('POST', async req => {
  const datos = await req.formData().catch(() => null);
  const token = datos?.get('token');
  if (!datos || !esToken(token)) return error(req, 'Pedido inválido.', 400);
  const reserva = await reservaDe(token);
  if (!reserva) return error(req, 'No encontramos ese turno.', 404);

  let picks: Record<string, string[]> | null = null;
  try {
    picks = validarPicks(JSON.parse(String(datos.get('picks') ?? '')));
  } catch {
    /* queda null */
  }
  const imagen = datos.get('moodboard');
  if (!picks || !(imagen instanceof File) || imagen.type !== 'image/png' || imagen.size > 10 * 1024 * 1024) {
    return error(req, 'Pedido inválido.', 400);
  }
  const resumen = String(datos.get('resumen') ?? '').slice(0, 1500);

  const ruta = `${reserva.id}.png`;
  const { error: e1 } = await db.storage.from('moodboards').upload(ruta, imagen, { contentType: 'image/png', upsert: true });
  if (e1) throw e1;
  const { error: e2 } = await db
    .from('tests')
    .upsert({ reserva_id: reserva.id, picks, resumen, moodboard: ruta, actualizado: new Date().toISOString() });
  if (e2) throw e2;

  if (reserva.google_event_id) {
    const [link] = await linksFirmados('moodboards', [ruta]);
    await seccionDelEvento(reserva.google_event_id, 'Test de estilo', `${resumen}\nMoodboard: ${link}`).catch(err => console.error(err));
  }
  return json(req, { ok: true });
});
