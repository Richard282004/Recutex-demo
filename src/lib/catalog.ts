/*
  Catalog data access. Reads PostgreSQL (db/schema.sql, loaded by `npm run db:seed`); every page goes
  through these functions, so a future admin/CMS only has to write to the same tables.

  The whole catalog is small (~150 products), so it is loaded in one go and kept in memory for a
  short time: pages stay fast and edits in the database show up within CACHE_MS.
*/
import 'server-only';
import { connection } from 'next/server';
import { db } from './db';
import type { Collection, Product, SortKey } from './types';

const CACHE_MS = 60_000;

type Catalog = { products: Product[]; collections: Collection[]; byHandle: Map<string, Product> };
let cached: { at: number; catalog: Promise<Catalog> } | undefined;

async function queryCatalog(): Promise<Catalog> {
  const sql = db();
  const [productRows, collectionRows, links, images, variants] = await Promise.all([
    sql`SELECT * FROM products ORDER BY position`,
    sql`SELECT * FROM collections ORDER BY position`,
    sql`SELECT product_id, collection_handle FROM product_collections`,
    sql`SELECT product_id, src, width, height, alt FROM product_images ORDER BY product_id, position`,
    sql`SELECT * FROM variants ORDER BY product_id, position`,
  ]);

  const group = <T extends { product_id: string }>(rows: readonly T[]) => {
    const map = new Map<string, T[]>();
    for (const row of rows) map.set(row.product_id, [...(map.get(row.product_id) ?? []), row]);
    return map;
  };
  const linksBy = group(links as unknown as { product_id: string; collection_handle: string }[]);
  const imagesBy = group(
    images as unknown as { product_id: string; src: string; width: number; height: number; alt: string }[],
  );
  const variantsBy = group(variants as unknown as ({ product_id: string } & Record<string, unknown>)[]);

  const products: Product[] = productRows.map((p) => ({
    id: p.id,
    handle: p.handle,
    title: p.title,
    descriptionHtml: p.description_html,
    description: p.description,
    vendor: p.vendor,
    type: p.type,
    tags: p.tags,
    collections: (linksBy.get(p.id) ?? []).map((l) => l.collection_handle),
    sizes: p.sizes,
    images: (imagesBy.get(p.id) ?? []).map(({ src, width, height, alt }) => ({ src, width, height, alt })),
    options: p.options,
    variants: (variantsBy.get(p.id) ?? []).map((v) => ({
      id: v.id as string,
      title: v.title as string,
      options: v.options as string[],
      price: v.price as number,
      compareAtPrice: (v.compare_at_price as number | null) ?? null,
      available: v.available as boolean,
      sku: (v.sku as string | null) ?? null,
      image: (v.image as string | null) ?? null,
    })),
    priceMin: p.price_min,
    priceMax: p.price_max,
    available: p.available,
    onSale: p.on_sale,
    createdAt: new Date(p.created_at).toISOString(),
    source: p.source_url ?? undefined,
  }));

  const collections: Collection[] = collectionRows.map((c) => ({
    handle: c.handle,
    title: c.title,
    description: c.description,
    image: c.image,
  }));

  return { products, collections, byHandle: new Map(products.map((p) => [p.handle, p])) };
}

async function catalog(): Promise<Catalog> {
  // Request-time data: never prerender catalog pages at build time (the build has no database).
  await connection();
  if (!cached || Date.now() - cached.at > CACHE_MS) {
    const promise = queryCatalog();
    cached = { at: Date.now(), catalog: promise };
    // A failed query must not stay cached.
    promise.catch(() => {
      if (cached?.catalog === promise) cached = undefined;
    });
  }
  return cached.catalog;
}

export async function getProducts(): Promise<Product[]> {
  return (await catalog()).products;
}

export async function getProduct(handle: string): Promise<Product | undefined> {
  return (await catalog()).byHandle.get(handle);
}

export async function getCollections(): Promise<Collection[]> {
  return (await catalog()).collections;
}

export async function getCollection(handle: string): Promise<Collection | undefined> {
  return (await catalog()).collections.find((c) => c.handle === handle);
}

export async function getCollectionProducts(handle: string): Promise<Product[]> {
  return (await catalog()).products.filter((p) => p.collections.includes(handle));
}

export async function findVariant(variantId: string) {
  for (const product of (await catalog()).products) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (variant) return { product, variant };
  }
  return undefined;
}

/* ---------- Filtering & sorting (collection and search pages) ---------- */

export type Filters = { sizes: string[]; min?: number; max?: number; ofertas?: boolean };

export function parseFilters(params: Record<string, string | string[] | undefined>): Filters {
  const list = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []);
  const num = (v: string | string[] | undefined) => {
    const n = Number(Array.isArray(v) ? v[0] : v);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };
  return {
    sizes: list(params.medida),
    min: num(params.min),
    max: num(params.max),
    ofertas: params.ofertas === '1',
  };
}

export function applyFilters(items: Product[], filters: Filters): Product[] {
  return items.filter(
    (p) =>
      (filters.sizes.length === 0 || p.sizes.some((s) => filters.sizes.includes(s))) &&
      (filters.min === undefined || p.priceMax >= filters.min) &&
      (filters.max === undefined || p.priceMin <= filters.max) &&
      (!filters.ofertas || p.onSale),
  );
}

export function sortProducts(items: Product[], sort: SortKey = 'relevancia'): Product[] {
  const copy = [...items];
  switch (sort) {
    case 'precio-asc':
      return copy.sort((a, b) => a.priceMin - b.priceMin);
    case 'precio-desc':
      return copy.sort((a, b) => b.priceMin - a.priceMin);
    case 'nombre':
      return copy.sort((a, b) => a.title.localeCompare(b.title, 'es'));
    case 'nuevos':
      return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    default:
      return copy;
  }
}

/** Facet values available within a product set (only real values, with counts). */
export function getFacets(items: Product[]) {
  const sizeOrder = ['1 plaza', '1.5 plazas', '2 plazas', 'King', 'Super King'];
  const sizes = sizeOrder
    .map((size) => ({ value: size, count: items.filter((p) => p.sizes.includes(size)).length }))
    .filter((s) => s.count > 0);
  const prices = items.map((p) => p.priceMin);
  return {
    sizes,
    priceMin: prices.length ? Math.min(...prices) : 0,
    priceMax: prices.length ? Math.max(...items.map((p) => p.priceMax)) : 0,
    onSaleCount: items.filter((p) => p.onSale).length,
  };
}

/* ---------- Search (accent-insensitive, weighted) ---------- */

const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9.\s]/g, ' ');

export async function searchProducts(query: string): Promise<Product[]> {
  const { products } = await catalog();
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const scored = products.map((p) => {
    const title = normalize(p.title);
    const meta = normalize([p.type, ...p.tags, ...p.collections, ...p.sizes].join(' '));
    const body = normalize(p.description);
    let score = 0;
    for (const term of terms) {
      const stem = term.length > 4 ? term.replace(/(es|s)$/, '') : term;
      if (title.includes(stem)) score += 5;
      else if (meta.includes(stem)) score += 3;
      else if (body.includes(stem)) score += 1;
      else return { p, score: 0 };
    }
    return { p, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.p);
}

export async function searchCollections(query: string): Promise<Collection[]> {
  const q = normalize(query).trim();
  if (!q) return [];
  const { collections } = await catalog();
  return collections.filter((c) => normalize(c.title).includes(q) || q.includes(normalize(c.title)));
}
