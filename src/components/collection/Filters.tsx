'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import type { Filters } from '@/lib/catalog';
import { formatPrice } from '@/lib/format';
import { Drawer } from '../Drawer';
import { Icon } from '../Icon';

type Facets = {
  sizes: { value: string; count: number }[];
  priceMin: number;
  priceMax: number;
  onSaleCount: number;
};

const SORT_OPTIONS = [
  { value: 'relevancia', label: 'Destacados' },
  { value: 'precio-asc', label: 'Precio: menor a mayor' },
  { value: 'precio-desc', label: 'Precio: mayor a menor' },
  { value: 'nombre', label: 'Nombre A–Z' },
  { value: 'nuevos', label: 'Más nuevos' },
];

function useUrlUpdate() {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const navigate = (params: URLSearchParams) => {
    const query = params.toString();
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }));
  };
  return { navigate, pending };
}

export function SortSelect({ value }: { value: string }) {
  const searchParams = useSearchParams();
  const { navigate } = useUrlUpdate();
  return (
    <div className="collection__sort">
      <label className="collection__sort-label" htmlFor="SortBy">
        Ordenar por
      </label>
      <select
        className="field__input"
        id="SortBy"
        value={value}
        onChange={(event) => {
          const params = new URLSearchParams(searchParams);
          if (event.target.value === 'relevancia') params.delete('orden');
          else params.set('orden', event.target.value);
          navigate(params);
        }}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

type PanelProps = { facets: Facets; filters: Filters; activeCount: number; keep: Record<string, string> };

function FiltersBody({ facets, filters }: Pick<PanelProps, 'facets' | 'filters'>) {
  const [min, setMin] = useState(filters.min ? String(filters.min) : '');
  const [max, setMax] = useState(filters.max ? String(filters.max) : '');
  const searchParams = useSearchParams();
  const { navigate, pending } = useUrlUpdate();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- keep inputs in sync with the URL
    setMin(filters.min ? String(filters.min) : '');
    setMax(filters.max ? String(filters.max) : '');
  }, [filters.min, filters.max]);

  const toggleSize = (size: string) => {
    const params = new URLSearchParams(searchParams);
    const sizes = params.getAll('medida');
    params.delete('medida');
    (sizes.includes(size) ? sizes.filter((s) => s !== size) : [...sizes, size]).forEach((s) =>
      params.append('medida', s),
    );
    navigate(params);
  };

  const toggleOffers = () => {
    const params = new URLSearchParams(searchParams);
    if (params.get('ofertas') === '1') params.delete('ofertas');
    else params.set('ofertas', '1');
    navigate(params);
  };

  const applyPrice = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of [
      ['min', min],
      ['max', max],
    ] as const) {
      const n = Number(value.replace(/\D/g, ''));
      if (n > 0) params.set(key, String(n));
      else params.delete(key);
    }
    navigate(params);
  };

  return (
    <div className={`facets__body${pending ? ' is-loading' : ''}`}>
      {facets.sizes.length > 0 && (
        <details className="accordion facet" open>
          <summary>Medida{filters.sizes.length ? ` (${filters.sizes.length})` : ''}</summary>
          <div className="accordion__content">
            <ul className="facet__list" role="list">
              {facets.sizes.map((size) => (
                <li key={size.value}>
                  <label className="facet__option">
                    <input
                      type="checkbox"
                      checked={filters.sizes.includes(size.value)}
                      onChange={() => toggleSize(size.value)}
                    />
                    <span>{size.value}</span>
                    <span className="facet__count">{size.count}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </details>
      )}
      <details className="accordion facet" open>
        <summary>Precio</summary>
        <form className="accordion__content" onSubmit={applyPrice}>
          <div className="facet__price">
            <label className="field">
              <span className="field__label">Desde</span>
              <input
                className="field__input"
                inputMode="numeric"
                placeholder={formatPrice(facets.priceMin)}
                value={min}
                onChange={(event) => setMin(event.target.value)}
              />
            </label>
            <label className="field">
              <span className="field__label">Hasta</span>
              <input
                className="field__input"
                inputMode="numeric"
                placeholder={formatPrice(facets.priceMax)}
                value={max}
                onChange={(event) => setMax(event.target.value)}
              />
            </label>
          </div>
          <button className="button button--small facet__apply" type="submit">
            Aplicar precio
          </button>
        </form>
      </details>
      {facets.onSaleCount > 0 && (
        <details className="accordion facet" open>
          <summary>Promociones</summary>
          <div className="accordion__content">
            <label className="facet__option">
              <input type="checkbox" checked={Boolean(filters.ofertas)} onChange={toggleOffers} />
              <span>En oferta</span>
              <span className="facet__count">{facets.onSaleCount}</span>
            </label>
          </div>
        </details>
      )}
    </div>
  );
}

/** Desktop sidebar (hidden below 990px by CSS). */
export function FiltersSidebar({ facets, filters, activeCount, keep }: PanelProps) {
  const { navigate } = useUrlUpdate();
  return (
    <aside className="facets facets--sidebar" aria-label="Filtros">
      <FiltersBody facets={facets} filters={filters} />
      {activeCount > 0 && (
        <button
          className="button button--small facets__clear"
          type="button"
          onClick={() => navigate(new URLSearchParams(keep))}
        >
          Limpiar filtros
        </button>
      )}
    </aside>
  );
}

/** Mobile "Filtrar" button + bottom sheet (hidden from 990px by CSS). */
export function FiltersSheet({ facets, filters, activeCount, keep }: PanelProps) {
  const [open, setOpen] = useState(false);
  const { navigate } = useUrlUpdate();
  return (
    <>
      <button
        className="button button--small collection__filter-toggle"
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
      >
        <Icon name="filter" />
        Filtrar{activeCount > 0 ? ` (${activeCount})` : ''}
      </button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        side="bottom"
        title="Filtrar"
        className="facets-sheet"
        footer={
          <div className="facets__footer">
            <button
              className="button button--small"
              type="button"
              onClick={() => navigate(new URLSearchParams(keep))}
            >
              Limpiar filtros
            </button>
            <button
              className="button button--primary button--small"
              type="button"
              onClick={() => setOpen(false)}
            >
              Ver resultados
            </button>
          </div>
        }
      >
        <FiltersBody facets={facets} filters={filters} />
      </Drawer>
    </>
  );
}
