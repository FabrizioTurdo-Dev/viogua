// Respuestas JSON, CORS cerrado a los dominios del sitio y manejo de errores en español.

// Dominios que pueden llamar a las funciones (secreto ORIGENES, separados por coma).
const ORIGENES = (Deno.env.get('ORIGENES') ?? 'http://localhost:5184,https://vioguamvp.vercel.app')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

function cors(req: Request): Record<string, string> {
  const origen = req.headers.get('Origin') ?? '';
  return {
    'Access-Control-Allow-Origin': ORIGENES.includes(origen) ? origen : ORIGENES[0],
    'Access-Control-Allow-Headers': 'content-type, x-clave',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    Vary: 'Origin',
  };
}

export const json = (req: Request, cuerpo: unknown, estado = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(cuerpo), { status: estado, headers: { ...cors(req), ...extra, 'Content-Type': 'application/json' } });

export const error = (req: Request, mensaje: string, estado: number) => json(req, { error: mensaje }, estado);

type Metodo = 'GET' | 'POST';

/** Deno.serve con preflight de CORS, métodos esperados y un 500 genérico si algo explota. */
export function servir(metodos: Metodo | Metodo[], manejar: (req: Request) => Promise<Response>) {
  const permitidos: string[] = [metodos].flat();
  Deno.serve(async req => {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req) });
    if (!permitidos.includes(req.method)) return error(req, 'Método no permitido.', 405);
    try {
      return await manejar(req);
    } catch (e) {
      console.error(e);
      return error(req, 'Algo salió mal. Probá de nuevo en un momento.', 500);
    }
  });
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const esToken = (t: unknown): t is string => typeof t === 'string' && UUID.test(t);
