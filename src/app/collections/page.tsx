import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { getCollectionProducts, getCollections } from '@/lib/catalog';

export const metadata: Metadata = {
  title: 'Categorías',
  description: 'Colchones, camas, camarotes, living, comedores y láminas de espuma Recutex.',
  alternates: { canonical: '/collections' },
};

export default async function CollectionsPage() {
  const collections = await Promise.all(
    (await getCollections())
      .filter((c) => c.handle !== 'home')
      .map(async (c) => {
        const products = await getCollectionProducts(c.handle);
        return { ...c, count: products.length, image: products.find((p) => p.images.length)?.images[0]?.src };
      }),
  );

  return (
    <section className="section">
      <div className="page-width">
        <Breadcrumbs items={[{ title: 'Categorías' }]} />
        <h1 className="page-title">Categorías</h1>
        <ul className="collection-list" role="list">
          {collections.map((c) => (
            <li key={c.handle} data-reveal>
              <Link className="collection-list__link" href={`/collections/${c.handle}`}>
                <span className="collection-list__media">
                  {c.image && <Image src={c.image} alt="" fill sizes="(min-width: 990px) 30vw, 48vw" />}
                </span>
                <span className="collection-list__title">{c.title}</span>
                <span className="collection-tile__count">
                  {c.count} {c.count === 1 ? 'producto' : 'productos'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
