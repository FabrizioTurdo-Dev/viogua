// POST { nombre, email, whatsapp, cantidad, ambientes, fecha, hora, consentimiento, web }
// → 201 { token, estado, inicio, meetUrl, mensaje: null } · 409 si el horario se ocupó.
// Sin Google Calendar el turno queda «pendiente»: retiene el horario, la persona le manda el pedido
// al estudio por WhatsApp y VioGua lo confirma a mano desde /estudio/. Con Google se confirma acá,
// con evento y link de Meet. Los mensajes los arma el sitio (src/scripts/mensajes.ts).
import { AGENDA, enAgenda, instante } from '../_shared/agenda.ts';
import { db } from '../_shared/db.ts';
import { conGoogle, crearEvento, ocupadosGoogle } from '../_shared/google.ts';
import { error, json, servir } from '../_shared/http.ts';
import { validarPedido } from '../_shared/validar.ts';

const OCUPADO = 'Ese horario se acaba de ocupar. Elegí otro, por favor.';

servir('POST', async req => {
  const p = validarPedido(await req.json().catch(() => null));
  if (typeof p === 'string') return error(req, p, 400);
  if (!enAgenda(p.fecha, p.hora)) return error(req, OCUPADO, 409);
  const inicio = instante(p.fecha, p.hora);
  const fin = new Date(inicio.getTime() + AGENDA.duracionMin * 60_000);

  // Límite contra abusos: tres turnos por email por día.
  const { count, error: e1 } = await db
    .from('reservas')
    .select('id', { count: 'exact', head: true })
    .eq('email', p.email)
    .gte('creada', new Date(Date.now() - 86_400_000).toISOString());
  if (e1) throw e1;
  if ((count ?? 0) >= 3) return error(req, 'Ya agendaste varias reuniones hoy. Escribinos por WhatsApp y lo vemos.', 429);

  if ((await ocupadosGoogle(inicio, fin)).length) return error(req, OCUPADO, 409);

  const { data: reserva, error: e2 } = await db
    .from('reservas')
    .insert({
      nombre: p.nombre,
      email: p.email,
      whatsapp: p.whatsapp,
      cantidad: p.cantidad,
      ambientes: p.ambientes,
      inicio: inicio.toISOString(),
      fin: fin.toISOString(),
      estado: conGoogle ? 'confirmada' : 'pendiente',
      consentimiento: true,
    })
    .select('id, token, estado')
    .single();
  if (e2) {
    if (e2.code === '23505') return error(req, OCUPADO, 409); // otro pedido tomó el horario recién
    throw e2;
  }

  let meetUrl: string | null = null;
  if (conGoogle) {
    try {
      const ev = await crearEvento({
        titulo: `VioGua · ${p.nombre}`,
        descripcion: [
          `Cliente: ${p.nombre}`,
          `WhatsApp: https://wa.me/${p.whatsapp}`,
          `Email: ${p.email}`,
          `Ambientes (${p.cantidad === 4 ? '4 + 1 de regalo' : p.cantidad}): ${p.ambientes.join(', ')}`,
        ].join('\n'),
        inicio,
        fin,
        email: p.email,
      });
      meetUrl = ev.meetUrl;
      const { error: e3 } = await db.from('reservas').update({ google_event_id: ev.id, meet_url: ev.meetUrl }).eq('id', reserva.id);
      if (e3) console.error(e3);
    } catch (err) {
      // Sin evento no hay reunión: se deshace la reserva para no dejar el horario tomado.
      console.error(err);
      await db.from('reservas').delete().eq('id', reserva.id);
      return error(req, 'No pudimos crear la reunión en la agenda. Probá de nuevo en un momento.', 502);
    }
  }

  return json(req, { token: reserva.token, estado: reserva.estado, inicio: `${p.fecha}T${p.hora}`, meetUrl, mensaje: null }, 201);
});
