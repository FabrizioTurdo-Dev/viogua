// /llms.txt: resumen en Markdown para buscadores y asistentes con IA, generado desde los datos del estudio.
import type { APIRoute } from 'astro';
import { AGENDA, ESTUDIO, PASOS, PREGUNTAS, PROMO, SERVICIOS, instagramUrl, whatsappUrl } from '../data/estudio';

export const GET: APIRoute = ({ site }) => {
  const url = (ruta: string) => new URL(ruta, site).href;
  const contacto = [
    `- Instagram: [@${ESTUDIO.instagram}](${instagramUrl})`,
    whatsappUrl() && `- WhatsApp: ${whatsappUrl()}`,
    ESTUDIO.email && `- Email: ${ESTUDIO.email}`,
    `- Reuniones: videollamada por ${AGENDA.plataforma}`,
  ].filter(Boolean);

  const texto = [
    `# ${ESTUDIO.nombre}`,
    '',
    `> ${ESTUDIO.identidad}`,
    '',
    `${ESTUDIO.descripcion} Lema: «${ESTUDIO.lema}».`,
    '',
    '## Servicios',
    ...SERVICIOS.map(s => `- **${s.titulo}**: ${s.texto}`),
    `- **Promo**: ${PROMO.titulo}. ${PROMO.detalle}`,
    '',
    '## Cómo se trabaja',
    ...PASOS.map((p, i) => `${i + 1}. **${p.titulo}**: ${p.texto}`),
    '',
    '## Preguntas frecuentes',
    ...PREGUNTAS.flatMap(p => [`### ${p.pregunta}`, p.respuesta, '']),
    '## Contacto',
    ...contacto,
    '',
    '## Páginas',
    `- [Inicio](${url('/')}): presentación del estudio, proceso, test de estilo, promo y preguntas frecuentes.`,
    `- [Agendar reunión y test de estilo](${url('/test/')}): elegir ambientes, día y horario; después, el test de estilo con moodboard de regalo.`,
    `- [Política de privacidad](${url('/privacidad/')})`,
    '',
  ].join('\n');

  return new Response(texto, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
