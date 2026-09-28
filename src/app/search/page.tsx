import type { Metadata } from 'next';
import Link from 'next/link';
import { ProductListing } from '@/components/collection/ProductListing';
import { site } from '@/content/site';
import { searchProducts } from '@/lib/catalog';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export const metadata: Metadata = {
  title: 'Buscar',
  robots: { index: false, follow: true },
};

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = (Array.isArray(params.q) ? params.q[0] : (params.q ?? '')).trim().slice(0, 80);
  const products = q ? await searchProducts(q) : [];

  return (
    <section className="section collection">
      <div className="page-width">
        <h1 className="collection__title">{q ? `Resultados para “${q}”` : 'Buscar'}</h1>
        <form className="search-form" action="/search" role="search">
          <label className="visually-hidden" htmlFor="SearchPageInput">
            Buscar
          </label>
          <input
            className="field__input"
            id="SearchPageInput"
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar en Recutex…"
          />
          <button className="button button--primary" type="submit">
            Buscar
          </button>
        </form>

        {q && products.length > 0 && (
          <ProductListing products={products} params={params} basePath="/search" />
        )}

        {q && products.length === 0 && (
          <div className="empty-state collection__empty">
            <p>
              No encontramos productos para “{q}”. Revisa la ortografía o prueba con una palabra más general.
            </p>
          </div>
        )}

        {(!q || products.length === 0) && (
          <div className="search-drawer__popular">
            <p className="search-drawer__label">Búsquedas populares</p>
            <ul className="chip-list" role="list">
              {site.popularSearches.map((term) => (
                <li key={term}>
                  <Link className="chip" href={`/search?q=${encodeURIComponent(term)}`}>
                    {term}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
