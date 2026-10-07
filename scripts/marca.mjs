// Genera los recursos de marca y las fuentes web a partir de las tipografías de Fontsource.
// Una sola fuente de verdad para el logo: la cabecera, el footer, el collage, el canvas
// de la historia de Instagram, el favicon y la imagen para redes salen de acá.
//
//   npm run marca
//
// Salidas (se versionan, el build no depende de este script):
//   src/brand/logo.svg, isotipo.svg, monograma.svg, trazos.ts
//   src/assets/fuentes/fraunces.woff2, fraunces-italica.woff2
//   public/favicon.svg, apple-touch-icon.png, icono-192.png, icono-512.png, og.jpg

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';
import sharp from 'sharp';
import subsetFont from 'subset-font';
import potrace from 'potrace';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ruta = (...p) => resolve(raiz, ...p);
const fs = p => ruta('node_modules/@fontsource-variable/fraunces/files', p);

const AZUL = '#0066ff';
const ROSA = '#fcbcd4';
const BLANCO = '#FFFFFF';
const f1 = n => Math.round(n * 100) / 100;

async function escribir(destino, datos) {
  await mkdir(dirname(destino), { recursive: true });
  await writeFile(destino, datos);
  console.log('  ✓', destino.replace(raiz, '').replaceAll('\\', '/'));
}

/** Instancia una fuente variable en unos ejes fijos y la abre con opentype.js. */
async function instancia(archivo, texto, ejes) {
  const sfnt = await subsetFont(await readFile(archivo), texto, { targetFormat: 'sfnt', variationAxes: ejes });
  return opentype.parse(sfnt.buffer.slice(sfnt.byteOffset, sfnt.byteOffset + sfnt.byteLength));
}

/** Dibuja un texto glifo por glifo con interletrado en unidades de em/100. */
function texto(fuente, cadena, x, base, tam, interletra = 0) {
  const glifos = fuente.stringToGlyphs(cadena);
  const k = tam / fuente.unitsPerEm;
  const partes = [];
  const caja = { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity };
  glifos.forEach((g, i) => {
    const p = g.getPath(x, base, tam);
    partes.push(p.toPathData(2));
    const b = p.getBoundingBox();
    if (Number.isFinite(b.x1)) {
      caja.x1 = Math.min(caja.x1, b.x1); caja.y1 = Math.min(caja.y1, b.y1);
      caja.x2 = Math.max(caja.x2, b.x2); caja.y2 = Math.max(caja.y2, b.y2);
    }
    x += g.advanceWidth * k + (tam * interletra) / 100;
    if (glifos[i + 1]) x += fuente.getKerningValue(g, glifos[i + 1]) * k;
  });
  return { d: partes.join(''), x, caja };
}

/* ---------- Logo ---------- */
// El wordmark sale de viogua-logo.png (src/assets/marca/logo-azul.png, PNG con transparencia).
// Se parte en letras por las columnas vacías entre ellas y cada una se vectoriza con potrace,
// para que el logo sea nítido a cualquier tamaño y cada letra pueda animarse por separado.
const ESCALA_LOGO = 0.2; // px del PNG → unidades del SVG (alto final ≈ 70)

const trazar = (buf, opciones) => new Promise((ok, no) => {
  const t = new potrace.Potrace(opciones);
  t.loadImage(buf, e => (e ? no(e) : ok(t)));
});

