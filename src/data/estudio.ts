// Datos públicos del estudio: contacto, agenda, textos que se repiten (SEO/GEO) y crédito.
// Lo que todavía no definió VioGua queda en null: el sitio lo oculta en producción y en
// desarrollo muestra «a definir» para que se vea qué falta.

export const ESTUDIO = {
  nombre: 'VioGua',
  rubro: 'Estudio de diseño de interiores',
  bajada: 'Diseño de interiores · estética · funcionalidad · armonía',
  lema: 'Diseñamos espacios que te representan',
  /** Frase de identidad: la misma en el sitio, Instagram y Google (pensada para que la citen buscadores e IA). */
  identidad:
    'VioGua es un estudio de diseño de interiores de Argentina que diseña ambientes por videollamada, con un test de estilo y un moodboard personalizado de regalo.',
  descripcion:
    'Transformamos tu visión en espacios reales: diseño personalizado, funcionalidad optimizada y armonía estética, guiados paso a paso.',
  pais: 'Argentina',
  /** Ciudad base del estudio. A definir por VioGua. */
  ciudad: null as string | null,
  /** WhatsApp del estudio en formato internacional sin «+» (549 + código de área + número). */
  whatsapp: '5491140707634' as string | null,
  email: 'guadalupealvear02@gmail.com' as string | null,
  instagram: 'viogua',
  /** Quién está detrás del estudio. A definir por VioGua. */
  equipo: [] as { nombre: string; rol: string }[],
  idioma: 'es-AR',
  zonaHoraria: 'America/Argentina/Buenos_Aires',
} as const;

export const instagramUrl = `https://instagram.com/${ESTUDIO.instagram}`;
export const whatsappUrl = (texto?: string) =>
  ESTUDIO.whatsapp
    ? `https://wa.me/${ESTUDIO.whatsapp}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`
    : null;

/** Con PUBLIC_API_URL el sitio guarda el pedido en Supabase, retiene el horario y recibe fotos y test. */
export const CON_BACKEND = Boolean(import.meta.env.PUBLIC_API_URL);

/**
 * Mientras Google Calendar no esté conectado (PUBLIC_GOOGLE_CALENDAR distinta de «true»), el turno
 * se pide por WhatsApp: la persona elige día y horario, le manda al estudio el pedido ya escrito y
 * VioGua lo confirma a mano (con backend, desde /estudio/). Con Google se confirma solo, con Meet.
 */
export const POR_WHATSAPP = !(CON_BACKEND && import.meta.env.PUBLIC_GOOGLE_CALENDAR === 'true');

// Agenda de las reuniones, definida por VioGua. Con el backend, la función `disponibilidad` les
// resta los turnos ya pedidos y, si está conectado, lo ocupado en Google Calendar (freeBusy). Sin
// backend se ofrecen todos.
const ENTRE_SEMANA = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
export const AGENDA = {
  /** Horarios de inicio por día de la semana (0 = domingo): la última reunión termina a las 20 h (sábados, a las 13 h). */
  horarios: {
    1: ENTRE_SEMANA,
    2: ENTRE_SEMANA,
    3: ENTRE_SEMANA,
    4: ENTRE_SEMANA,
    5: ENTRE_SEMANA,
    6: ['10:00', '11:00', '12:00'],
  } as Record<number, string[]>,
  duracionMin: 60,
  avisoMinHoras: 24,
  horizonteDias: 60,
  /** Texto para el footer y las preguntas frecuentes. */
  resumen: 'Lunes a viernes de 10 a 20 h · sábados de 10 a 13 h',
  plataforma: 'Google Meet',
} as const;

export const PROMO = {
  titulo: '4 ambientes + 1 de regalo',
  detalle: 'Si elegís diseñar cuatro ambientes, el quinto lo diseñamos sin cargo.',
} as const;

/**
 * Honorarios del diseño, en pesos argentinos. Render y búsqueda de presupuesto se cobran por
 * ambiente; el acompañamiento del proceso, una sola vez (no se multiplica por ambientes).
 */
export const HONORARIOS = {
  render: 80_000,
  presupuesto: 70_000, // búsqueda de presupuesto teniendo en cuenta precio y calidad
  acompanamiento: 100_000,
} as const;
/** Lo que suma cada ambiente: render + búsqueda de presupuesto. */
export const POR_AMBIENTE = HONORARIOS.render + HONORARIOS.presupuesto;
/** Total según los ambientes que se cobran (en la promo 4 + 1 se cobran cuatro). */
export const total = (cantidad: number) => HONORARIOS.acompanamiento + cantidad * POR_AMBIENTE;

const formato = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });
/** 250000 → «$250.000» */
export const pesos = (monto: number) => `$${formato.format(monto)}`;
/** Total del diseño: 1 ambiente → «$250.000». */
export const precio = (cantidad: number) => pesos(total(cantidad));

/** Renglones que explican el total (paso 1 del turno). */
export function desglose(cantidad: number) {
  const renglones = [
    { concepto: 'Render', detalle: `${cantidad} × ${pesos(HONORARIOS.render)}`, monto: cantidad * HONORARIOS.render },
    { concepto: 'Búsqueda de presupuesto', detalle: `precio y calidad · ${cantidad} × ${pesos(HONORARIOS.presupuesto)}`, monto: cantidad * HONORARIOS.presupuesto },
    { concepto: 'Acompañamiento del proceso', detalle: 'una sola vez', monto: HONORARIOS.acompanamiento },
  ];
  if (cantidad === 4) renglones.push({ concepto: 'Quinto ambiente', detalle: `de regalo · te ahorrás ${pesos(POR_AMBIENTE)}`, monto: 0 });
  return renglones;
}

