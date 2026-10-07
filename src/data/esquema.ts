// Datos estructurados (JSON-LD, schema.org) a partir de los datos del estudio.
// Sirven para Google (resultados enriquecidos) y para los buscadores con IA.
import { AGENDA, ESTUDIO, PREGUNTAS, PROMO, SERVICIOS, instagramUrl, whatsappUrl } from './estudio';

export function esquemaEstudio(site: URL) {
  const url = site.href;
  const id = `${url}#estudio`;
  const fundadoras = ESTUDIO.equipo.map(p => ({ '@type': 'Person', name: p.nombre, jobTitle: p.rol }));
  const contacto = [whatsappUrl() && { '@type': 'ContactPoint', contactType: 'customer service', url: whatsappUrl(), availableLanguage: 'es' }].filter(Boolean);

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'ProfessionalService',
      '@id': id,
      name: ESTUDIO.nombre,
      description: ESTUDIO.identidad,
      slogan: ESTUDIO.lema,
      url,
      image: new URL('/og.jpg', site).href,
      logo: new URL('/icono-512.png', site).href,
      sameAs: [instagramUrl],
      areaServed: { '@type': 'Country', name: ESTUDIO.pais },
      ...(ESTUDIO.ciudad && { address: { '@type': 'PostalAddress', addressLocality: ESTUDIO.ciudad, addressCountry: 'AR' } }),
      ...(ESTUDIO.email && { email: ESTUDIO.email }),
      ...(contacto.length && { contactPoint: contacto }),
      ...(fundadoras.length && { founder: fundadoras }),
      knowsAbout: ['Diseño de interiores', 'Moodboard', 'Decoración', 'Distribución de ambientes', 'Paletas de color', 'Materiales'],
      availableLanguage: 'es',
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Servicios de diseño de interiores',
        itemListElement: SERVICIOS.map(s => ({
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: s.titulo, description: s.texto, provider: { '@id': id } },
        })),
      },
      makesOffer: {
        '@type': 'Offer',
        name: PROMO.titulo,
        description: PROMO.detalle,
        itemOffered: { '@type': 'Service', name: 'Diseño de ambientes', provider: { '@id': id } },
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: ESTUDIO.nombre,
      url,
      inLanguage: ESTUDIO.idioma,
      publisher: { '@id': id },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: PREGUNTAS.map(p => ({
        '@type': 'Question',
        name: p.pregunta,
        acceptedAnswer: { '@type': 'Answer', text: p.respuesta },
      })),
    },
  ];
}

/** Para la página del turno: el servicio de reunión inicial por videollamada. */
export function esquemaReunion(site: URL) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Reunión inicial de diseño de interiores por videollamada',
      serviceType: 'Diseño de interiores',
      description: `Agendá una videollamada por ${AGENDA.plataforma} para contarnos qué ambientes querés transformar. Después podés hacer el test de estilo y te regalamos tu moodboard.`,
      provider: { '@id': `${site.href}#estudio` },
      areaServed: { '@type': 'Country', name: ESTUDIO.pais },
      url: new URL('/test/', site).href,
    },
  ];
}
