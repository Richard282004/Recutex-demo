'use client';

/*
  Search overlay with predictive results from /api/search (products + categories).
  Keyboard: arrows move through products, Enter opens the highlighted one or the full results page.
*/
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { site } from '@/content/site';
import { Drawer } from '../Drawer';
import { Icon } from '../Icon';

type Result = {
  products: {
    handle: string;
    title: string;
    image: string | null;
    price: string;
    compareAt: string | null;
  }[];
  collections: { handle: string; title: string }[];
  total: number;
};

export function SearchButton() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- close on navigation
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const term = query.trim();
    if (!term) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear results for empty query
      setResult(null);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });
        if (response.ok) {
          setResult(await response.json());
          setActive(-1);
        }
      } catch {
        // Aborted or offline: keep previous results.
      }
    }, 200);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const product = result?.products[active];
    if (product) router.push(`/products/${product.handle}`);
    else if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const count = result?.products.length ?? 0;
    if (!count || !['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    event.preventDefault();
    setActive((i) => (i + (event.key === 'ArrowDown' ? 1 : -1) + count) % count);
  };

  return (
    <>
      <button
        className="icon-button"
        type="button"
        aria-expanded={open}
        aria-controls="SearchDrawer"
        onClick={() => setOpen(true)}
      >
        <Icon name="search" />
        <span className="visually-hidden">Buscar</span>
      </button>
      <Drawer
        id="SearchDrawer"
        open={open}
        onClose={() => setOpen(false)}
        side="top"
        title="Buscar"
        hideHeader
        panelClassName="search-drawer"
        initialFocus={inputRef}
      >
        <div className={`page-width search-drawer__inner${result ? ' has-results' : ''}`}>
          <form className="search-drawer__form" role="search" action="/search" onSubmit={submit}>
            <Icon name="search" />
            <label className="visually-hidden" htmlFor="PredictiveSearchInput">
              Buscar
            </label>
            <input
              ref={inputRef}
              className="search-drawer__input"
              id="PredictiveSearchInput"
              type="search"
              name="q"
              placeholder="Buscar en Recutex…"
              autoComplete="off"
              spellCheck={false}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onKeyDown}
              role="combobox"
              aria-expanded={Boolean(result)}
              aria-controls="PredictiveSearchResults"
              aria-activedescendant={active >= 0 ? `PredictiveOption-${active}` : undefined}
            />
            <button className="icon-button" type="button" onClick={() => setOpen(false)}>
              <Icon name="close" />
              <span className="visually-hidden">Cerrar</span>
            </button>
          </form>

          {!result && (
            <div className="search-drawer__popular">
              <p className="search-drawer__label">Búsquedas populares</p>
              <ul className="chip-list" role="list">
                {site.popularSearches.map((term) => (
                  <li key={term}>
                    <button className="chip" type="button" onClick={() => setQuery(term)}>
                      {term}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div id="PredictiveSearchResults" className="search-drawer__results" aria-live="polite">
            {result && (
              <div className="predictive-results">
                {result.total === 0 ? (
                  <p className="empty-state">
                    No encontramos resultados para “{query.trim()}”. Prueba con otra palabra.
                  </p>
                ) : (
                  <>
                    <div className="predictive-results__aside">
                      {result.collections.length > 0 && (
                        <div className="predictive-results__group">
                          <p className="search-drawer__label">Categorías</p>
                          <ul role="list" className="predictive-results__list">
                            {result.collections.map((c) => (
                              <li key={c.handle}>
                                <Link href={`/collections/${c.handle}`}>{c.title}</Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="predictive-results__products">
                      <p className="search-drawer__label">Productos</p>
                      <ul role="listbox" className="predictive-results__product-list">
                        {result.products.map((p, i) => (
                          <li
                            role="option"
                            id={`PredictiveOption-${i}`}
                            aria-selected={i === active}
                            key={p.handle}
                          >
                            <Link className="predictive-product" href={`/products/${p.handle}`}>
                              <span className="predictive-product__media">
                                {p.image && (
                                  <Image src={p.image} alt="" width={128} height={128} sizes="64px" />
                                )}
                              </span>
                              <span className="predictive-product__info">
                                <span className="predictive-product__title">{p.title}</span>
                                <span className={`price${p.compareAt ? ' price--on-sale' : ''}`}>
                                  <span className="price__current">{p.price}</span>
                                  {p.compareAt && <s className="price__compare">{p.compareAt}</s>}
                                </span>
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
                <Link
                  className="button button--small predictive-results__all"
                  href={`/search?q=${encodeURIComponent(query.trim())}`}
                >
                  Ver todos los resultados{result.total ? ` (${result.total})` : ''}
                </Link>
              </div>
            )}
          </div>
        </div>
      </Drawer>
    </>
  );
}
