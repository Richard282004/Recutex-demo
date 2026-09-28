// Loads the demo catalog into PostgreSQL and downloads every product photo to MEDIA_DIR, so the site
// no longer depends on Shopify's or Falabella's CDN at runtime.
//
//   docker compose up -d db
//   npm run db:seed
//
// Sources: data/catalog.json (Recutex's Shopify store), data/product-images.json (newer photos) and
// data/falabella-products.json (products only on Falabella). Idempotent: the catalog tables are
// replaced on every run and photos already on disk are not downloaded again (storage/media/manifest.json).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';
import sharp from 'sharp';

const root = new URL('..', import.meta.url).pathname;
const read = (file) => JSON.parse(readFileSync(path.join(root, file), 'utf8'));

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL is not set: copy .env.example to .env and set it.');
const MEDIA_DIR = path.resolve(root, process.env.MEDIA_DIR ?? 'storage/media');
const MANIFEST = path.join(MEDIA_DIR, 'manifest.json');
const USER_AGENT = 'recutex-demo-seed';
const EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' };

/* ---------- Catalog from the JSON snapshots ---------- */

const shopify = read('data/catalog.json');
const overrides = read('data/product-images.json').products;
const falabella = read('data/falabella-products.json').products;

const products = [
  ...shopify.products.map((p) => ({
    ...p,
    images: overrides[p.handle]?.images.map((i) => ({ ...i, alt: p.title })) ?? p.images,
    source: 'shopify',
    sourceUrl: null,
  })),
  ...falabella.map((p) => ({ ...p, source: 'falabella', sourceUrl: p.source })),
];

/* ---------- Photos ---------- */

// Best available rendition of each origin: Shopify serves the original without params,
// Falabella's CDN takes the size in the path (1600 returns the original when it is smaller).
function downloadUrl(src) {
  if (src.startsWith('https://media.falabella.com/')) return `${src}/width=1600`;
  return src;
}

const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
let downloaded = 0;

async function localImage(origin, dir, name) {
  if (manifest[origin] && existsSync(path.join(MEDIA_DIR, manifest[origin].file))) return manifest[origin];
  const response = await fetch(downloadUrl(origin), { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`${origin}: HTTP ${response.status}`);
  const type = response.headers.get('content-type')?.split(';')[0] ?? '';
  const ext = EXTENSIONS[type];
  if (!ext) throw new Error(`${origin}: unsupported type ${type}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  const { width, height } = await sharp(buffer).metadata();
  const file = `${dir}/${name}.${ext}`;
  mkdirSync(path.join(MEDIA_DIR, dir), { recursive: true });
  writeFileSync(path.join(MEDIA_DIR, file), buffer);
  manifest[origin] = { file, width, height };
  downloaded += 1;
  return manifest[origin];
}

// Small worker pool: fast enough, gentle with the origin CDNs.
async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i], i);
      }
    }),
  );
  return results;
}

const baseUrl = (url) => url.split('?')[0];
const mediaSrc = (file) => `/media/${file}`;

for (const product of products) {
  // A variant photo must be in the gallery so selecting the variant can show it.
  const gallery = [...product.images];
  for (const variant of product.variants) {
    if (variant.image && !gallery.some((i) => baseUrl(i.src) === baseUrl(variant.image))) {
      gallery.push({ src: variant.image, alt: product.title });
    }
  }
  const local = await mapLimit(gallery, 6, (image, i) =>
    localImage(image.src, `products/${product.handle}`, String(i + 1).padStart(2, '0')),
  );
  product.localImages = gallery.map((image, i) => ({
    src: mediaSrc(local[i].file),
    width: local[i].width,
    height: local[i].height,
    alt: image.alt || product.title,
    origin: image.src,
  }));
  const byOrigin = new Map(product.localImages.map((i) => [baseUrl(i.origin), i.src]));
  for (const variant of product.variants) {
    variant.localImage = variant.image ? byOrigin.get(baseUrl(variant.image)) : null;
  }
}

const collections = await mapLimit(shopify.collections, 4, async (c) => ({
  ...c,
  localImage: c.image ? mediaSrc((await localImage(c.image, 'collections', c.handle)).file) : null,
}));

mkdirSync(MEDIA_DIR, { recursive: true });
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');

/* ---------- Database ---------- */

const sql = postgres(DATABASE_URL, { max: 1, onnotice: () => {} });
try {
  await sql.unsafe(readFileSync(path.join(root, 'db/schema.sql'), 'utf8'));
  await sql.begin(async (tx) => {
    await tx`TRUNCATE collections, products CASCADE`;
    await tx`INSERT INTO collections ${tx(
      collections.map((c, i) => ({
        handle: c.handle,
        title: c.title,
        description: c.description,
        image: c.localImage,
        position: i,
      })),
    )}`;
    const known = new Set(collections.map((c) => c.handle));

    for (const [position, p] of products.entries()) {
      await tx`INSERT INTO products ${tx({
        id: p.id,
        handle: p.handle,
        title: p.title,
        description_html: p.descriptionHtml ?? '',
        description: p.description ?? '',
        vendor: p.vendor ?? 'Recutex',
        type: p.type,
        tags: p.tags,
        sizes: p.sizes,
        options: tx.json(p.options),
        price_min: p.priceMin,
        price_max: p.priceMax,
        available: p.available,
        on_sale: p.onSale,
        source: p.source,
        source_url: p.sourceUrl,
        position,
        created_at: p.createdAt,
      })}`;
      const links = p.collections.filter((h) => known.has(h));
      if (links.length) {
        await tx`INSERT INTO product_collections ${tx(links.map((h) => ({ product_id: p.id, collection_handle: h })))}`;
      }
      if (p.localImages.length) {
        await tx`INSERT INTO product_images ${tx(
          p.localImages.map((img, i) => ({
            product_id: p.id,
            position: i,
            src: img.src,
            width: img.width,
            height: img.height,
            alt: img.alt,
            origin_url: img.origin,
          })),
        )}`;
      }
      await tx`INSERT INTO variants ${tx(
        p.variants.map((v, i) => ({
          id: v.id,
          product_id: p.id,
          position: i,
          title: v.title,
          options: v.options,
          price: v.price,
          compare_at_price: v.compareAtPrice,
          available: v.available,
          sku: v.sku,
          image: v.localImage,
        })),
      )}`;
    }
  });
  const [{ count }] = await sql`SELECT count(*)::int AS count FROM products`;
  const [{ images }] = await sql`SELECT count(*)::int AS images FROM product_images`;
  console.log(`${count} products, ${images} photos, ${collections.length} collections in the database.`);
  console.log(`${downloaded} photos downloaded to ${path.relative(root, MEDIA_DIR)} (rest already on disk).`);
} finally {
  await sql.end();
}
