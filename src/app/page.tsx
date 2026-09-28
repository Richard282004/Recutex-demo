import {
  Benefits,
  CollectionRail,
  CollectionTiles,
  Editorial,
  Hero,
  Newsletter,
} from '@/components/home/sections';
import { home, site } from '@/content/site';

export default function HomePage() {
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.legalName,
    url: site.url,
    email: site.contact.email,
    telephone: site.contact.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Cauquenes 6609',
      addressLocality: 'Cerro Navia',
      addressRegion: 'Santiago',
      addressCountry: 'CL',
    },
  };

  return (
    <>
      <Hero
        title={home.hero.title}
        subtitle={home.hero.subtitle}
        productHandle={home.hero.product}
        primary={home.hero.primary}
        secondary={home.hero.secondary}
      />
      <CollectionTiles items={home.categories} />
      <CollectionRail
        id="offers"
        title="Ofertas"
        subtitle="Productos con precio rebajado."
        collection="ofertas"
        tinted
        linkLabel="Ver todas las ofertas"
      />
      <CollectionRail id="featured" title="Destacados" collection="home" layout="grid" limit={8} />
      <Editorial
        title={home.story.title}
        text={home.story.text}
        productHandle={home.story.product}
        cta={home.story.cta}
      />
      <CollectionRail
        id="mattresses"
        title="Colchones"
        subtitle="Resortes y espuma, de 1 plaza a Super King."
        collection="colchones"
      />
      <CollectionRail id="beds" title="Camas" collection="dormitorio" />
      <CollectionRail
        id="living"
        title="Living"
        subtitle="Sofás cama, futones y sillones."
        collection="sala-de-estar"
        tinted
      />
      <Benefits items={home.benefits} />
      <CollectionRail
        id="bunks"
        title="Camarotes"
        subtitle="Dos camas en el espacio de una."
        collection="camarotes"
      />
      <Newsletter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
    </>
  );
}
