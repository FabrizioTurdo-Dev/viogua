// /robots.txt: todo indexable salvo la guía de estilo. Los rastreadores de búsqueda con IA
// tienen permiso explícito: al estudio le conviene aparecer en sus respuestas.
import type { APIRoute } from 'astro';

const BUSCADORES_IA = [
  'OAI-SearchBot',
  'ChatGPT-User',
  'GPTBot',
  'PerplexityBot',
  'Perplexity-User',
  'Claude-SearchBot',
  'Claude-User',
  'ClaudeBot',
  'Google-Extended',
  'Applebot-Extended',
  'Bingbot',
];

export const GET: APIRoute = ({ site }) => {
  const texto = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /estilo/',
    '',
    ...BUSCADORES_IA.flatMap(bot => [`User-agent: ${bot}`, 'Allow: /', 'Disallow: /estilo/', '']),
    `Sitemap: ${new URL('/sitemap-index.xml', site).href}`,
    '',
  ].join('\n');
  return new Response(texto, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
