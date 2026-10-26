// Contenido del test de estilo. Todo en un solo lugar para que sea fácil de editar.
// Sin imágenes: así lo pueden usar el navegador, el canvas y los tests. Las fotos se
// asocian en `fotos.ts`.

export type Tipo = 'estilos' | 'colores' | 'sensaciones' | 'materiales';
export const TIPOS: Tipo[] = ['estilos', 'colores', 'sensaciones', 'materiales'];
export const TITULOS: Record<Tipo, string> = {
  estilos: 'Estilos',
  colores: 'Colores',
  sensaciones: 'Sensaciones',
  materiales: 'Materiales',
};

export interface Estilo { id: string; nombre: string }
export interface Color { id: string; nombre: string; hex: string }
export interface Sensacion { id: string; nombre: string; frase: string }
export interface Material { id: string; nombre: string; credito: { autor: string; url: string } }

export const ESTILOS: Estilo[] = (
  [
    [1, 'Minimalista'], [2, 'Farmhouse'], [3, 'Industrial'], [4, 'Provenzal'],
    [5, 'Ecléctico pop'], [6, 'Nórdico'], [7, 'Bohemio'], [8, 'Vintage ecléctico'],
    [9, 'Neoclásico'], [10, 'Wabi-sabi'], [11, 'Contemporáneo'], [12, 'Minimal cálido'],
    [13, 'Moderno sereno'], [14, 'Mediterráneo'], [15, 'Loft'], [16, 'Orgánico moderno'],
    [17, 'Hotel boutique'], [18, 'Urban jungle'], [19, 'Zen'], [20, 'Retro 70s'],
    [21, 'Cottage'], [22, 'Maximalista'], [23, 'Color block'], [24, 'Japandi'],
    [25, 'Mid-century'], [26, 'Parisino'],
  ] as const
).map(([id, nombre]) => ({ id: String(id), nombre }));

// 40 colores, ordenados de neutros a profundos para que la grilla se lea como una carta de color.
export const COLORES: Color[] = (
  [
    ['tiza', 'Blanco tiza', '#F4F1EA'], ['hueso', 'Hueso', '#E9E2D3'], ['arena', 'Arena', '#D8C8AE'],
    ['lino', 'Lino', '#CDBFA8'], ['greige', 'Greige', '#B8AFA3'], ['piedra', 'Gris piedra', '#A5A39E'],
    ['topo', 'Topo', '#8E8073'], ['grafito', 'Grafito', '#4A4A4C'],
    ['manteca', 'Amarillo manteca', '#F3DE9A'], ['miel', 'Miel', '#D9A55B'], ['mostaza', 'Mostaza', '#D6A93A'],
    ['ocre', 'Ocre', '#C9962F'], ['caramelo', 'Caramelo', '#B67A3C'], ['naranja', 'Naranja quemado', '#D2691E'],
    ['durazno', 'Durazno', '#F2C3A5'], ['arcilla', 'Arcilla', '#C98B6B'], ['terracota', 'Terracota', '#B5603D'],
    ['oxido', 'Óxido', '#8F3F22'], ['empolvado', 'Rosa empolvado', '#E7B8B5'], ['chicle', 'Rosa chicle', '#F08BB4'],
    ['cereza', 'Rojo cereza', '#B3262E'], ['borgona', 'Borgoña', '#6E2233'],
    ['menta', 'Menta', '#BFE1CF'], ['salvia', 'Salvia', '#A3B09A'], ['eucalipto', 'Eucalipto', '#7FA59A'],
    ['agua', 'Verde agua', '#8CC6BE'], ['turquesa', 'Turquesa', '#2A9D8F'], ['oliva', 'Oliva', '#7A7A44'],
    ['musgo', 'Verde musgo', '#4E5B36'], ['bosque', 'Verde bosque', '#24432F'],
    ['bruma', 'Celeste bruma', '#B9CDD8'], ['cielo', 'Azul cielo', '#8FB8DE'], ['cobalto', 'Azul cobalto', '#1F45E0'],
    ['petroleo', 'Azul petróleo', '#1F4E5A'], ['marino', 'Azul marino', '#1D2A4D'],
    ['lavanda', 'Lavanda', '#B8AEDB'], ['lila', 'Lila', '#9C7FB8'],
    ['nogal', 'Nogal', '#6B4630'], ['chocolate', 'Chocolate', '#4B2E22'], ['carbon', 'Negro carbón', '#222222'],
  ] as const
).map(([id, nombre, hex]) => ({ id, nombre, hex }));