// Crédito del desarrollador: mismo formato que en sus otros sitios
// (chitopo/landing/src/data/store.js). El mensaje queda abierto para completar.
export const DESARROLLADOR = {
  nombre: 'Fabrizio Turdo',
  telefono: '5491154922800',
  mensaje: '¡Hola, Fabrizio! Vi la web de VioGua y quiero una para mi negocio. Te cuento de qué se trata: ',
} as const;
export const desarrolladorUrl = `https://wa.me/${DESARROLLADOR.telefono}?text=${encodeURIComponent(DESARROLLADOR.mensaje)}`;

export const PILARES = [
  { codigo: 'VG—01', titulo: 'Diseño personalizado', texto: 'Proyectos únicos, adaptados a tu estilo, tus necesidades y tu presupuesto.' },
  { codigo: 'VG—02', titulo: 'Funcionalidad', texto: 'Distribuciones inteligentes que aprovechan cada metro del espacio.' },
  { codigo: 'VG—03', titulo: 'Estética y armonía', texto: 'Combinamos materiales, texturas y luz para lograr ambientes que inspiran.' },
  { codigo: 'VG—04', titulo: 'Acompañamiento', texto: 'Te guiamos en cada etapa del proyecto, de principio a fin.' },
] as const;

export const PASOS = [
  { titulo: 'Elegí tus ambientes', texto: 'Contanos cuántos espacios querés transformar y cuáles son. Si querés, sumá fotos.' },
  { titulo: 'Agendá la videollamada', texto: 'Elegís el día y el horario que te quedan cómodos. La reunión es por Google Meet.' },
  { titulo: 'Te confirmamos la reunión', texto: 'Te llega la invitación con el día, la hora y el link de Google Meet.' },
  { titulo: 'Test de estilo', texto: 'Opcional, antes de la reunión. Elegís lo que te gusta y te regalamos tu moodboard.', opcional: true },
] as const;

// Qué hace el estudio, en concreto (sección «Sobre VioGua»). A validar por VioGua.
export const SERVICIOS = [
  {
    titulo: 'Diseño de ambientes',
    texto: 'Diseñamos cada ambiente que elijas, del living al home office: distribución, estilo, colores, materiales y luz pensados para cómo vivís.',
  },
  {
    titulo: 'Reunión por videollamada',
    texto: 'Una primera charla por Google Meet para conocer tu espacio, tus gustos y lo que necesitás. No hace falta que estés cerca del estudio.',
  },
  {
    titulo: 'Test de estilo y moodboard',
    texto: 'Después de agendar, un test de cuatro pasos para descubrir tu estilo. Te regalamos el moodboard, listo para guardar o compartir.',
  },
] as const;

// Preguntas frecuentes: respuestas cortas que se entienden solas (sirven para Google y para
// buscadores con IA, y van también como FAQPage en los datos estructurados). A validar por VioGua.
export const PREGUNTAS = [
  {
    pregunta: '¿Cómo es la primera reunión?',
    respuesta:
      'Es una videollamada por Google Meet. Nos contás qué ambientes querés transformar, cómo los usás y qué te gusta. Si sumaste fotos o hiciste el test de estilo, llegamos a la reunión con ideas.',
  },
  {
    pregunta: '¿Tengo que vivir cerca del estudio?',
    respuesta:
      'No. Las reuniones son por videollamada, así que podemos diseñar tu espacio estés donde estés.',
  },
  {
    pregunta: '¿Cómo me confirman la reunión?',
    respuesta: POR_WHATSAPP
      ? 'Elegís el día y el horario y nos mandás el pedido por WhatsApp, con el mensaje ya escrito. Te respondemos para confirmar el turno y te llega por email la invitación con el link de Google Meet.'
      : 'Al confirmar el turno te llega por email la invitación con el link de Google Meet, y te escribimos por WhatsApp con el día y la hora.',
  },
  {
    pregunta: '¿Qué es un moodboard?',
    respuesta:
      'Es un tablero de inspiración: una composición que reúne imágenes, colores, texturas y materiales para transmitir el estilo y la atmósfera de un proyecto antes de empezar a diseñarlo.',
  },
  {
    pregunta: '¿Cómo funciona el test de estilo?',
    respuesta:
      'Después de agendar tu reunión elegís 4 estilos, 4 colores, 4 sensaciones y 4 materiales. Con eso armamos tu moodboard, que podés guardar, compartir o mandarnos para que conozcamos tu estilo antes de la reunión.',
  },
  {
    pregunta: '¿Puedo mandar fotos de mis ambientes?',
    respuesta: CON_BACKEND
      ? 'Sí. Al agendar podés sumar una foto de cada ambiente. Son opcionales, pero nos ayudan a llegar a la reunión con ideas.'
      : 'Sí. Mandalas por WhatsApp cuando nos escribas para agendar. Son opcionales, pero nos ayudan a llegar a la reunión con ideas.',
  },
  {
    pregunta: '¿Cómo funciona la promo de 4 ambientes + 1?',
    respuesta: `Si elegís diseñar cuatro ambientes (${precio(4)}), el quinto lo diseñamos sin cargo. Elegís la opción «4 + 1» al agendar.`,
  },
] as const;