async function letrasDelPng() {
  const { data, info } = await sharp(ruta('src/assets/marca/logo-azul.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const ocupada = new Array(W).fill(false);
  for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) if (data[(y * W + x) * 4 + 3] > 127) { ocupada[x] = true; break; }
  const tramos = [];
  for (let x = 0; x < W; x++) {
    if (ocupada[x] && (x === 0 || !ocupada[x - 1])) tramos.push([x, x]);
    if (ocupada[x]) tramos[tramos.length - 1][1] = x;
  }
  const k = ESCALA_LOGO;
  const piezas = [];
  for (const [x1, x2] of tramos) {
    const ancho = x2 - x1 + 1;
    // Máscara en blanco y negro: la letra en negro sobre blanco.
    const mascara = Buffer.alloc(ancho * H * 3, 255);
    for (let y = 0; y < H; y++) for (let x = 0; x < ancho; x++) {
      if (data[(y * W + x1 + x) * 4 + 3] > 127) { const i = (y * ancho + x) * 3; mascara[i] = mascara[i + 1] = mascara[i + 2] = 0; }
    }
    const png = await sharp(mascara, { raw: { width: ancho, height: H, channels: 3 } }).png().toBuffer();
    const t = await trazar(png, { turdSize: 4, optTolerance: 0.4, alphaMax: 1 });
    const d = /\sd="([^"]+)"/.exec(t.getPathTag('currentColor'))[1];
    // Pasa las coordenadas del recorte a las del SVG (x desplazada, ambas escaladas).
    const dd = d.replace(/(-?[\d.]+)[ ,](-?[\d.]+)/g, (_, a, b) => `${f1((Number(a) + x1) * k)} ${f1(Number(b) * k)}`);
    piezas.push({ d: dd });
  }
  return { piezas, vb: [0, 0, f1(W * k), f1(H * k)] };
}

// Misma geometría que la «O» de concepto-v3 (em = 100): aro de 74 de diámetro y 12,5 de
// grosor, centrado 35 por encima de la línea de base, con 1 de margen izquierdo y 3,5 a la
// derecha. Adentro, una puerta en arco de 26 de ancho apoyada sobre el borde interior del aro.
async function logo() {
  const B = 100; // línea de base
  const { piezas, vb } = await letrasDelPng();
  // El isotipo (aro + puerta) sigue siendo la insignia de íconos, favicon y sello.
  const aro = { cx: 37, cy: B - 35, r: 37, ri: 24.5 };

  const anillo = (cx, cy, r, ri) =>
    `M${f1(cx - r)} ${f1(cy)}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z` +
    `M${f1(cx - ri)} ${f1(cy)}a${ri} ${ri} 0 1 1 ${ri * 2} 0a${ri} ${ri} 0 1 1 ${-ri * 2} 0Z`;
  const puerta = (cx, cy, ri, ancho = 26, tope = -5) => {
    const m = ancho / 2;
    const pie = Math.sqrt(ri * ri - m * m);
    return `M${f1(cx - m)} ${f1(cy + pie)}V${f1(cy + tope + m)}a${m} ${m} 0 0 1 ${ancho} 0V${f1(cy + pie)}A${ri} ${ri} 0 0 1 ${f1(cx - m)} ${f1(cy + pie)}Z`;
  };

  const letras = piezas.map(l => l.d).join('');
  const dAro = anillo(aro.cx, aro.cy, aro.r, aro.ri);
  const dPuerta = puerta(aro.cx, aro.cy, aro.ri);

  const svg = (color = 'currentColor') =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(' ')}" role="img" aria-label="VioGua">` +
    piezas.map((l, i) => `<path class="logo-letra" style="--i:${i}" fill="${color}" fill-rule="evenodd" d="${l.d}"/>`).join('') +
    `</svg>
`;

  await escribir(ruta('src/brand/logo.svg'), svg());

  // Isotipo: la O de arco sola.
  const pad = 3;
  const iso = (aroColor, extra = '') =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f1(aro.cx - aro.r - pad)} ${f1(aro.cy - aro.r - pad)} ${aro.r * 2 + pad * 2} ${aro.r * 2 + pad * 2}" role="img" aria-label="VioGua">${extra}` +
    `<path class="aro" fill="${aroColor}" fill-rule="evenodd" d="${dAro}"/><path fill="${ROSA}" d="${dPuerta}"/></svg>\n`;
  await escribir(ruta('src/brand/isotipo.svg'), iso('currentColor'));
  await escribir(
    ruta('public/favicon.svg'),
    iso(AZUL, '<style>@media (prefers-color-scheme: dark){.aro{fill:#fff}}</style>')
  );

  // Íconos cuadrados: aro blanco sobre azul (sirven también como «maskable»).
  const icono = (tam, escala) => {
    const r = (tam * escala) / 2;
    const k = r / aro.r;
    const cx = tam / 2, cy = tam / 2;
    const d1 = anillo(cx, cy, r, aro.ri * k);
    const d2 = puerta(cx, cy, aro.ri * k, 26 * k, -5 * k);
    return Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${tam}" height="${tam}"><rect width="100%" height="100%" fill="${AZUL}"/>` +
        `<path fill="${BLANCO}" fill-rule="evenodd" d="${d1}"/><path fill="${ROSA}" d="${d2}"/></svg>`
    );
  };
  await escribir(ruta('public/apple-touch-icon.png'), await sharp(icono(180, 0.62)).png().toBuffer());
  await escribir(ruta('public/icono-192.png'), await sharp(icono(192, 0.56)).png().toBuffer());
  await escribir(ruta('public/icono-512.png'), await sharp(icono(512, 0.56)).png().toBuffer());

  // Monograma: «VG» blanco dentro de una puerta en arco azul.
  const vg = await instancia(fs('fraunces-latin-full-normal.woff2'), 'VG', { opsz: 144, wght: 800, SOFT: 100, WONK: 1 });
  const ancho = vg.stringToGlyphs('VG').reduce((s, g) => s + g.advanceWidth, 0) * (54 / vg.unitsPerEm) - 1.6;
  const mono = texto(vg, 'VG', 50 - ancho / 2, 92, 54, -3);
  await escribir(
    ruta('src/brand/monograma.svg'),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 124" role="img" aria-label="VioGua">` +
      `<path fill="${AZUL}" d="M0 124V50a50 50 0 0 1 100 0v74Z"/><path fill="${BLANCO}" d="${mono.d}"/>` +
      `<path fill="${ROSA}" d="M44 124v-8a6 6 0 0 1 12 0v8Z"/></svg>\n`
  );

  // Trazos para el canvas (Path2D) y para dimensionar el logo en CSS.
  await escribir(
    ruta('src/brand/trazos.ts'),
    `// Generado por scripts/marca.mjs. No editar a mano.\n` +
      `export const LOGO = {\n` +
      `  viewBox: [${vb.join(', ')}] as const,\n` +
      `  /** Alto del logo en em del tamaño de letra con el que se dibujó (100). */\n` +
      `  alto: ${f1(vb[3] / 100)},\n` +
      `  /** Distancia de la línea de base al borde superior, en las mismas unidades. */\n` +
      `  base: ${f1(vb[3])},\n` +
      `  letras: '${letras}',\n` +
      `  aro: '${dAro}',\n` +
      `  puerta: '${dPuerta}',\n` +
      `};\n`
  );
  return { letras, dAro, dPuerta, vb, B };
}