// Lo que le gustaría que el ambiente le transmita (frases, como pide el brief).
export const SENSACIONES: Sensacion[] = (
  [
    ['calma', 'Calma', 'Calma de domingo a la mañana'],
    ['abrigo', 'Abrigo', 'Que me abrace al llegar'],
    ['luz', 'Luminosidad', 'Luz, mucha luz'],
    ['energia', 'Energía', 'Energía para arrancar el día'],
    ['orden', 'Orden', 'Todo en su lugar'],
    ['refugio', 'Refugio', 'Un refugio para desconectar'],
    ['personalidad', 'Personalidad', 'Que se note quién vive acá'],
    ['elegancia', 'Elegancia', 'Elegancia sin esfuerzo'],
    ['naturaleza', 'Naturaleza', 'La naturaleza adentro'],
    ['encuentro', 'Encuentro', 'Una casa para recibir gente'],
    ['juego', 'Juego', 'Color, juego y creatividad'],
    ['nostalgia', 'Nostalgia', 'Objetos con historia'],
    ['calidez', 'Calidez', 'Cálido como una tarde de otoño'],
    ['frescura', 'Frescura', 'Aire fresco y liviano'],
    ['amplitud', 'Amplitud', 'Espacio para respirar'],
    ['intimidad', 'Intimidad', 'Rincones solo para mí'],
    ['armonia', 'Armonía', 'Todo en equilibrio'],
    ['alegria', 'Alegría', 'Que me saque una sonrisa'],
    ['libertad', 'Libertad', 'Sin rigidez, a mi manera'],
    ['simpleza', 'Simpleza', 'Menos es más'],
    ['vacaciones', 'Vacaciones', 'Vacaciones todo el año'],
    ['bienestar', 'Bienestar', 'Cuidarme y descansar de verdad'],
    ['inspiracion', 'Inspiración', 'Un lugar que me inspire a crear'],
    ['foco', 'Foco', 'Concentración para trabajar en casa'],
  ] as const
).map(([id, nombre, frase]) => ({ id, nombre, frase }));

// Fotos de Unsplash (licencia Unsplash: uso libre, sin costo). Crédito: autor y foto original.
export const MATERIALES: Material[] = (
  [
    ['roble', 'Roble claro', 'simon', 'JH_R66BihvA'],
    ['nogal', 'Nogal', 'The Cleveland Museum of Art', 'KKKHaEA4coc'],
    ['carrara', 'Mármol Carrara', 'Madison Bracaglia', 'fcWAwPKpkTU'],
    ['verde', 'Mármol verde', 'Olga Thelavart', 'lIg6fu2yxFk'],
    ['terrazo', 'Terrazo', 'Franck V.', 'Y0uQ-YxYjOs'],
    ['lino', 'Lino', 'Kateryna Hliznitsova', '2NDtPNiLcD0'],
    ['microcemento', 'Microcemento', 'Hydra 4x', 'OL2tYVcApI4'],
    ['esterilla', 'Esterilla de ratán', 'Vaibhav Surana', 'zDEVsw4eJqE'],
    ['boucle', 'Bouclé', 'Kevin Shek', 'NWHf40nJ1J4'],
    ['travertino', 'Travertino', 'engin akyurt', 'FszmlZln-4g'],
    ['laton', 'Latón', 'Erol Ahmed', 'XsQ8nUKpAO4'],
    ['azulejo', 'Azulejo esmaltado', 'Elena Giglia', 'DdrvtJ0lieY'],
    ['espiga', 'Parquet espiga', 'DDP', 'kS1UuxzkuJE'],
    ['veteado', 'Roble veteado', 'MeSSrro', 'Uo7M4171Hsg'],
    ['ahumado', 'Roble ahumado', 'Marcel Strauß', 'E7DsoC0mcpw'],
    ['hormigon', 'Hormigón visto', 'Wesley Tingey', '-Irs24DzLxM'],
    ['revoque', 'Revoque rústico', 'Eugene Ngoya', '3Y_J_LfEZPc'],
    ['calacatta', 'Mármol Calacatta', 'H&CO', 'tqu0IOMaiU8'],
    ['marquina', 'Mármol Nero Marquina', 'Valeria Reverdo', 'dwy2meBFqW8'],
    ['laja', 'Piedra laja', 'Mitchell Luo', 'i1O_Hr6cbWc'],
    ['arenisca', 'Piedra arenisca', 'JKalina', 'Ibf--wj77FY'],
    ['granito', 'Granito gris', 'Gareth David', 'Gi7Hw4o0gzc'],
    ['ladrillo', 'Ladrillo visto', 'Mick Haupt', 'GN2IqNRlPXs'],
    ['cuero', 'Cuero suela', 'Igor Karimov', 'PLI4fSGYQfg'],
  ] as const
).map(([id, nombre, autor, foto]) => ({ id, nombre, credito: { autor, url: `https://unsplash.com/photos/${foto}` } }));

