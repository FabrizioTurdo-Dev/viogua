// Acceso al panel del estudio (/estudio/): la clave viaja en el header «x-clave» y se busca por su
// SHA-256 en la tabla `accesos`. Las claves son largas y al azar: no hace falta limitar intentos.
import { db } from './db.ts';

const hex = (buffer: ArrayBuffer) => Array.from(new Uint8Array(buffer), b => b.toString(16).padStart(2, '0')).join('');

/** Nombre del acceso (ej.: «guada») si la clave es válida, o null. */
export async function quienEntra(req: Request): Promise<string | null> {
  const clave = req.headers.get('x-clave') ?? '';
  if (clave.length < 20 || clave.length > 200) return null;
  const hash = hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(clave)));
  const { data, error } = await db.from('accesos').select('nombre').eq('clave_sha256', hash).maybeSingle();
  if (error) throw error;
  return data?.nombre ?? null;
}
