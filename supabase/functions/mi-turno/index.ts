// GET ?t=<token> → { nombre, estado, inicio ('AAAA-MM-DDTHH:MM', hora de Argentina), cantidad, ambientes,
//   meetUrl, picks, fotos: [{ ambiente, url }], moodboard }
// Para retomar el test desde otro dispositivo y para la ficha del pedido (/estudio/?t=...), que es el
// link que le llega a VioGua en el WhatsApp. Solo lo ve quien tiene el link.
import { local } from '../_shared/agenda.ts';
import { adjuntos, reservaDe } from '../_shared/db.ts';
import { error, esToken, json, servir } from '../_shared/http.ts';

servir('GET', async req => {
  const token = new URL(req.url).searchParams.get('t');
  if (!esToken(token)) return error(req, 'No encontramos ese turno.', 404);
  const reserva = await reservaDe(token);
  if (!reserva) return error(req, 'No encontramos ese turno.', 404);
  const { fotos, test } = (await adjuntos([reserva.id]))[reserva.id];
  return json(req, {
    nombre: reserva.nombre,
    estado: reserva.estado,
    inicio: local(new Date(reserva.inicio)),
    cantidad: reserva.cantidad,
    ambientes: reserva.ambientes,
    meetUrl: reserva.meet_url,
    picks: test?.picks ?? null,
    fotos,
    moodboard: test?.moodboard ?? null,
  });
});
