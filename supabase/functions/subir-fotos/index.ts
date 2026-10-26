// POST multipart { token, foto0..foto4, ambiente0..ambiente4 } → { ok: true }
// Las fotos llegan achicadas por el navegador (≤ 1600 px). Se guardan en el bucket privado
// «ambientes» y, con Google, los links quedan en la descripción del evento.
import { db, linksFirmados, reservaDe } from '../_shared/db.ts';
import { seccionDelEvento } from '../_shared/google.ts';
import { error, esToken, json, servir } from '../_shared/http.ts';

const TIPOS: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX = 5 * 1024 * 1024;

servir('POST', async req => {
  const datos = await req.formData().catch(() => null);
  const token = datos?.get('token');
  if (!datos || !esToken(token)) return error(req, 'Pedido inválido.', 400);
  const reserva = await reservaDe(token);
  if (!reserva) return error(req, 'No encontramos ese turno.', 404);

  const fotos: { archivo: File; ambiente: string }[] = [];
  for (let i = 0; i < 5; i++) {
    const archivo = datos.get(`foto${i}`);
    if (!(archivo instanceof File)) continue;
    if (!TIPOS[archivo.type] || archivo.size > MAX) return error(req, 'Alguna foto no es válida o es muy pesada.', 400);
    fotos.push({ archivo, ambiente: String(datos.get(`ambiente${i}`) ?? '').trim().slice(0, 60) || `Ambiente ${i + 1}` });
  }
  if (!fotos.length) return json(req, { ok: true });

  const rutas: string[] = [];
  for (const [i, f] of fotos.entries()) {
    const ruta = `${reserva.id}/${Date.now()}-${i + 1}.${TIPOS[f.archivo.type]}`;
    const { error: e1 } = await db.storage.from('ambientes').upload(ruta, f.archivo, { contentType: f.archivo.type });
    if (e1) throw e1;
    const { error: e2 } = await db.from('fotos').insert({ reserva_id: reserva.id, ambiente: f.ambiente, ruta });
    if (e2) throw e2;
    rutas.push(ruta);
  }

  if (reserva.google_event_id) {
    const { data: todas } = await db.from('fotos').select('ambiente, ruta').eq('reserva_id', reserva.id).order('creada');
    const lista = todas ?? [];
    const links = await linksFirmados('ambientes', lista.map(f => f.ruta));
    await seccionDelEvento(reserva.google_event_id, 'Fotos', lista.map((f, i) => `${f.ambiente}: ${links[i]}`).join('\n')).catch(
      err => console.error(err)
    );
  }
  return json(req, { ok: true, fotos: rutas.length });
});
