// Takes a read-only snapshot of the PUBLIC Recutex catalog (current Shopify storefront JSON)
// and normalises it into data/catalog.json for the demo storefront.
// In production this file is replaced by the real product database / admin.
import { writeFileSync } from 'node:fs';

const SOURCE = process.env.CATALOG_SOURCE ?? 'https://recutex.myshopify.com';

// Source collections to keep, with cleaned-up titles. Handles are preserved for SEO.
const COLLECTIONS = {
  colchones: 'Colchones',
  dormitorio: 'Camas',
  'dormitorio-1': 'Dormitorio',
  camarotes: 'Camarotes',
  comedores: 'Comedores',
  sofas: 'Sofás',
  'sillon-futon': 'Sillón futón',
  futones: 'Futones',
  espuma: 'Láminas de espuma',
  home: 'Destacados',
};

async function getJSON(path) {
  const response = await fetch(`${SOURCE}${path}`, { headers: { 'User-Agent': 'recutex-catalog-snapshot' } });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json();
}

async function paginate(path, key) {
  const items = [];
  for (let page = 1; ; page += 1) {
    const batch = (await getJSON(`${path}${path.includes('?') ? '&' : '?'}limit=250&page=${page}`))[key];
    items.push(...batch);
    if (batch.length < 250) return items;
  }
}

const toInt = (value) =>
  value === null || value === undefined || value === '' ? null : Math.round(Number(value));
const stripHtml = (html) =>
  (html ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Bed size parsed from real product titles/options (no invented data).
function detectSize(text) {
  const t = text.toLowerCase();
  if (/super\s*king/.test(t)) return 'Super King';
  if (/\bking\b/.test(t)) return 'King';
  if (/1[.,]5\s*plaza/.test(t)) return '1.5 plazas';
  if (/\b2\s*plaza/.test(t)) return '2 plazas';
  if (/\b1\s*plaza/.test(t)) return '1 plaza';
  return null;
}

function cleanDescription(html) {
  // Drop empty wrappers and inline styles pasted from other sites; keep semantic tags.
  return (html ?? '')
    .replace(/\sstyle="[^"]*"/g, '')
    .replace(/\sclass="[^"]*"/g, '')
    .replace(/<(div|span)>\s*<\/\1>/g, '')
    .trim();
}

async function main() {
  const [rawProducts, rawCollections] = await Promise.all([
    paginate('/products.json', 'products'),
    getJSON('/collections.json?limit=250').then((d) => d.collections),
  ]);

  const membership = new Map();
  for (const handle of Object.keys(COLLECTIONS)) {
    for (const product of await paginate(`/collections/${handle}/products.json`, 'products')) {
      if (!membership.has(product.handle)) membership.set(product.handle, []);
      membership.get(product.handle).push(handle);
    }
  }

  const products = rawProducts.map((p) => {
    const variants = p.variants.map((v) => ({
      id: String(v.id),
      title: v.title,
      options: [v.option1, v.option2, v.option3].filter((o) => o !== null && o !== undefined),
      price: toInt(v.price),
      compareAtPrice: toInt(v.compare_at_price) > toInt(v.price) ? toInt(v.compare_at_price) : null,
      available: Boolean(v.available),
      sku: v.sku || null,
      image: v.featured_image?.src ?? null,
    }));
    const prices = variants.map((v) => v.price);
    const collections = [...(membership.get(p.handle) ?? [])];
    const onSale = variants.some((v) => v.compareAtPrice);
    if (onSale) collections.push('ofertas');
    if (collections.some((c) => ['sofas', 'sillon-futon', 'futones'].includes(c)))
      collections.push('sala-de-estar');
    const sizes = [...new Set([p.title, ...variants.map((v) => v.title)].map(detectSize).filter(Boolean))];

    return {
      id: String(p.id),
      handle: p.handle,
      title: p.title,
      descriptionHtml: cleanDescription(p.body_html),
      description: stripHtml(p.body_html).slice(0, 300),
      vendor: p.vendor,
      type: (p.product_type || '').split('/').pop().trim() || null,
      tags: p.tags,
      collections,
      sizes,
      images: p.images.map((i) => ({ src: i.src, width: i.width, height: i.height, alt: i.alt || p.title })),
      options: p.options
        .filter((o) => !(o.name === 'Title' && o.values.length === 1 && o.values[0] === 'Default Title'))
        .map((o) => ({ name: o.name, values: o.values })),
      variants,
      priceMin: Math.min(...prices),
      priceMax: Math.max(...prices),
      available: variants.some((v) => v.available),
      onSale,
      createdAt: p.created_at,
    };
  });

  const byHandle = new Map(rawCollections.map((c) => [c.handle, c]));
  const collections = [
    ...Object.entries(COLLECTIONS).map(([handle, title]) => ({
      handle,
      title,
      description: stripHtml(byHandle.get(handle)?.body_html) || null,
      image: byHandle.get(handle)?.image?.src ?? null,
    })),
    { handle: 'ofertas', title: 'Ofertas', description: null, image: null },
    { handle: 'sala-de-estar', title: 'Living', description: null, image: null },
  ].filter((c) => products.some((p) => p.collections.includes(c.handle)));

  const snapshot = { source: SOURCE, takenAt: new Date().toISOString(), collections, products };
  writeFileSync('data/catalog.json', JSON.stringify(snapshot, null, 1) + '\n');
  console.log(
    `data/catalog.json: ${products.length} products, ${collections.length} collections, ` +
      `${products.filter((p) => p.onSale).length} on sale.`,
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
