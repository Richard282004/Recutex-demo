/*
  Shared listing for collection and search pages: toolbar (filter button, count, sort),
  filters (sidebar on desktop, bottom sheet on mobile), active filter chips and grid.
  All state lives in the URL (?medida=&min=&max=&ofertas=&orden=), so results are shareable
  and server-rendered; the client only navigates.
*/
import Link from 'next/link';
import { applyFilters, getFacets, parseFilters, sortProducts } from '@/lib/catalog';
import { formatPrice } from '@/lib/format';
import type { Product, SortKey } from '@/lib/types';
import { Icon } from '../Icon';
import { ProductCard } from '../ProductCard';
import { FiltersSheet, FiltersSidebar, SortSelect } from './Filters';

type Params = Record<string, string | string[] | undefined>;

const SORT_KEYS: SortKey[] = ['relevancia', 'precio-asc', 'precio-desc', 'nombre', 'nuevos'];

function hrefWithout(basePath: string, params: Params, key: string, value?: string) {
  const next = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    for (const item of Array.isArray(v) ? v : v ? [v] : []) {
      if (k === key && (value === undefined || item === value)) continue;
      next.append(k, item);
    }
  }
  const query = next.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function ProductListing({
  products,
  params,
  basePath,
}: {
  products: Product[];
  params: Params;
  basePath: string;
}) {
  const filters = parseFilters(params);
  const sortParam = Array.isArray(params.orden) ? params.orden[0] : params.orden;
  const sort = SORT_KEYS.includes(sortParam as SortKey) ? (sortParam as SortKey) : 'relevancia';
  const facets = getFacets(products);
  const results = sortProducts(applyFilters(products, filters), sort);
  const activeCount = filters.sizes.length + (filters.min || filters.max ? 1 : 0) + (filters.ofertas ? 1 : 0);
  const keep: Record<string, string> = params.q
    ? { q: Array.isArray(params.q) ? params.q[0] : params.q }
    : {};
  const keepOnClear = { ...keep, ...(sort !== 'relevancia' ? { orden: sort } : {}) };

  return (
    <div className="collection__layout">
      <FiltersSidebar facets={facets} filters={filters} activeCount={activeCount} keep={keepOnClear} />
      <div className="collection__toolbar">
        <FiltersSheet facets={facets} filters={filters} activeCount={activeCount} keep={keepOnClear} />
        <p className="collection__count" aria-live="polite">
          {results.length} {results.length === 1 ? 'producto' : 'productos'}
        </p>
        <SortSelect value={sort} />
      </div>

      <div className="collection__results">
        {activeCount > 0 && (
          <ul className="active-filters" role="list">
            {filters.sizes.map((size) => (
              <li key={size}>
                <Link
                  className="chip chip--active"
                  href={hrefWithout(basePath, params, 'medida', size)}
                  scroll={false}
                >
                  {size}
                  <Icon name="close" />
                  <span className="visually-hidden">Quitar filtro</span>
                </Link>
              </li>
            ))}
            {(filters.min || filters.max) && (
              <li>
                <Link
                  className="chip chip--active"
                  href={hrefWithout(basePath, { ...params, max: undefined }, 'min')}
                  scroll={false}
                >
                  {formatPrice(filters.min ?? 0)} – {formatPrice(filters.max ?? facets.priceMax)}
                  <Icon name="close" />
                  <span className="visually-hidden">Quitar filtro</span>
                </Link>
              </li>
            )}
            {filters.ofertas && (
              <li>
                <Link
                  className="chip chip--active"
                  href={hrefWithout(basePath, params, 'ofertas')}
                  scroll={false}
                >
                  En oferta
                  <Icon name="close" />
                  <span className="visually-hidden">Quitar filtro</span>
                </Link>
              </li>
            )}
          </ul>
        )}

        {results.length > 0 ? (
          <>
            <h2 className="visually-hidden">Productos</h2>
            <ul className="product-grid" role="list">
              {results.map((product, index) => (
                <li key={product.id}>
                  <ProductCard product={product} priority={index < 4} />
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="empty-state collection__empty">
            <p>Ningún producto coincide con estos filtros.</p>
            <Link className="button" href={basePath + (keep.q ? `?q=${encodeURIComponent(keep.q)}` : '')}>
              Limpiar filtros
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