/* ---------- Fuentes web ---------- */
// Fraunces pesa 120 KB (normal) y 150 KB (itálica) con todos los ejes. Usamos siempre
// SOFT 100, así que se fija ese eje y se recorta el peso a 300–900. Quedan opsz y WONK.
function caracteres() {
  let s = '';
  for (let c = 0x20; c <= 0x7e; c++) s += String.fromCodePoint(c);
  for (let c = 0xa0; c <= 0xff; c++) s += String.fromCodePoint(c);
  return s + '‘’‚“”„«»‹›–—…•·€™−×→←';
}
async function fuentes() {
  const ejes = { SOFT: 100, wght: { min: 300, max: 900 } };
  for (const [origen, destino] of [
    ['fraunces-latin-full-normal.woff2', 'fraunces.woff2'],
    ['fraunces-latin-full-italic.woff2', 'fraunces-italica.woff2'],
  ]) {
    const buf = await subsetFont(await readFile(fs(origen)), caracteres(), { targetFormat: 'woff2', variationAxes: ejes });
    await escribir(ruta('src/assets/fuentes', destino), buf);
    console.log(`    ${Math.round(buf.length / 1024)} KB`);
  }
}

/* ---------- Imagen para redes (1200 × 630) ---------- */
async function og(marca) {
  const W = 1200, H = 630;
  const recta = await instancia(fs('fraunces-latin-full-normal.woff2'), 'Diseñamos espacios que', { opsz: 144, wght: 480, SOFT: 100, WONK: 0 });
  const curva = await instancia(fs('fraunces-latin-full-italic.woff2'), 'te representan', { opsz: 144, wght: 460, SOFT: 100, WONK: 1 });
  const mono = await instancia(ruta('node_modules/@fontsource/dm-mono/files/dm-mono-latin-500-normal.woff2'), 'ESTUDIO DE DISEÑO INTERIORES·VIOGUA@', {});

  const X = 84;
  const l1 = texto(recta, 'Diseñamos', X, 300, 92, -3.5);
  const l2 = texto(recta, 'espacios que', X, 392, 92, -3.5);
  const l3 = texto(curva, 'te representan', X, 484, 92, -3.5);
  const etiqueta = texto(mono, 'ESTUDIO DE DISEÑO DE INTERIORES', X, 196, 19, 10);
  const firma = texto(mono, '@VIOGUA', X, 572, 19, 10);

  // Wordmark blanco arriba a la izquierda (alto 64 px).
  const k = 64 / marca.vb[3];
  const tx = X - marca.vb[0] * k, ty = 72 - marca.vb[1] * k;

  // Foto en arco a la derecha.
  const ax = 790, ay = 92, aw = 320, ah = 420;
  const foto = await sharp(ruta('src/assets/estilos/14.jpeg')).resize(aw, ah, { fit: 'cover', position: 'centre' })
    .composite([{ input: Buffer.from(`<svg width="${aw}" height="${ah}"><path d="M0 ${ah}V${aw / 2}a${aw / 2} ${aw / 2} 0 0 1 ${aw} 0V${ah}Z" fill="#fff"/></svg>`), blend: 'dest-in' }])
    .png().toBuffer();

  // Franja de azulejos con los tres colores de la marca, sin transparencias.
  const azulejos = Array.from({ length: 22 }, (_, i) => {
    const x = i * 56, y = H - 40;
    const t = i % 4;
    if (t === 0) return `<rect x="${x}" y="${y}" width="52" height="52" fill="${ROSA}"/><path d="M${x + 16} ${y + 52}V${y + 26}a10 10 0 0 1 20 0V${y + 52}Z" fill="${AZUL}"/>`;
    if (t === 1) return `<rect x="${x}" y="${y}" width="52" height="52" fill="${BLANCO}"/><path d="M${x} ${y + 52}V${y + 20}a32 32 0 0 1 32 32Z" fill="${ROSA}"/>`;
    if (t === 2) return `<rect x="${x}" y="${y}" width="52" height="52" fill="${BLANCO}"/><path d="M${x} ${y}h26v26h-26zM${x + 26} ${y + 26}h26v26h-26z" fill="${AZUL}"/>`;
    return `<rect x="${x}" y="${y}" width="52" height="52" fill="${ROSA}"/><circle cx="${x + 26}" cy="${y + 26}" r="9" fill="${BLANCO}"/>`;
  }).join('');

  const base = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">` +
      `<rect width="100%" height="100%" fill="${AZUL}"/>` +
      `<g transform="translate(${f1(tx)} ${f1(ty)}) scale(${f1(k * 1000) / 1000})"><path fill="${BLANCO}" fill-rule="evenodd" d="${marca.letras}"/></g>` +
      `<path fill="${BLANCO}" fill-opacity=".8" d="${etiqueta.d}"/>` +
      `<path fill="${BLANCO}" d="${l1.d}${l2.d}"/><path fill="${ROSA}" d="${l3.d}"/>` +
      `<path fill="${BLANCO}" fill-opacity=".8" d="${firma.d}"/>` +
      `<g stroke="${BLANCO}" stroke-width="1.5" fill="none"><path d="M${ax + aw + 34} ${ay}V${ay + ah}M${ax + aw + 28} ${ay + 6}l12 -12M${ax + aw + 28} ${ay + ah + 6}l12 -12"/><path d="M${ax} ${ay + ah + 30}H${ax + aw}M${ax - 6} ${ay + ah + 36}l12 -12M${ax + aw - 6} ${ay + ah + 36}l12 -12"/></g>` +
      azulejos +
      `</svg>`
  );
  const jpg = await sharp(base).composite([{ input: foto, left: ax, top: ay }]).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
  await escribir(ruta('public/og.jpg'), jpg);
}

console.log('Marca:');
const marca = await logo();
console.log('Fuentes:');
await fuentes();
console.log('Imagen para redes:');
await og(marca);
