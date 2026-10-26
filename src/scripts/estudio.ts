// Panel del estudio (/estudio/). Con la clave de VioGua: los turnos del último mes en adelante, para
// agendarlos en Google Calendar, confirmarlos con el link de Meet, avisar por WhatsApp o cancelarlos.
// Sin la clave y con ?t=<token>: la ficha de ese pedido (el link que llega en el WhatsApp del pedido).
import { AGENDA, CON_BACKEND, ESTUDIO, precio } from '../data/estudio';
import { TIPOS, TITULOS, buscar, esColor, type Picks } from '../data/test';
import { desdeIso, fechaTitulo, mensajeCancelacion, mensajeConfirmacion, telefonoLegible } from './mensajes';
import { ErrorApi, cambiarTurno, miTurno, turnosEstudio, type EstadoTurno, type FotoAmbiente, type TurnoEstudio } from './test/api';
import { $, $$, avisar, guardado } from './ui';

const { sitio } = JSON.parse($('#datos-estudio').textContent || '{}') as { sitio: string };
const CLAVE = 'viogua-estudio';

/** Lo que muestra una tarjeta. La ficha (sin clave) no trae contacto ni acciones. */
interface Tarjeta {
  token: string;
  estado: EstadoTurno;
  nombre: string;
  cantidad: number;
  ambientes: string[];
  inicio: string;
  meetUrl: string | null;
  fotos: FotoAmbiente[];
  test: { picks: Picks; moodboard: string | null } | null;
}

type Filtro = 'pendientes' | 'confirmados' | 'anteriores' | 'cancelados';
const VACIO: Record<Filtro, string> = {
  pendientes: 'No hay pedidos por confirmar.',
  confirmados: 'No hay turnos confirmados para los próximos días.',
  anteriores: 'No hubo turnos en el último mes.',
  cancelados: 'No hay turnos cancelados.',
};
const ESTADOS: Record<EstadoTurno, string> = { pendiente: 'Por confirmar', confirmada: 'Confirmado', cancelada: 'Cancelado' };

const inicioDe = (t: Tarjeta) => new Date(`${t.inicio}:00-03:00`).getTime();
const finDe = (t: Tarjeta) => inicioDe(t) + AGENDA.duracionMin * 60_000;
const paso = (t: Tarjeta) => finDe(t) < Date.now();
function filtroDe(t: Tarjeta): Filtro {
  if (t.estado === 'cancelada') return 'cancelados';
  if (paso(t)) return 'anteriores';
  return t.estado === 'pendiente' ? 'pendientes' : 'confirmados';
}

const fichaUrl = (token: string) => `${sitio}estudio/?t=${encodeURIComponent(token)}`;
const fmtPedido = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: ESTUDIO.zonaHoraria });

let clave = guardado.leer(CLAVE);
let turnos: TurnoEstudio[] = [];
let filtro: Filtro = 'pendientes';
let buscado = new URLSearchParams(location.search).get('t');
let cargado = 0;

const entrar = $<HTMLFormElement>('#estudio-entrar');
const barra = $('#estudio-barra');
const contenedor = $('#tarjetas');
const estadoTexto = (texto: string) => { $('#estudio-estado').textContent = texto; };

/* ---------- Tarjeta ---------- */
function dato(el: HTMLElement, cual: string, valor: { href: string; texto: string } | null) {
  const li = $(`[data-dato="${cual}"]`, el);
  if (!valor) return li.remove();
  const a = $<HTMLAnchorElement>('a', li);
  a.href = valor.href;
  a.textContent = valor.texto;
}

const nota = (texto: string) => {
  const p = document.createElement('p');
  p.className = 'nota';
  p.textContent = texto;
  return p;
};

