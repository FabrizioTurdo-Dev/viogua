# VioGua · sitio web

Sitio de **VioGua**, estudio de diseño de interiores: portada, turno por videollamada y test de estilo con moodboard de regalo.

- **Portada** (`/`): hero, pilares, proceso, test de moodboard (el arco como puerta), promo 4 + 1, sobre VioGua, preguntas frecuentes y footer con navegación y reuniones.
- **Turno y test** (`/test/`): cantidad de ambientes → nombres y fotos → día, horario y datos → confirmación → test de 4 pasos → moodboard (collage en pantalla e imagen 1080 × 1920 para historias).
- **Panel del estudio** (`/estudio/`, fuera de buscadores): con la clave de VioGua, los turnos pedidos para agendarlos, confirmarlos, avisar por WhatsApp o cancelarlos; con `?t=…`, la ficha de un pedido (datos, fotos y test).
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
| Contacto, agenda, precios, promo, pilares, proceso, servicios, preguntas frecuentes, crédito | `src/data/estudio.ts` |
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
| `SITE_URL` | Dominio público (sitemap, canonical, Open Graph). Por defecto `https://vioguamvp.vercel.app` (el proyecto «vioguamvp» de Vercel). |
| `PUBLIC_API_URL` | URL de las Edge Functions de Supabase (`https://aqerfgqnvpwkmcynlcjj.supabase.co/functions/v1`). Con valor, el pedido se guarda, el horario queda tomado, se suben fotos y test, y VioGua gestiona los turnos en `/estudio/`. **Vacía**: el turno se pide por WhatsApp y el sitio no guarda nada. |
| `PUBLIC_GOOGLE_CALENDAR` | `true` cuando Google Calendar esté conectado en Supabase: el turno se confirma solo, con evento y link de Meet. Mientras tanto (`false`), la persona le manda el pedido por WhatsApp y VioGua lo confirma a mano. |
| `PUBLIC_WHATSAPP_AUTO` | `true` cuando el envío por WhatsApp Cloud API esté aprobado. Mientras tanto, la confirmación ofrece «Confirmá por WhatsApp» al número del estudio. |

## SEO y GEO

- Todo el contenido sale en el HTML estático: Google y los buscadores con IA lo leen sin ejecutar JavaScript.
- Cada página tiene título, descripción, canonical, Open Graph y Twitter (`src/components/layout/Seo.astro`).
- Datos estructurados: `ProfessionalService`, `WebSite`, `FAQPage` y `Service`/`Offer` de la promo.
- `/llms.txt` (resumen en Markdown) y `/robots.txt` (con permiso explícito para los rastreadores de búsqueda con IA) se generan desde `estudio.ts`.
- Después de publicar: dar de alta el dominio en Google Search Console y Bing Webmaster Tools, y enviar el sitemap.

## Deploy (Vercel)

1. Importar el repositorio `github.com/FabrizioTurdo-Dev/viogua` en Vercel (detecta Astro solo).
2. Cargar las variables de entorno (con los turnos por WhatsApp alcanza con `SITE_URL`).
3. Cada rama genera un preview; `main` publica producción.

## Backend (Supabase)

Proyecto propio de VioGua, separado de los demás: **`viogua`**, ref `aqerfgqnvpwkmcynlcjj`. El MCP de Supabase está en `../.mcp.json` (raíz de la carpeta VioGua).

| Pieza | Dónde |
|---|---|
| Tablas `reservas`, `tests`, `fotos`, `accesos` (RLS sin políticas: solo las funciones) y buckets privados `ambientes`, `moodboards` | `supabase/migrations/20261026000000_turnos.sql` |
| Funciones del sitio `disponibilidad`, `reservar`, `subir-fotos`, `enviar-test`, `mi-turno` y del panel `estudio` (públicas, sin JWT) | `supabase/functions/*/index.ts` |
| Agenda (la misma de `estudio.ts`; un test lo verifica), validación, CORS, acceso al panel, Google Calendar | `supabase/functions/_shared/` |

**Cómo funciona sin Google Calendar** (hoy):

