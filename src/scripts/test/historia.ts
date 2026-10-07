// Imagen del moodboard en formato historia de Instagram (1080 × 1920), dibujada en canvas
// con las mismas piezas que el collage en pantalla.
import { LOGO } from '../../brand/trazos';
import { esColor, esFoto, esSensacion, piezasDe, type Picks } from '../../data/test';

const C = { azul: '#0066ff', rosa: '#fcbcd4', blanco: '#FFFFFF', noche: '#002966' };
const SERIF = 'Fraunces, Georgia, serif';
const MONO = '"DM Mono", Consolas, monospace';

const cargarImagen = (src: string) =>
  new Promise<HTMLImageElement>((ok, mal) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = mal;
    img.src = src;
  });

function envolver(ctx: CanvasRenderingContext2D, texto: string, ancho: number) {
  const lineas: string[] = [];
  let linea = '';
  for (const palabra of texto.split(' ')) {
    const prueba = linea ? `${linea} ${palabra}` : palabra;
    if (ctx.measureText(prueba).width > ancho && linea) {
      lineas.push(linea);
      linea = palabra;
    } else linea = prueba;
  }
  if (linea) lineas.push(linea);
  return lineas;
}
function recortar(ctx: CanvasRenderingContext2D, texto: string, ancho: number) {
  if (ctx.measureText(texto).width <= ancho) return texto;
  while (texto.length > 1 && ctx.measureText(`${texto}…`).width > ancho) texto = texto.slice(0, -1);
  return `${texto}…`;
}

/** Wordmark con los mismos trazos que el SVG, en `color`. Devuelve el ancho. */
function logo(ctx: CanvasRenderingContext2D, x: number, y: number, alto: number, color: string) {
  const [vx, vy, vw, vh] = LOGO.viewBox;
  const k = alto / vh;
  ctx.save();
  ctx.translate(x - vx * k, y - vy * k);
  ctx.scale(k, k);
  ctx.fillStyle = color;
  ctx.fill(new Path2D(LOGO.letras), 'evenodd');
  ctx.restore();
  return vw * k;
}

export async function historia(picks: Picks, fotos: { estilos: Record<string, string>; materiales: Record<string, string> }) {
  const fuentes = ['500 92px Fraunces', 'italic 400 92px Fraunces', 'italic 400 34px Fraunces', '500 22px "DM Mono"'];
  await Promise.all(fuentes.map(f => document.fonts.load(f).catch(() => null)));
  const W = 1080, H = 1920, X = 76, ANCHO = W - 2 * X;
  const lienzo = document.createElement('canvas');
  lienzo.width = W;
  lienzo.height = H;
  const ctx = lienzo.getContext('2d')!;

  ctx.fillStyle = C.azul;
  ctx.fillRect(0, 0, W, H);

  logo(ctx, X, 104, 54, C.blanco);
  ctx.font = `500 22px ${MONO}`;
  ctx.fillStyle = C.blanco;
  ctx.textAlign = 'right';
  ctx.fillText('TEST DE ESTILO', W - X, 146);
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fillRect(X, 186, ANCHO, 2);

  ctx.fillStyle = C.blanco;
  ctx.font = `500 92px ${SERIF}`;
  ctx.fillText('Tu estilo', X, 300);
  ctx.font = `italic 400 92px ${SERIF}`;
  ctx.fillStyle = C.rosa;
  ctx.fillText('se basa en…', X, 400);

  // Collage: mismas piezas que en pantalla (tablero de 100 × 136 unidades).
  const k = ANCHO / 100, Y0 = 440;
  const piezas = piezasDe(picks);
  const imagenes = await Promise.all(
    piezas.map(p => (esFoto(p.tipo) ? cargarImagen(fotos[p.tipo as 'estilos' | 'materiales'][p.item.id]) : null))
  );

  const forma = (x: number, y: number, w: number, h: number, tipo: string) => {
    ctx.beginPath();
    if (tipo === 'circulo') ctx.arc(x + w / 2, y + h / 2, w / 2, 0, Math.PI * 2);
    else if (tipo === 'arco') ctx.roundRect(x, y, w, h, [w / 2, w / 2, 1.2 * k, 1.2 * k]);
    else ctx.roundRect(x, y, w, h, 1.2 * k);
  };

  piezas.forEach((p, idx) => {
    const { item } = p;
    const x = X + p.x * k, y = Y0 + p.y * k, w = p.w * k, h = p.h * k;
    if (p.forma === 'circulo') { // aro blanco alrededor de los círculos
      ctx.fillStyle = C.blanco;
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2, w / 2 + (p.tipo === 'colores' ? 0.6 : 0.9) * k, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.save();
    forma(x, y, w, h, p.forma);
    ctx.clip();
    const img = imagenes[idx];
    if (img) {
      const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
      const iw = img.naturalWidth * s, ih = img.naturalHeight * s;
      ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
      ctx.restore();
      ctx.save();
      ctx.font = `500 ${Math.max(15, 1.8 * k)}px ${MONO}`;
      const t = recortar(ctx, item.nombre, w - 2.8 * k - 20);
      const cw = ctx.measureText(t).width + 22, ch = Math.max(30, 2.5 * k);
      const cxp = p.forma === 'circulo' ? x + (w - cw) / 2 : x + 1.4 * k;
      const cyp = p.forma === 'circulo' ? y + h * 0.84 - ch : y + h - 1.4 * k - ch;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.beginPath();
      ctx.roundRect(cxp, cyp, cw, ch, ch / 2);
      ctx.fill();
      ctx.fillStyle = C.azul;
      ctx.fillText(t, cxp + 11, cyp + ch / 2 + 6);
      ctx.restore();
      return;
    }
    if (esColor(item)) {
      ctx.fillStyle = item.hex;
      ctx.fillRect(x, y, w, h);
    } else if (esSensacion(item)) {
      const rosa = p.fondo === 'rosa';
      ctx.fillStyle = rosa ? C.rosa : C.blanco;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = rosa ? C.noche : C.azul;
      const tam = Math.min(3.3 * k, h * 0.2 + 8);
      ctx.font = `italic 400 ${tam}px ${SERIF}`;
      const lineas = envolver(ctx, item.frase, w - 4.8 * k);
      const maxL = Math.max(1, Math.floor((h - 7 * k) / (tam * 1.1)));
      lineas.slice(0, maxL).forEach((l, n) => ctx.fillText(l, x + 2.4 * k, y + 2.2 * k + tam * 0.95 + n * tam * 1.1));
      ctx.font = `500 ${Math.max(14, 1.6 * k)}px ${MONO}`;
      ctx.fillText(item.nombre.toUpperCase(), x + 2.4 * k, y + h - 2.2 * k);
    }
    ctx.restore();
  });

  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fillRect(X, 1752, ANCHO, 2);
  ctx.fillStyle = C.blanco;
  ctx.font = `italic 400 38px ${SERIF}`;
  ctx.fillText('Diseñamos espacios que te representan', X, 1828);
  ctx.font = `500 26px ${MONO}`;
  ctx.textAlign = 'right';
  ctx.fillText('@VIOGUA', W - X, 1826);
  ctx.textAlign = 'left';

  return new Promise<Blob>((ok, mal) => lienzo.toBlob(b => (b ? ok(b) : mal(new Error('sin imagen'))), 'image/png'));
}