function pintarFotos(el: HTMLElement, fotos: FotoAmbiente[]) {
  const caja = $('.tarjeta-fotos', el);
  if (!fotos.length) return caja.replaceWith(nota('No sumó fotos.'));
  for (const f of fotos) {
    const a = document.createElement('a');
    a.href = f.url;
    a.target = '_blank';
    a.rel = 'noopener';
    const img = document.createElement('img');
    img.src = f.url;
    img.alt = `Foto de ${f.ambiente}`;
    img.loading = 'lazy';
    const rotulo = document.createElement('span');
    rotulo.textContent = f.ambiente;
    a.append(img, rotulo);
    caja.appendChild(a);
  }
}

function pintarTest(el: HTMLElement, test: Tarjeta['test']) {
  const caja = $('.tarjeta-test', el);
  if (!test) return caja.replaceWith(nota('Todavía no hizo el test.'));
  const moodboard = $<HTMLAnchorElement>('.tarjeta-moodboard', caja);
  if (test.moodboard) {
    moodboard.href = test.moodboard;
    $<HTMLImageElement>('img', moodboard).src = test.moodboard;
  } else moodboard.remove();
  const dl = $('.tarjeta-picks', caja);
  for (const tipo of TIPOS) {
    const items = (test.picks[tipo] ?? []).flatMap(id => buscar(tipo, id) ?? []);
    if (!items.length) continue;
    const dt = document.createElement('dt');
    dt.textContent = TITULOS[tipo];
    const dd = document.createElement('dd');
    for (const item of items) {
      const s = document.createElement('span');
      if (esColor(item)) {
        const punto = document.createElement('i');
        punto.className = 'punto';
        punto.style.setProperty('--c', item.hex);
        s.appendChild(punto);
      }
      s.append(item.nombre);
      dd.appendChild(s);
    }
    dl.append(dt, dd);
  }
}

