// Cabecera: menú del celular, estado al scrollear y cambio de tema.
import { guardado, reducido } from './ui';

const cabecera = document.querySelector<HTMLElement>('[data-cabecera]');
const nav = document.querySelector<HTMLElement>('[data-navegacion]');
const botonMenu = document.querySelector<HTMLButtonElement>('[data-menu]');
const botonTema = document.querySelector<HTMLButtonElement>('[data-tema]');

/* ---------- Menú ---------- */
const escritorio = matchMedia('(min-width: 60rem)');
const abierto = () => nav?.hasAttribute('data-abierta') ?? false;

function cerrarMenu(devolverFoco = false) {
  if (!nav || !botonMenu || !abierto()) return;
  nav.removeAttribute('data-abierta');
  botonMenu.setAttribute('aria-expanded', 'false');
  if (devolverFoco) botonMenu.focus();
}
function abrirMenu() {
  if (!nav || !botonMenu) return;
  nav.setAttribute('data-abierta', '');
  botonMenu.setAttribute('aria-expanded', 'true');
  cabecera?.removeAttribute('data-oculta');
  nav.querySelector('a')?.focus();
}
botonMenu?.addEventListener('click', () => (abierto() ? cerrarMenu() : abrirMenu()));
nav?.addEventListener('click', e => {
  if ((e.target as Element).closest('a')) cerrarMenu();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && abierto()) cerrarMenu(true);
  // Foco atrapado entre el botón de menú y los enlaces mientras el menú está abierto.
  if (e.key === 'Tab' && abierto() && nav && botonMenu) {
    const enfocables = [botonMenu, ...nav.querySelectorAll<HTMLElement>('a')];
    const i = enfocables.indexOf(document.activeElement as HTMLElement);
    if (i === -1) return;
    const destino = e.shiftKey ? (i === 0 ? enfocables.length - 1 : i - 1) : (i === enfocables.length - 1 ? 0 : i + 1);
    e.preventDefault();
    enfocables[destino].focus();
  }
});
document.addEventListener('click', e => {
  if (abierto() && !cabecera?.contains(e.target as Node)) cerrarMenu();
});
escritorio.addEventListener('change', () => cerrarMenu());

/* ---------- Enlace activo según la sección visible (solo en el inicio) ---------- */
const enlaces = [...(nav?.querySelectorAll<HTMLAnchorElement>('a[href^="#"]') ?? [])];
const secciones = enlaces
  .map(a => document.getElementById(a.hash.slice(1)))
  .filter((s): s is HTMLElement => Boolean(s));
if (secciones.length) {
  const visibles = new Map<string, boolean>();
  const io = new IntersectionObserver(
    entradas => {
      entradas.forEach(en => visibles.set(en.target.id, en.isIntersecting));
      const activa = secciones.find(s => visibles.get(s.id))?.id;
      enlaces.forEach(a => {
        if (a.hash === `#${activa}`) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    },
    { rootMargin: '-45% 0px -50% 0px' }
  );
  secciones.forEach(s => io.observe(s));
}

/* ---------- Scroll: compacta y, en el celular, se esconde al bajar ---------- */
let ultimoY = scrollY;
let pendiente = false;
function alScrollear() {
  pendiente = false;
  const y = scrollY;
  cabecera?.toggleAttribute('data-compacta', y > 8);
  const bajando = y > ultimoY + 6;
  const subiendo = y < ultimoY - 6;
  const dentro = cabecera?.contains(document.activeElement);
  if (!escritorio.matches && !abierto() && !dentro) {
    if (bajando && y > 160) cabecera?.setAttribute('data-oculta', '');
    else if (subiendo || y < 160) cabecera?.removeAttribute('data-oculta');
  } else cabecera?.removeAttribute('data-oculta');
  if (bajando || subiendo) ultimoY = y;
}
addEventListener('scroll', () => {
  if (!pendiente) {
    pendiente = true;
    requestAnimationFrame(alScrollear);
  }
}, { passive: true });
alScrollear();

/* ---------- Tema ---------- */
const raiz = document.documentElement;
const metaColor = document.querySelector('meta[name="theme-color"]');
type Tema = 'light' | 'dark';
const temaActual = (): Tema => (raiz.dataset.theme === 'dark' ? 'dark' : 'light');

function aplicar(tema: Tema) {
  raiz.dataset.theme = tema;
  metaColor?.setAttribute('content', tema === 'dark' ? '#0066ff' : '#ffffff');
  botonTema?.setAttribute('aria-pressed', String(tema === 'dark'));
}
aplicar(temaActual());

botonTema?.addEventListener('click', () => {
  const nuevo: Tema = temaActual() === 'dark' ? 'light' : 'dark';
  guardado.escribir('viogua-tema', nuevo);
  if (!document.startViewTransition || reducido()) return aplicar(nuevo);
  const caja = botonTema.getBoundingClientRect();
  const x = caja.left + caja.width / 2, y = caja.top + caja.height / 2;
  const radio = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const transicion = document.startViewTransition(() => aplicar(nuevo));
  transicion.ready
    .then(() => {
      raiz.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radio}px at ${x}px ${y}px)`] },
        { duration: 650, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', pseudoElement: '::view-transition-new(root)' }
      );
    })
    .catch(() => {});
});

// Si no eligió tema, seguimos al sistema cuando cambia.
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
  if (!guardado.leer('viogua-tema')) aplicar(e.matches ? 'dark' : 'light');
});
