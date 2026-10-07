// Asocia cada estilo y material con su foto (Astro las optimiza en el build).
import type { ImageMetadata } from 'astro';

const estilos = import.meta.glob<{ default: ImageMetadata }>('../assets/estilos/*.jpeg', { eager: true });
const materiales = import.meta.glob<{ default: ImageMetadata }>('../assets/materiales/*.jpg', { eager: true });

export const fotoEstilo = (id: string) => estilos[`../assets/estilos/${id}.jpeg`].default;
export const fotoMaterial = (id: string) => materiales[`../assets/materiales/${id}.jpg`].default;