function tarjeta(t: Tarjeta, turno?: TurnoEstudio): HTMLElement {
  const el = $<HTMLTemplateElement>('#plantilla-tarjeta').content.firstElementChild!.cloneNode(true) as HTMLElement;
  const [fecha, hora] = t.inicio.split('T');
  el.dataset.estado = t.estado;
  el.dataset.token = t.token;
  $('.tarjeta-dia', el).textContent = fechaTitulo(desdeIso(fecha));
  $('.tarjeta-hora', el).textContent = `${hora} hs`;
  const estado = $('.estado', el);
  estado.textContent = paso(t) && t.estado === 'pendiente' ? 'Sin confirmar' : ESTADOS[t.estado];
  estado.dataset.estado = t.estado;
  $('.tarjeta-nombre', el).textContent = t.nombre;

  dato(el, 'whatsapp', turno ? { href: `https://wa.me/${turno.whatsapp}`, texto: telefonoLegible(turno.whatsapp) } : null);
  dato(el, 'email', turno ? { href: `mailto:${turno.email}`, texto: turno.email } : null);
  dato(el, 'meet', t.meetUrl ? { href: t.meetUrl, texto: t.meetUrl.replace(/^https:\/\//, '') } : null);
  if (!$('.tarjeta-datos li', el)) $('.tarjeta-datos', el).remove();

  const ambientes = $('.tarjeta-ambientes', el);
  t.ambientes.forEach(a => {
    const li = document.createElement('li');
    li.textContent = a;
    ambientes.appendChild(li);
  });
  $('.tarjeta-total', el).textContent =
    `${precio(t.cantidad)} · ${t.cantidad === 4 ? 'promo 4 + 1' : `${t.cantidad} ${t.cantidad === 1 ? 'ambiente' : 'ambientes'}`}`;

  pintarFotos(el, t.fotos);
  pintarTest(el, t.test);
  if (turno) prepararAcciones(el, turno);
  else $('[data-bloque="acciones"]', el).remove();
  $('.tarjeta-pie', el).textContent = turno ? `Pedido el ${fmtPedido.format(new Date(turno.creada))}` : '';
  return el;
}

/* ---------- Acciones del estudio ---------- */
function enCalendario(t: TurnoEstudio) {
  const utc = (ms: number) => new Date(ms).toISOString().replace(/[-:]|\.\d{3}/g, '');
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${ESTUDIO.nombre} · ${t.nombre}`,
    dates: `${utc(inicioDe(t))}/${utc(finDe(t))}`,
    ctz: ESTUDIO.zonaHoraria,
    add: t.email,
    details: [
      `Cliente: ${t.nombre}`,
      `WhatsApp: https://wa.me/${t.whatsapp}`,
      `Email: ${t.email}`,
      `Ambientes (${t.cantidad === 4 ? '4 + 1 de regalo' : t.cantidad}): ${t.ambientes.join(', ')}`,
      `Ficha del pedido: ${fichaUrl(t.token)}`,
    ].join('\n'),
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}

/** WhatsApp al cliente con la confirmación (link de Meet y del test) o el aviso de cancelación. */
function alCliente(t: TurnoEstudio) {
  const [fecha, hora] = t.inicio.split('T');
  const texto =
    t.estado === 'cancelada'
      ? mensajeCancelacion({ nombre: t.nombre, fecha: desdeIso(fecha), hora, agendarUrl: `${sitio}test/` })
      : mensajeConfirmacion({
          nombre: t.nombre, fecha: desdeIso(fecha), hora, ambientes: t.ambientes, meetUrl: t.meetUrl,
          testUrl: t.test ? null : `${sitio}test/?t=${encodeURIComponent(t.token)}`,
        });
  return `https://wa.me/${t.whatsapp}?text=${encodeURIComponent(texto)}`;
}

/** El link tal como lo pegan: sin https:// también vale. null si no se entiende. */
function linkMeet(valor: string): string | null {
  const v = valor.trim();
  if (!v) return '';
  const url = /^https?:\/\//i.test(v) ? v.replace(/^http:/i, 'https:') : `https://${v}`;
  return /^https:\/\/[^\s/]+\.[^\s]+$/.test(url) && url.length <= 300 ? url : null;
}

function prepararAcciones(el: HTMLElement, t: TurnoEstudio) {
  const bloque = $('[data-bloque="acciones"]', el);
  const boton = (accion: string) => $<HTMLElement>(`[data-accion="${accion}"]`, bloque);
  const vigente = t.estado !== 'cancelada' && !paso(t);
  const mostrar: Record<string, boolean> = {
    calendario: vigente,
    confirmar: vigente && t.estado === 'pendiente',
    guardar: false, // aparece al cambiar el link de un turno confirmado
    avisar: (vigente && t.estado === 'confirmada') || (t.estado === 'cancelada' && !paso(t)),
    cancelar: vigente,
    reactivar: t.estado === 'cancelada' && !paso(t),
  };
  for (const [accion, si] of Object.entries(mostrar)) boton(accion).hidden = !si;
  if (!Object.values(mostrar).some(Boolean)) return bloque.remove();

  const meet = $<HTMLInputElement>('.tarjeta-meet input', bloque);
  $('.tarjeta-meet', bloque).hidden = !vigente;
  meet.id = `meet-${t.id}`;
  $<HTMLLabelElement>('.tarjeta-meet label', bloque).htmlFor = meet.id;
  meet.value = t.meetUrl ?? '';
  boton('calendario').setAttribute('href', enCalendario(t));
  boton('avisar').setAttribute('href', alCliente(t));
  $('span', boton('avisar')).textContent = t.estado === 'cancelada' ? 'Avisar que se cancela' : 'Avisar por WhatsApp';
  const error = $('.error', bloque);

  meet.addEventListener('input', () => {
    meet.removeAttribute('aria-invalid');
    if (t.estado === 'confirmada') boton('guardar').hidden = (linkMeet(meet.value) ?? meet.value) === (t.meetUrl ?? '');
  });
  const leerMeet = () => {
    const url = linkMeet(meet.value);
    if (url === null) {
      meet.setAttribute('aria-invalid', 'true');
      error.textContent = 'Revisá el link de la videollamada (ej.: https://meet.google.com/abc-defg-hij).';
      meet.focus();
    }
    return url;
  };

  boton('confirmar').addEventListener('click', e => {
    const url = leerMeet();
    if (url !== null) cambiar(el, t, { estado: 'confirmada', meetUrl: url }, e.currentTarget as HTMLElement, 'Turno confirmado. Ahora avisale por WhatsApp.');
  });
  boton('guardar').addEventListener('click', e => {
    const url = leerMeet();
    if (url !== null) cambiar(el, t, { meetUrl: url }, e.currentTarget as HTMLElement, 'Link guardado. Mandale el aviso actualizado.');
  });
  boton('cancelar').addEventListener('click', e => {
    if (!confirm(`¿Cancelar el turno de ${t.nombre}? El horario vuelve a quedar libre en el sitio.`)) return;
    cambiar(el, t, { estado: 'cancelada' }, e.currentTarget as HTMLElement, 'Turno cancelado: el horario quedó libre.');
  });
  boton('reactivar').addEventListener('click', e =>
    cambiar(el, t, { estado: 'pendiente' }, e.currentTarget as HTMLElement, 'El turno volvió a «por confirmar».')
  );
}

/** Guarda el cambio y repinta la tarjeta en su lugar (no salta de lista hasta cambiar de filtro). */
async function cambiar(el: HTMLElement, t: TurnoEstudio, cambios: { estado?: EstadoTurno; meetUrl?: string }, boton: HTMLElement, aviso: string) {
  const error = $('.error', el);
  error.textContent = '';
  boton.setAttribute('data-ocupado', '');
  try {
    const { turno } = await cambiarTurno(clave!, t.id, cambios);
    turnos = turnos.map(x => (x.id === turno.id ? turno : x));
    const nueva = tarjeta(turno, turno);
    el.replaceWith(nueva);
    pintarCuentas();
    avisar(aviso);
    $<HTMLElement>('[data-accion="avisar"]:not([hidden])', nueva)?.focus();
  } catch (e) {
    if (e instanceof ErrorApi && e.estado === 401) return salir('La clave dejó de ser válida. Entrá de nuevo.');
    error.textContent = e instanceof ErrorApi ? e.message : 'No se pudo guardar. Probá de nuevo.';
  } finally {
    boton.removeAttribute('data-ocupado');
  }
}

/* ---------- Lista ---------- */
function pintarCuentas() {
  $$<HTMLButtonElement>('.filtro').forEach(b => {
    const n = turnos.filter(t => filtroDe(t) === b.dataset.filtro).length;
    $('span', b).textContent = n ? String(n) : '';
  });
}

function pintar() {
  $$<HTMLButtonElement>('.filtro').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filtro === filtro)));
  pintarCuentas();
  const recientes = filtro === 'anteriores' || filtro === 'cancelados';
  const lista = turnos.filter(t => filtroDe(t) === filtro).sort((a, b) => (inicioDe(a) - inicioDe(b)) * (recientes ? -1 : 1));
  contenedor.textContent = '';
  lista.forEach(t => contenedor.appendChild(tarjeta(t, t)));
  estadoTexto(lista.length ? '' : VACIO[filtro]);
}

