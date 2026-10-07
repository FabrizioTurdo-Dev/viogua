# VioGua · sitio web

Sitio de **VioGua**, estudio de diseño de interiores: portada, turno por videollamada y test de estilo con moodboard de regalo.

- **Portada** (`/`): hero, pilares, proceso, test de moodboard (el arco como puerta), promo 4 + 1, sobre VioGua, preguntas frecuentes y footer con navegación y reuniones.
- **Turno y test** (`/test/`): cantidad de ambientes → nombres y fotos → día, horario y datos → confirmación → test de 4 pasos → moodboard (collage en pantalla e imagen 1080 × 1920 para historias).
- **Privacidad** (`/privacidad/`), **404**, **guía de estilo** (`/estilo/`, fuera de buscadores), `robots.txt`, `llms.txt` y `sitemap-index.xml`.

## Stack

| | |
|---|---|
| Framework | [Astro](https://astro.build) 7, salida estática (HTML ya armado; sin framework en el navegador) |
| Lenguaje | TypeScript en scripts y datos; HTML y CSS propios |
| Estilos | CSS con tokens (`src/styles/tokens.css`), modo claro y «modo azul» (el oscuro que pidió VioGua: todo en #0066ff, resaltes en yeso) |
| Fuentes | Fraunces recortada por `scripts/marca.mjs`, Instrument Sans y DM Mono autoalojadas (Fontsource) |
| Marca | opentype.js, subset-font, potrace y sharp generan logo, íconos e imagen para redes |
| Imágenes | `astro:assets` + sharp: AVIF/WebP, `srcset` y medidas en el build |
| Animación | CSS, Web Animations y View Transitions, sin librerías; respeta «reducir movimiento» |
| Calidad | `astro check` (tipos), Vitest (lógica), Prettier |
| Hosting | Vercel (`vercel.json` con headers de seguridad y cache) |

## Comandos

```bash
npm install
npm run dev        # http://localhost:5184
npm run build      # astro check + build en dist/
npm run preview    # sirve dist/
npm test           # Vitest: mensajes, teléfono, collage
npm run marca      # regenera logo, íconos, fuentes recortadas e imagen para redes
```

Requiere Node 22.12 o más nuevo.

## Dónde se edita cada cosa

| Qué | Archivo |
|---|---|
| Contacto, agenda de ejemplo, promo, pilares, proceso, servicios, preguntas frecuentes, crédito | `src/data/estudio.ts` |
| Estilos, colores, sensaciones, materiales, frases de carga y forma del collage | `src/data/test.ts` |
| Fotos de estilos y materiales | `src/assets/estilos/`, `src/assets/materiales/` |
| Texto de confirmación del turno | `src/scripts/mensajes.ts` (`mensajeConfirmacion`) |
| Datos estructurados (schema.org) | `src/data/esquema.ts` |
| Colores, sombras, tipografía y movimiento | `src/styles/tokens.css` |
| Logo | `src/brand/` (generado por `scripts/marca.mjs`) |

Lo que VioGua todavía no definió queda en `null` en `estudio.ts`: en producción no se muestra y en `npm run dev` aparece marcado como «a definir».

### Logo

El wordmark sale de `src/assets/marca/logo-azul.png` (PNG con transparencia entregado por VioGua; `logo-blanco.png` queda de referencia). `scripts/marca.mjs` lo parte en letras, lo vectoriza con [potrace](https://www.npmjs.com/package/potrace) y escribe un `<path>` por letra en `src/brand/logo.svg` (color `currentColor`: azul sobre claro, blanco sobre el azul). Cada letra ondula con una animación CSS (`.logo-letra` en `base.css`), que se acelera al pasar el cursor y se apaga con «reducir movimiento».

Del mismo script salen `trazos.ts` (para el canvas de la historia), el isotipo del aro con puerta (favicon, íconos de la app y monograma), las fuentes recortadas y `public/og.jpg`. Para cambiar el logo, reemplazar `logo-azul.png` y correr `npm run marca`.

## Variables de entorno

Copiar `.env.example` a `.env`.

| Variable | Para qué |
|---|---|
| `SITE_URL` | Dominio público (sitemap, canonical, Open Graph). Por defecto `https://viogua.vercel.app`. |
| `PUBLIC_API_URL` | URL de las Edge Functions de Supabase. **Vacía = modo demo**: horarios de ejemplo y confirmación local, sin guardar ni enviar nada. |
| `PUBLIC_WHATSAPP_AUTO` | `true` cuando el envío por WhatsApp Cloud API esté aprobado. Mientras tanto, la confirmación ofrece «Confirmá por WhatsApp» al número del estudio. |

## SEO y GEO

- Todo el contenido sale en el HTML estático: Google y los buscadores con IA lo leen sin ejecutar JavaScript.
- Cada página tiene título, descripción, canonical, Open Graph y Twitter (`src/components/layout/Seo.astro`).
- Datos estructurados: `ProfessionalService`, `WebSite`, `FAQPage` y `Service`/`Offer` de la promo.
- `/llms.txt` (resumen en Markdown) y `/robots.txt` (con permiso explícito para los rastreadores de búsqueda con IA) se generan desde `estudio.ts`.
- Después de publicar: dar de alta el dominio en Google Search Console y Bing Webmaster Tools, y enviar el sitemap.

## Deploy (Vercel)

1. Importar el repositorio `github.com/FabrizioTurdo-Dev/viogua` en Vercel (detecta Astro solo).
2. Cargar las variables de entorno (en modo demo alcanza con `SITE_URL`).
3. Cada rama genera un preview; `main` publica producción.

## Próximas fases (backend)

Se hacen cuando estén las cuentas y credenciales:

1. **Supabase** (proyecto nuevo, región sa-east-1): tablas `reservas`, `tests`, `bloqueos`, `avisos` con RLS; buckets privados `ambientes` y `moodboards`; funciones `disponibilidad`, `reservar`, `subir-fotos`, `enviar-test` y `mi-turno` (`Deno.serve`, CORS por dominio, validación del lado servidor). El front ya llama a esas rutas desde `src/scripts/test/api.ts`.
2. **Google Calendar + Meet**: OAuth con refresh token de la cuenta de VioGua (app publicada en producción), calendario «VioGua · Turnos», evento con link de Meet e invitación al email del cliente.
3. **WhatsApp Cloud API**: plantilla `viogua_turno_confirmado` (utility), envío desde la función `reservar` y `PUBLIC_WHATSAPP_AUTO=true`.

## Pendientes de VioGua

- Logo definitivo (o aprobar el sistema propuesto en `/estilo/`) y moodboard de ejemplo en alta resolución.
- WhatsApp, email y ciudad del estudio; quién está detrás de VioGua (para «Sobre VioGua»).
- Días, horarios, duración, margen y aviso mínimo de las reuniones.
- Validar el texto de confirmación, las preguntas frecuentes, los servicios y la política de privacidad.
- Dominio. Perfil de Google Business (como negocio de área de servicio).
- Aviso: la videollamada pasa de Zoom a Google Meet.
