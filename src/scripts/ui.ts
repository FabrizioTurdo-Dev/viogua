// Utilidades de interfaz compartidas.

export const $ = <T extends Element = HTMLElement>(sel: string, raiz: ParentNode = document) =>
  raiz.querySelector<T>(sel) as T;
export const $$ = <T extends Element = HTMLElement>(sel: string, raiz: ParentNode = document) => [
  ...raiz.querySelectorAll<T>(sel),
];

/** localStorage que no rompe en modo privado o con el almacenamiento bloqueado. */
export const guardado = {
  leer(clave: string): string | null {
    try {
      return localStorage.getItem(clave);
    } catch {
      return null;
    }
  },
  escribir(clave: string, valor: string) {
    try {
      localStorage.setItem(clave, valor);
    } catch {
      /* sin almacenamiento */
    }
  },
  borrar(clave: string) {
    try {
      localStorage.removeItem(clave);
    } catch {
      /* sin almacenamiento */
    }
  },
};

export const reducido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

let avisoTiempo: ReturnType<typeof setTimeout> | undefined;
/** Mensaje corto abajo de la pantalla (role=status). */
export function avisar(texto: string) {
  const el = document.getElementById('aviso');
  if (!el) return;
  el.hidden = true;
  el.textContent = texto;
  void el.offsetWidth;
  el.hidden = false;
  clearTimeout(avisoTiempo);
  avisoTiempo = setTimeout(() => {
    el.hidden = true;
  }, 3800);
}