1. La persona elige ambientes (con fotos), día y horario. `reservar` guarda el turno como **pendiente**: el horario deja de ofrecerse en el sitio.
2. La pantalla le arma el pedido para mandarle a VioGua por WhatsApp, con el link a la **ficha del pedido** (`/estudio/?t=…`: datos, fotos y, cuando lo haga, el test con su moodboard).
3. VioGua abre la ficha (en su dispositivo, con la clave, se abre el panel en ese turno) y:
   - **Agendar en Google Calendar**: abre el evento ya armado (día, hora, cliente como invitado, datos y ficha). Le suma Meet y lo guarda: Google le manda la invitación al cliente.
   - Pega el link de Meet y toca **Confirmar turno**.
   - **Avisar por WhatsApp**: abre el chat con el cliente con la confirmación escrita (día, hora, Meet y link del test).
   - **Cancelar turno** libera el horario y ofrece el aviso de cancelación.

Un horario, una reserva: índice único sobre `inicio` de los turnos no cancelados. Si dos personas piden el mismo turno a la vez, la segunda recibe 409.

**Acceso al panel**: cada clave se guarda solo como SHA-256 en la tabla `accesos` (`nombre`, `clave_sha256`). Para dar una clave nueva, generar una al azar (32 caracteres o más), insertar su hash y pasar el link `https://<dominio>/estudio/#clave=<clave>`: el panel la guarda en ese dispositivo y la saca de la barra. Para quitar un acceso, borrar su fila.

Publicar (con el MCP autenticado, o con la CLI logueada en la cuenta de VioGua y `supabase link --project-ref aqerfgqnvpwkmcynlcjj`):

1. Confirmar que el ref corresponde al proyecto `viogua`.
2. Aplicar la migración y desplegar las seis funciones con `verify_jwt = false` (`supabase/config.toml`).
3. Secreto `ORIGENES` cuando haya dominio propio: dominios del sitio separados por coma (ej.: `https://viogua.com.ar,https://vioguamvp.vercel.app`). Por defecto acepta `http://localhost:5184` y `https://vioguamvp.vercel.app`.
4. En Vercel y en `.env`: `PUBLIC_API_URL=https://aqerfgqnvpwkmcynlcjj.supabase.co/functions/v1`.

**Estado (26/10/2026)**: pasos 1 y 2 hechos con el MCP (migración `turnos`, seis funciones activas, probadas de punta a punta). Accesos `guada` y `fabrizio` cargados; las claves están en `../claves-panel-estudio.txt`, fuera del repo. Falta el paso 4.

Al desplegar con el MCP, cada función se sube con su `index.ts` y los `_shared/*.ts` que usa, con la misma estructura de carpetas (entrypoint `<función>/index.ts`) para que los imports `../_shared/…` resuelvan.

Chequear las funciones sin publicarlas: `npx deno@2 check --no-lock --node-modules-dir=none supabase/functions/*/index.ts`.

## Próximas fases

1. **Google Calendar + Meet**: OAuth con refresh token de la cuenta de VioGua (app publicada en producción), calendario «VioGua · Turnos». Secretos en Supabase: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_CALENDAR_ID` y, si hace falta, `GOOGLE_CALENDARIOS_OCUPADOS` (por defecto `primary`). Con eso, `PUBLIC_GOOGLE_CALENDAR=true`: `reservar` confirma el turno sola, crea el evento con Meet y la disponibilidad descuenta lo ocupado en la agenda de Guada.
2. **WhatsApp Cloud API**: plantilla `viogua_turno_confirmado` (utility), envío desde la función `reservar` y `PUBLIC_WHATSAPP_AUTO=true`.

## Pendientes de VioGua

- Logo definitivo (o aprobar el sistema propuesto en `/estilo/`) y moodboard de ejemplo en alta resolución.
- Ciudad del estudio; quién está detrás de VioGua (para «Sobre VioGua»).
- Confirmar duración (60 min), aviso mínimo (24 h) y feriados de las reuniones; los horarios ya están definidos.
- Validar el texto de confirmación, las preguntas frecuentes, los servicios y la política de privacidad.
- Dominio. Perfil de Google Business (como negocio de área de servicio).
- Aviso: la videollamada pasa de Zoom a Google Meet.
