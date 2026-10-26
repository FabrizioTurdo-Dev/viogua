// GET ?desde=AAAA-MM-DD&hasta=AAAA-MM-DD → { dias: { 'AAAA-MM-DD': [{ hora, libre }] } }
// Horarios de la agenda menos las reservas vigentes (pendientes y confirmadas) y lo ocupado en
// Google Calendar, si está conectado.
import { horarios, instante } from '../_shared/agenda.ts';
import { db } from '../_shared/db.ts';
import { ocupadosGoogle } from '../_shared/google.ts';
import { error, json, servir } from '../_shared/http.ts';

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

servir('GET', async req => {
  const url = new URL(req.url);
  const desde = url.searchParams.get('desde') ?? '';
  const hasta = url.searchParams.get('hasta') ?? '';
  if (!FECHA.test(desde) || !FECHA.test(hasta) || hasta < desde) return error(req, 'Fechas inválidas.', 400);
  const inicio = instante(desde, '00:00');
  const fin = new Date(instante(hasta, '00:00').getTime() + 86_400_000);
  if (fin.getTime() - inicio.getTime() > 62 * 86_400_000) return error(req, 'Pedí como mucho dos meses.', 400);

  const { data, error: e } = await db
    .from('reservas')
    .select('inicio, fin')
    .neq('estado', 'cancelada')
    .lt('inicio', fin.toISOString())
    .gt('fin', inicio.toISOString());
  if (e) throw e;
  const ocupados = data.map(r => ({ inicio: Date.parse(r.inicio), fin: Date.parse(r.fin) }));
  // Si Google no responde se muestran igual; `reservar` vuelve a chequear antes de confirmar.
  const deGoogle = await ocupadosGoogle(inicio, fin).catch(err => (console.error(err), []));

  return json(req, { dias: horarios(desde, hasta, [...ocupados, ...deGoogle]) }, 200, { 'Cache-Control': 'max-age=30' });
});