// Frases de la pantalla de carga, tal cual las escribió VioGua.
export const FRASES_CARGA = [
  'Tu estilo habla por vos…',
  'Me gusta tu estilo…',
  'Se nota tu esencia…',
  'Tu estilo tiene potencial…',
  'Ya puedo imaginar tu espacio…',
  'Entiendo lo que buscás…',
  'Los detalles hacen la diferencia…',
  'Estamos creando algo único…',
];

// Orden de las 16 muestras en la animación de carga: cada fila y cada columna tiene un
// estilo, un color, una sensación y un material.
export const PATRON: Tipo[] = [
  'estilos', 'colores', 'sensaciones', 'materiales',
  'sensaciones', 'materiales', 'estilos', 'colores',
  'colores', 'estilos', 'materiales', 'sensaciones',
  'materiales', 'sensaciones', 'colores', 'estilos',
];

// Collage del moodboard. Tablero de 100 × 136 unidades; cada pieza es un recorte
// (rect, arco o círculo) de un estilo, un color, una sensación o un material elegido.
export type Forma = 'rect' | 'arco' | 'circulo';
export interface Pieza {
  tipo: Tipo;
  n: number;
  forma: Forma;
  fondo?: 'rosa' | 'blanco';
  x: number;
  y: number;
  w: number;
  h: number;
}
export const COLLAGE_ALTO = 136;
export const COLLAGE: Pieza[] = [
  { tipo: 'estilos', n: 0, forma: 'arco', x: 0, y: 0, w: 40, h: 54 },
  { tipo: 'estilos', n: 1, forma: 'rect', x: 43, y: 0, w: 57, h: 30 },
  { tipo: 'sensaciones', n: 0, forma: 'rect', fondo: 'rosa', x: 43, y: 33, w: 27, h: 23 },
  { tipo: 'materiales', n: 0, forma: 'circulo', x: 73, y: 33, w: 27, h: 27 },
  { tipo: 'colores', n: 0, forma: 'circulo', x: 0, y: 57, w: 9, h: 9 },
  { tipo: 'colores', n: 1, forma: 'circulo', x: 11, y: 57, w: 9, h: 9 },
  { tipo: 'colores', n: 2, forma: 'circulo', x: 22, y: 57, w: 9, h: 9 },
  { tipo: 'colores', n: 3, forma: 'circulo', x: 33, y: 57, w: 9, h: 9 },
  { tipo: 'sensaciones', n: 1, forma: 'rect', fondo: 'blanco', x: 43, y: 59, w: 27, h: 23 },
  { tipo: 'materiales', n: 1, forma: 'rect', x: 73, y: 63, w: 27, h: 23 },
  { tipo: 'estilos', n: 2, forma: 'rect', x: 0, y: 70, w: 40, h: 34 },
  { tipo: 'materiales', n: 2, forma: 'circulo', x: 43, y: 85, w: 27, h: 27 },
  { tipo: 'sensaciones', n: 2, forma: 'rect', fondo: 'rosa', x: 73, y: 89, w: 27, h: 23 },
  { tipo: 'sensaciones', n: 3, forma: 'rect', fondo: 'blanco', x: 0, y: 107, w: 40, h: 16 },
  { tipo: 'materiales', n: 3, forma: 'rect', x: 0, y: 126, w: 40, h: 10 },
  { tipo: 'estilos', n: 3, forma: 'rect', x: 43, y: 115, w: 57, h: 21 },
];

export type Picks = Record<Tipo, string[]>;
export type Item = Estilo | Color | Sensacion | Material;
export const CATALOGO: Record<Tipo, Item[]> = {
  estilos: ESTILOS,
  colores: COLORES,
  sensaciones: SENSACIONES,
  materiales: MATERIALES,
};

export const buscar = (tipo: Tipo, id: string | undefined): Item | undefined =>
  CATALOGO[tipo].find(item => item.id === id);

export const esFoto = (tipo: Tipo) => tipo === 'estilos' || tipo === 'materiales';
export const esColor = (item: Item): item is Color => 'hex' in item;
export const esSensacion = (item: Item): item is Sensacion => 'frase' in item;

/** Cada pieza del collage con el ítem elegido que le toca (se descartan las que no tienen elección). */
export function piezasDe(picks: Picks) {
  return COLLAGE.flatMap(p => {
    const item = buscar(p.tipo, picks[p.tipo][p.n]);
    return item ? [{ ...p, item }] : [];
  });
}

/** Las 16 celdas de la animación de carga, en el orden de PATRON. */
export function celdasDe(picks: Picks) {
  const usados: Record<Tipo, number> = { estilos: 0, colores: 0, sensaciones: 0, materiales: 0 };
  return PATRON.map(tipo => ({ tipo, item: buscar(tipo, picks[tipo][usados[tipo]++]) }));
}
