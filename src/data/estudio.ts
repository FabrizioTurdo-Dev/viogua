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
  /** WhatsApp del estudio en formato internacional sin «+» (ej.: 5491123456789). A definir. */
  whatsapp: null as string | null,
  email: null as string | null,
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

// Agenda de ejemplo para el modo demo. Los valores reales los define VioGua y, con el
// backend, salen de Google Calendar (freeBusy) en la función `disponibilidad`.
export const AGENDA = {
  /** Horarios de inicio por día de la semana (0 = domingo). */
  horarios: {
    1: ['10:00', '11:30', '15:00', '16:30', '18:00'],
    2: ['10:00', '11:30', '15:00', '16:30', '18:00'],
    3: ['10:00', '11:30', '15:00', '16:30', '18:00'],
    4: ['10:00', '11:30', '15:00', '16:30', '18:00'],
    5: ['10:00', '11:30', '15:00', '16:30', '18:00'],
    6: ['10:00', '11:30'],
  } as Record<number, string[]>,
  duracionMin: 60,
  avisoMinHoras: 24,
  horizonteDias: 60,
  /** Texto para el footer y las preguntas frecuentes. */
  resumen: 'Lunes a viernes de 10 a 19 h · sábados de 10 a 13 h',
  plataforma: 'Google Meet',
} as const;

export const PROMO = {
  titulo: '4 ambientes + 1 de regalo',
  detalle: 'Si elegís diseñar cuatro ambientes, el quinto lo diseñamos sin cargo.',
} as const;

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
    respuesta:
      'Al confirmar el turno te llega por email la invitación con el link de Google Meet, y te escribimos por WhatsApp con el día y la hora.',
  },
  {
    pregunta: '¿Qué es un moodboard?',
    respuesta:
      'Es un tablero de inspiración: una composición que reúne imágenes, colores, texturas y materiales para transmitir el estilo y la atmósfera de un proyecto antes de empezar a diseñarlo.',
  },
  {
    pregunta: '¿Cómo funciona el test de estilo?',
    respuesta:
      'Después de agendar tu reunión elegís 4 estilos, 4 colores, 4 sensaciones y 4 materiales. Con eso armamos tu moodboard, que podés guardar o compartir, y así conocemos tu estilo antes de la reunión.',
  },
  {
    pregunta: '¿Puedo mandar fotos de mis ambientes?',
    respuesta:
      'Sí. Al agendar podés sumar una foto de cada ambiente. Son opcionales, pero nos ayudan a llegar a la reunión con ideas.',
  },
  {
    pregunta: '¿Cómo funciona la promo de 4 ambientes + 1?',
    respuesta: 'Si elegís diseñar cuatro ambientes, el quinto lo diseñamos sin cargo. Elegís la opción «4 + 1» al agendar.',
  },
] as const;