$$<HTMLButtonElement>('.filtro').forEach(b =>
  b.addEventListener('click', () => {
    filtro = b.dataset.filtro as Filtro;
    pintar();
  })
);

async function cargar({ silencioso = false } = {}) {
  if (!silencioso) estadoTexto('Cargando turnos…');
  try {
    const r = await turnosEstudio(clave!);
    turnos = r.turnos;
    cargado = Date.now();
    entrar.hidden = true;
    $('#estudio-soy').hidden = true;
    barra.hidden = false;
    $('#estudio-bajada').textContent = `Hola, ${r.quien.charAt(0).toUpperCase()}${r.quien.slice(1)}. Pedidos del último mes en adelante.`;

    const elegido = buscado ? turnos.find(t => t.token === buscado) : undefined;
    if (!silencioso) {
      const cuenta = (f: Filtro) => turnos.filter(t => filtroDe(t) === f).length;
      filtro = elegido ? filtroDe(elegido) : (cuenta('pendientes') || !cuenta('confirmados')) ? 'pendientes' : 'confirmados';
    }
    pintar();
    if (buscado) {
      const el = contenedor.querySelector<HTMLElement>(`[data-token="${CSS.escape(buscado)}"]`);
      if (el) {
        el.setAttribute('data-resaltado', '');
        el.scrollIntoView({ block: 'center' });
      } else avisar('Ese pedido no está entre los turnos del último mes.');
      buscado = null;
      history.replaceState(null, '', location.pathname);
    }
  } catch (e) {
    if (e instanceof ErrorApi && e.estado === 401) return salir('La clave no es válida.');
    estadoTexto(e instanceof ErrorApi ? e.message : 'No pudimos cargar los turnos.');
  }
}

