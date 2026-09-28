/*
  Editable store content: navigation, home sections, contact data.
  Every fact here comes from Recutex's public site (see docs/DEMO.md → "Datos a validar").
  In production this file moves to the admin/CMS so the team edits it without a developer.
*/

export const site = {
  name: 'Recutex',
  legalName: 'Recutex Limitada',
  tagline: 'Espumas, colchones y muebles de fabricación propia en Santiago de Chile.',
  description:
    'Colchones, camas, camarotes, sofás cama y láminas de espuma de fabricación propia. Fábrica en Cerro Navia, Santiago.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  contact: {
    whatsapp: '56982933117',
    whatsappLabel: '+56 9 8293 3117',
    phone: '+56 2 3278 1476',
    email: 'recutex@recutex.cl',
    address: 'Cauquenes 6609, Cerro Navia, Santiago',
    hours: 'Lunes a viernes de 9:00 a 18:00 (cerrado de 13:00 a 14:00)',
  },
  announcement: {
    text: 'Atención por WhatsApp: +56 9 8293 3117',
    href: 'https://wa.me/56982933117',
  },
  popularSearches: ['Colchón', 'Camarote', 'Sofá cama', 'Espuma', 'Comedor'],
};

export type NavLink = { title: string; href: string; children?: NavLink[] };
export type NavItem = NavLink & {
  promo?: { collection: string; title: string; text: string };
};

export const navigation: NavItem[] = [
  {
    title: 'Dormitorio',
    href: '/collections/dormitorio-1',
    children: [
      {
        title: 'Colchones',
        href: '/collections/colchones',
        children: [
          { title: 'Resortes', href: '/search?q=colchon+resorte' },
          { title: 'Espuma', href: '/search?q=colchon+espuma' },
          { title: '1 plaza', href: '/collections/colchones?medida=1+plaza' },
          { title: '2 plazas', href: '/collections/colchones?medida=2+plazas' },
          { title: 'King y Super King', href: '/collections/colchones?medida=King&medida=Super+King' },
        ],
      },
      { title: 'Camas', href: '/collections/dormitorio' },
      { title: 'Camarotes', href: '/collections/camarotes' },
    ],
    promo: {
      collection: 'colchones',
      title: 'Colchones',
      text: 'Resortes y espuma, de 1 plaza a Super King.',
    },
  },
  {
    title: 'Living',
    href: '/collections/sala-de-estar',
    children: [
      { title: 'Sofás', href: '/collections/sofas' },
      { title: 'Sillón futón', href: '/collections/sillon-futon' },
      { title: 'Futones', href: '/collections/futones' },
    ],
    promo: { collection: 'sofas', title: 'Sofás', text: 'Sofás cama y futones para tu living.' },
  },
  { title: 'Comedores', href: '/collections/comedores' },
  { title: 'Espumas', href: '/collections/espuma' },
  { title: 'Ofertas', href: '/collections/ofertas' },
  { title: 'Nosotros', href: '/pages/nosotros' },
];

export const footerLinks: NavLink[] = [
  { title: 'Nuestra historia', href: '/pages/nosotros' },
  { title: 'Preguntas frecuentes', href: '/pages/consultas-frecuentes' },
  { title: 'Devolución y garantía', href: '/pages/devolucion-y-garantia' },
  { title: 'Términos y condiciones', href: '/pages/terminos-y-condiciones' },
  { title: 'Política de privacidad', href: '/pages/politica-de-privacidad' },
];

export const home = {
  hero: {
    title: 'Descansa mejor.',
    subtitle: 'Colchones, camas y muebles de nuestra propia fábrica en Santiago.',
    product: 'cama-base-europea-2-plazas',
    primary: { label: 'Ver colchones', href: '/collections/colchones' },
    secondary: { label: 'Ver ofertas', href: '/collections/ofertas' },
  },
  categories: [
    { collection: 'colchones' },
    { collection: 'dormitorio', title: 'Camas' },
    { collection: 'camarotes' },
    { collection: 'sala-de-estar' },
    { collection: 'espuma' },
  ],
  story: {
    title: 'Del reciclaje textil a tu hogar.',
    text: 'Recutex nació reciclando textiles. Con los años sumó su propia fábrica de espumas, colchones y muebles en Cerro Navia, Santiago, y hoy lleva más de 30 años en los hogares chilenos.',
    product: 'sofa-cama-espuma-grey-premium-190x150x18-2-plazas',
    cta: { label: 'Conoce nuestra historia', href: '/pages/nosotros' },
  },
  benefits: [
    {
      icon: 'factory',
      title: 'Fabricación propia',
      text: 'Espumas, colchones y muebles hechos en nuestra fábrica de Cerro Navia.',
    },
    {
      icon: 'shield',
      title: '6 meses de garantía legal',
      text: 'Reparación, cambio o devolución ante fallas de fabricación.',
      link: { label: 'Ver condiciones', href: '/pages/devolucion-y-garantia' },
    },
    {
      icon: 'chat',
      title: 'Atención directa',
      text: 'Lunes a viernes de 9:00 a 18:00 por WhatsApp o teléfono.',
      link: { label: 'Preguntas frecuentes', href: '/pages/consultas-frecuentes' },
    },
    {
      icon: 'recycle',
      title: 'Nacimos reciclando',
      text: 'Nuestra historia comenzó en el reciclaje de textiles.',
    },
  ],
} as const;

/** `draft`: legal text pending validation by Recutex and a lawyer; the page shows a notice. */
export const pages: Record<string, { title: string; description: string; draft?: boolean }> = {
  nosotros: {
    title: 'Nuestra historia',
    description: 'De reciclar textiles a fabricar espumas, colchones y muebles.',
  },
  'consultas-frecuentes': {
    title: 'Preguntas frecuentes',
    description: 'Horarios, despacho, garantía y ubicación de Recutex.',
  },
  'devolucion-y-garantia': {
    title: 'Devolución y garantía',
    description: 'Garantía legal de 6 meses y derecho a retracto de 10 días en compras online.',
    draft: true,
  },
  'terminos-y-condiciones': {
    title: 'Términos y condiciones',
    description:
      'Condiciones de compra en la tienda online de Recutex: pagos, despacho, retracto y garantía.',
    draft: true,
  },
  'politica-de-privacidad': {
    title: 'Política de privacidad',
    description: 'Qué datos personales trata Recutex, para qué y cómo ejercer tus derechos.',
    draft: true,
  },
};

export const shipping = {
  // Times from /pages/consultas-frecuentes. Recutex has not published shipping rates: flagged as pending.
  times: [
    'Muebles de metal-madera y productos textiles: 20 días hábiles.',
    'Muebles de madera: 25 días hábiles.',
  ],
  note: 'Costo de despacho: pendiente de definir con Recutex (demo).',
};

export const regions = [
  'Arica y Parinacota',
  'Tarapacá',
  'Antofagasta',
  'Atacama',
  'Coquimbo',
  'Valparaíso',
  'Metropolitana de Santiago',
  "Libertador General Bernardo O'Higgins",
  'Maule',
  'Ñuble',
  'Biobío',
  'La Araucanía',
  'Los Ríos',
  'Los Lagos',
  'Aysén del General Carlos Ibáñez del Campo',
  'Magallanes y de la Antártica Chilena',
];
