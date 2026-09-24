// Builds demo/products.csv (Shopify product import format) from the PUBLIC catalog of the
// current Recutex store, so a separate development store can show the new theme with real data.
// Read-only: only GETs public storefront JSON. Nothing is written to the Recutex store.
//
// Collection membership is encoded as tags (`col-<handle>`) and on-sale products get `oferta`,
// so automated collections in the demo store reproduce the original ones (see seed-store.mjs).
import { mkdirSync, writeFileSync } from 'node:fs';

const SOURCE = process.env.DEMO_SOURCE_STORE ?? 'https://recutex.myshopify.com';
export const COLLECTIONS = [
  'colchones',
  'camarotes',
  'dormitorio',
  'dormitorio-1',
  'comedores',
  'sofas',
  'sillon-futon',
  'futones',
  'espuma',
  'home',
];

async function getJSON(path) {
  const response = await fetch(`${SOURCE}${path}`, { headers: { 'User-Agent': 'recutex-demo-builder' } });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json();
}

async function allProducts(base) {
  const products = [];
  for (let page = 1; ; page += 1) {
    const { products: batch } = await getJSON(`${base}?limit=250&page=${page}`);
    products.push(...batch);
    if (batch.length < 250) return products;
  }
}

const csvCell = (value) => {
  const text = value === undefined || value === null ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

const HEADERS = [
  'Handle',
  'Title',
  'Body (HTML)',
  'Vendor',
  'Type',
  'Tags',
  'Published',
  'Option1 Name',
  'Option1 Value',
  'Option2 Name',
  'Option2 Value',
  'Option3 Name',
  'Option3 Value',
  'Variant SKU',
  'Variant Grams',
  'Variant Inventory Tracker',
  'Variant Inventory Policy',
  'Variant Fulfillment Service',
  'Variant Price',
  'Variant Compare At Price',
  'Variant Requires Shipping',
  'Variant Taxable',
  'Image Src',
  'Image Position',
  'Image Alt Text',
  'Variant Image',
  'Status',
];

async function main() {
  const products = await allProducts('/products.json');
  const membership = new Map();
  for (const handle of COLLECTIONS) {
    for (const product of await allProducts(`/collections/${handle}/products.json`)) {
      if (!membership.has(product.handle)) membership.set(product.handle, new Set());
      membership.get(product.handle).add(handle);
    }
  }

  const rows = [HEADERS];
  let onSale = 0;
  for (const product of products) {
    const sale = product.variants.some((v) => v.compare_at_price && Number(v.compare_at_price) > Number(v.price));
    if (sale) onSale += 1;
    const tags = [
      ...product.tags,
      ...[...(membership.get(product.handle) ?? [])].map((handle) => `col-${handle}`),
      ...(sale ? ['oferta'] : []),
    ];
    const imageById = new Map(product.images.map((image) => [image.id, image]));
    const optionNames = product.options.map((option) => option.name);
    const rowCount = Math.max(product.variants.length, product.images.length);

    for (let i = 0; i < rowCount; i += 1) {
      const variant = product.variants[i];
      const image = product.images[i];
      const first = i === 0;
      const row = Object.fromEntries(HEADERS.map((header) => [header, '']));
      row.Handle = product.handle;

      if (first) {
        Object.assign(row, {
          Title: product.title,
          'Body (HTML)': product.body_html,
          Vendor: product.vendor,
          Type: product.product_type,
          Tags: tags.join(', '),
          Published: 'TRUE',
          Status: 'active',
        });
      }

      if (variant) {
        [1, 2, 3].forEach((n) => {
          const value = variant[`option${n}`];
          if (value === null || value === undefined) return;
          if (first) row[`Option${n} Name`] = optionNames[n - 1];
          row[`Option${n} Value`] = value;
        });
        Object.assign(row, {
          'Variant SKU': variant.sku,
          'Variant Grams': variant.grams,
          'Variant Inventory Policy': 'deny',
          'Variant Fulfillment Service': 'manual',
          'Variant Price': variant.price,
          'Variant Compare At Price': variant.compare_at_price ?? '',
          'Variant Requires Shipping': variant.requires_shipping ? 'TRUE' : 'FALSE',
          'Variant Taxable': variant.taxable ? 'TRUE' : 'FALSE',
          'Variant Image': variant.featured_image?.src ?? imageById.get(variant.image_id)?.src ?? '',
        });
      }

      if (image) {
        Object.assign(row, {
          'Image Src': image.src,
          'Image Position': image.position,
          'Image Alt Text': image.alt ?? product.title,
        });
      }

      rows.push(HEADERS.map((header) => row[header]));
    }
  }

  mkdirSync('demo', { recursive: true });
  writeFileSync('demo/products.csv', rows.map((row) => row.map(csvCell).join(',')).join('\n') + '\n');
  console.log(`demo/products.csv: ${products.length} products, ${rows.length - 1} rows, ${onSale} on sale.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
