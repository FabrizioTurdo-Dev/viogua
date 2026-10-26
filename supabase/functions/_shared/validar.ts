// Validación del pedido de turno y del test, del lado del servidor. Sin imports: la usan
// Deno y Vitest (`tests/validar.test.ts`).

export interface Pedido {
  nombre: string;
  email: string;
  whatsapp: string;
  cantidad: number;
  ambientes: string[];
  fecha: string;
  hora: string;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const texto = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/** El pedido limpio, o el mensaje de error para mostrar. */
export function validarPedido(p: unknown): Pedido | string {
  if (!p || typeof p !== 'object') return 'Pedido inválido.';
  const o = p as Record<string, unknown>;
  if (texto(o.web)) return 'Pedido inválido.'; // trampa para bots
  const nombre = texto(o.nombre);
  const email = texto(o.email).toLowerCase();
  const whatsapp = texto(o.whatsapp);
  const cantidad = Number(o.cantidad);
  const ambientes = Array.isArray(o.ambientes) ? o.ambientes.map(texto) : [];
  const fecha = texto(o.fecha);
  const hora = texto(o.hora);

  if (nombre.length < 2 || nombre.length > 80) return 'Revisá tu nombre.';
  if (!EMAIL.test(email) || email.length > 120) return 'Revisá tu email.';
  if (!/^\d{8,15}$/.test(whatsapp)) return 'Revisá tu WhatsApp.';
  if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 4) return 'Elegí cuántos ambientes querés diseñar.';
  // En la promo 4 + 1 se nombran cinco ambientes.
  if (ambientes.length !== (cantidad === 4 ? 5 : cantidad) || ambientes.some(a => !a || a.length > 60)) {
    return 'Revisá los nombres de los ambientes.';
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !/^\d{2}:\d{2}$/.test(hora)) return 'Elegí un día y un horario.';
  if (o.consentimiento !== true) return 'Necesitamos tu OK para usar estos datos.';
  return { nombre, email, whatsapp, cantidad, ambientes, fecha, hora };
}

/** Elecciones del test: hasta 4 ids por tipo. */
export function validarPicks(v: unknown): Record<string, string[]> | null {
  if (!v || typeof v !== 'object') return null;
  const picks: Record<string, string[]> = {};
  for (const tipo of ['estilos', 'colores', 'sensaciones', 'materiales']) {
    const lista = (v as Record<string, unknown>)[tipo];
    if (!Array.isArray(lista) || lista.length > 4 || lista.some(id => typeof id !== 'string' || id.length > 40)) return null;
    picks[tipo] = lista;
  }
  return picks;
}