function pedirClave(error = '') {
  barra.hidden = true;
  $('#estudio-soy').hidden = true;
  entrar.hidden = false;
  $('#error-entrar').textContent = error;
  $('#estudio-bajada').textContent = 'Para ver y confirmar los turnos pedidos desde el sitio.';
  $('#estudio-clave').focus();
}

function salir(error = '') {
  guardado.borrar(CLAVE);
  clave = null;
  turnos = [];
  contenedor.textContent = '';
  estadoTexto('');
  pedirClave(error);
}

entrar.addEventListener('submit', e => {
  e.preventDefault();
  const valor = $<HTMLInputElement>('#estudio-clave').value.trim();
  if (valor.length < 20) {
    $('#error-entrar').textContent = 'Revisá la clave.';
    return;
  }
  clave = valor;
  guardado.escribir(CLAVE, valor);
  $<HTMLInputElement>('#estudio-clave').value = '';
  $('#estudio-etiqueta').textContent = 'Panel del estudio';
  $('#estudio-titulo').textContent = 'Turnos';
  cargar();
});
$('#estudio-actualizar').addEventListener('click', () => cargar());
$('#estudio-salir').addEventListener('click', () => salir());
$('#estudio-soy').addEventListener('click', () => {
  contenedor.textContent = '';
  pedirClave();
});
// Al volver a la pestaña, se actualiza sola (si pasó más de un minuto).
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && clave && !barra.hidden && Date.now() - cargado > 60_000) cargar({ silencioso: true });
});

/* ---------- Ficha de un pedido (sin clave) ---------- */
async function ficha(token: string) {
  $('#estudio-etiqueta').textContent = 'Ficha del pedido';
  estadoTexto('Cargando el pedido…');
  try {
    const t = await miTurno(token);
    $('#estudio-titulo').textContent = `Pedido de ${t.nombre}`;
    $('#estudio-bajada').textContent =
      t.estado === 'confirmada' ? 'Turno confirmado.' : `Turno pedido por WhatsApp: ${ESTUDIO.nombre} lo confirma por ese medio.`;
    contenedor.appendChild(tarjeta({ ...t, token, test: t.picks ? { picks: t.picks, moodboard: t.moodboard } : null }));
    estadoTexto('');
  } catch {
    $('#estudio-titulo').textContent = 'Pedido';
    estadoTexto('No encontramos ese pedido. Puede que se haya cancelado.');
  }
  $('#estudio-soy').hidden = false;
}

/* ---------- Entrada ---------- */
if (CON_BACKEND) {
  // La clave puede llegar una sola vez en el link (#clave=...): se guarda y se saca de la barra.
  const enLink = new URLSearchParams(location.hash.slice(1)).get('clave');
  if (enLink) {
    clave = enLink;
    guardado.escribir(CLAVE, enLink);
    history.replaceState(null, '', location.pathname + location.search);
  }
  if (clave) cargar();
  else if (buscado) ficha(buscado);
  else pedirClave();
}
