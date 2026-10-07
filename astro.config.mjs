// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Dominio público. Hasta que Guada defina el suyo, el del preview de Vercel.
const site = process.env.SITE_URL ?? 'https://viogua.vercel.app';

export default defineConfig({
  site,
  trailingSlash: 'always',
  server: { port: 5184 },
  integrations: [
    sitemap({
      filter: pagina => !pagina.includes('/estilo/'),
      changefreq: 'monthly',
    }),
  ],
  build: { inlineStylesheets: 'always' }, // el CSS es chico: inline evita pedidos que bloquean el render
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  devToolbar: { enabled: false },
});
