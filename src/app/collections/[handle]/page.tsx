import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ProductListing } from '@/components/collection/ProductListing';
import { getCollection, getCollectionProducts } from '@/lib/catalog';

type Props = {
  params: Promise<{ handle: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const collection = await getCollection((await params).handle);
  if (!collection) return {};
  return {
    title: collection.title,
    description: collection.description ?? `${collection.title} de fabricación propia Recutex.`,
    // Filtered/sorted variants of the page canonicalise to the clean collection URL.
    alternates: { canonical: `/collections/${collection.handle}` },
  };
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const { handle } = await params;
  const collection = await getCollection(handle);
  if (!collection) notFound();

  return (
    <section className="section collection">
      <div className="page-width">
        <header className="collection__header">
          <Breadcrumbs items={[{ title: collection.title }]} />
          <h1 className="collection__title">{collection.title}</h1>
          {collection.description && <p className="collection__description">{collection.description}</p>}
        </header>
        <ProductListing
          products={await getCollectionProducts(handle)}
          params={await searchParams}
          basePath={`/collections/${handle}`}
        />
      </div>
    </section>
  );
}
