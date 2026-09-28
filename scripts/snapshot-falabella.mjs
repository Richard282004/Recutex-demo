// Snapshot of the products Recutex itself sells on Falabella
// (https://www.falabella.com/falabella-cl/brand/RECUTEX). Writes two files read by src/lib/catalog.ts:
//
//   data/product-images.json     newer photos for products that already exist in the catalog
//   data/falabella-products.json products that exist only on Falabella, added to the demo catalog
//
// Only the public listing is read (name, price, photos, colours); product pages are protected against
// automated access and are not scraped, so these products have no description. Only listings sold by
// the seller "Recutex" are accepted. Demo only: production loads the catalog from Recutex's own data.
//
//   npm run falabella:snapshot
import { writeFileSync } from 'node:fs';

const LISTING = 'https://www.falabella.com/falabella-cl/brand/RECUTEX';
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/128 Safari/537.36';

/*
  Falabella listings that are the same product as one already in the catalog (same model; checked by
  name, price and photos). They are not added again. `photos: true` also replaces the catalog photos
  with Falabella's newer ones: only where model, colour and set were verified visually.
*/
const EXISTING = {
  153978315: { handle: 'cama-alta-luna', photos: true },
  153977932: { handle: 'cama-alta-luna' },
  138829588: { handle: 'camarote-familiar', photos: true },
  138864784: { handle: 'camarote-familiar' },
  147656523: {
    handle: [
      'colchon-constellation-resorte-1-plaza',
      'colchon-constellation-resorte-1-5-plaza',
      'colchon-constellation-resorte-2-plaza',
      'colchon-constellation-resorte-king',
    ],
    photos: true,
  },
  147656951: { handle: 'colchon-constellation-resorte-super-king', photos: true },
  147655861: { handle: 'colchon-constellation-resorte-1-plaza' },
  147656562: { handle: 'colchon-constellation-resorte-2-plaza' },
  141402277: { handle: 'colchon-plus-resorte-1-plaza', photos: true },
  141402134: { handle: 'colchon-plus-resorte-1-5-plaza', photos: true },
  141401867: {
    handle: ['colchon-plus-resorte-2-plaza', 'colchon-plus-resorte-king', 'colchon-plus-resorte-super-king'],
    photos: true,
  },
  147226429: { handle: 'sofa-futon-folk-2-cpos-chocolate', photos: true },
  158034407: { handle: 'sillon-cama-folknegro' },
  147575961: { handle: 'camarote-media-luna', photos: true },
  147573080: { handle: 'camarote-media-luna' },
  147228620: { handle: 'camarote-desmontable-patagonia-1-plaza', photos: true },
  147228471: { handle: 'camarote-desmontable-metal-madera', photos: true },
  147191278: { handle: 'futon-metal-madera-rojo', photos: true },
  147199120: { handle: 'futon-metal-madera-rojo' },
  147249572: { handle: 'cama-alta-pucon-1-1-2-plaza', photos: true },
  147238978: { handle: 'cama-alta-pucon-1-1-2-plaza' },
  138034050: { handle: 'comedor-ranco-4-sillas-chocolate', photos: true },
  138029885: { handle: 'comedor-ranco-6-sillas-chocolate' },
  156716364: { handle: 'juego-de-comedor-bar-style' },
  147843583: { handle: 'sofa-cama-de-espuma-190x150-2-plazas' },
  157989614: { handle: 'sofa-cama-de-espuma-190x130' },
  145306366: { handle: 'sofa-cama-de-espuma-190x65' },
  144485246: { handle: 'sofa-cama-de-espuma-190x75-1' },
  143336672: { handle: 'sofa-cama-de-espuma-190x90-1-plaza' },
  143299933: { handle: 'sofa-cama-de-espuma-190x75' },
  157658747: { handle: 'sofa-cama-espuma-grey-premium-190x150x18-2-plazas' },
};

// Catalog collections by product type, in order of precedence.
// Matched against the title without accents (JavaScript's \b does not treat "á" as a letter).
const COLLECTION_RULES = [
  [/\bsillon\b/i, ['sillon-futon', 'sala-de-estar']],
  [/\bfuton\b/i, ['futones', 'sala-de-estar']],
  [/\bsofa\b/i, ['sofas', 'sala-de-estar']],
  [/\bcomedor\b/i, ['comedores']],
  [/\bbanca\b/i, ['sala-de-estar']],
  [/\bcamarote\b/i, ['camarotes', 'dormitorio-1']],
  [/\b(colchon|colchoneta)\b/i, ['colchones', 'dormitorio-1']],
  [/\b(cama|catre|base)\b/i, ['dormitorio', 'dormitorio-1']],
];

// Falabella's default order is not stable between pages, so one pass can skip products. Read the
// listing with several orders until every product the listing reports has been seen.
const SORTS = [
  '',
  'derived.price.search,asc',
  'derived.price.search,desc',
  'product.attribute.newIconExpiryDate,desc',
];

async function listing() {
  const byId = new Map();
  let expected = 0;
  for (const sort of SORTS) {
    for (let page = 1; page <= 10; page += 1) {
      const query = `page=${page}${sort ? `&sortBy=${sort}` : ''}`;
      const response = await fetch(`${LISTING}?${query}`, { headers: { 'User-Agent': USER_AGENT } });
      if (!response.ok) throw new Error(`Listing ${query}: HTTP ${response.status}`);
      const json = (await response.text()).match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s)?.[1];
      if (!json) throw new Error(`Listing ${query}: no product data`);
      const { results = [], pagination } = JSON.parse(json).props.pageProps;
      for (const r of results) byId.set(r.productId, r);
      expected = pagination?.count ?? expected;
      await new Promise((resolve) => setTimeout(resolve, 1500)); // be gentle with the source
      if (!pagination || !results.length || page * pagination.perPage >= pagination.count) break;
    }
    if (byId.size >= expected) break;
  }
  if (byId.size < expected)
    throw new Error(`Listing reports ${expected} products but only ${byId.size} were read`);
  console.log(`Listing: ${byId.size} products`);
  return [...byId.values()];
}

// Reads width/height from the JPEG SOF marker (first bytes only), so no image library is needed.
function jpegSize(buffer) {
  let i = 2;
  while (i + 9 < buffer.length) {
    const marker = buffer[i + 1];
    const length = buffer.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: buffer.readUInt16BE(i + 5), width: buffer.readUInt16BE(i + 7) };
    }
    i += 2 + length;
  }
  return null;
}

// Largest rendition served by the CDN; the image loader asks for smaller widths.
async function image(url) {
  const src = url.replace(/\/public$/, '');
  const response = await fetch(`${src}/width=1600`, {
    headers: { 'User-Agent': USER_AGENT, Range: 'bytes=0-65535' },
  });
  // Some listings reference photos the CDN no longer serves: skip them.
  if (!response.ok) return null;
  const size = jpegSize(Buffer.from(await response.arrayBuffer()));
  return size ? { src, ...size } : null;
}

async function images(urls) {
  const found = [];
  for (const url of urls) {
    const img = await image(url);
    if (img) found.push(img);
    else console.warn(`  skipped missing photo ${url}`);
  }
  return found;
}

const price = (item, type) => {
  const entry = item.prices.find((p) => p.type === type);
  return entry ? Number(entry.price[0].replace(/\./g, '')) : null;
};

// Falabella writes sizes as "1PZA", "15PZA", "1.5P", "2PZAS"; normalise to the catalog's labels.
function normaliseTitle(name) {
  return name
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ' ')
    .replace(/\b1[.,]?5\s*(PZAS?|PLZA|PLAZAS?|P)\b/gi, '1.5 plazas')
    .replace(/\b1\s*(PZAS?|PLZA|PLAZAS?|P)\b/gi, '1 plaza')
    .replace(/\b2(?:[.,]0)?\s*(PZAS?|PLZA|PLAZAS?|P)\b/gi, '2 plazas')
    .replace(/\b(\d)\s*y\s*1[.,]5\s*plazas\b/gi, '$1 y 1.5 plazas')
    .replace(/(\d)\s*[xX]\s*(?=\d)/g, '$1x')
    .replace(/(\d)\s*CM\b/gi, '$1 cm')
    .trim();
}

function detectSizes(title) {
  const t = title.toLowerCase();
  const sizes = [];
  if (/super\s*king/.test(t)) sizes.push('Super King');
  else if (/\bking\b/.test(t)) sizes.push('King');
  if (/1\.5 plazas/.test(t)) sizes.push('1.5 plazas');
  if (/\b2( plazas| y)/.test(t)) sizes.push('2 plazas');
  if (/\b1 plaza\b/.test(t)) sizes.push('1 plaza');
  return sizes;
}

function withoutAccents(text) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/\./g, '-')
    .replace(/^-+|-+$/g, '');
}

const takenAt = new Date().toISOString();
const items = await listing();
const overrides = {};
const products = [];
const handles = new Set();

for (const item of items) {
  if (item.sellerName !== 'Recutex') {
    console.warn(`skip ${item.productId}: seller ${item.sellerName}`);
    continue;
  }

  const existing = EXISTING[item.productId];
  if (existing) {
    if (existing.photos) {
      const photos = await images(item.mediaUrls ?? []);
      for (const handle of [existing.handle].flat()) overrides[handle] = { source: item.url, images: photos };
    }
    continue;
  }

  const title = normaliseTitle(item.displayName);
  let handle = slugify(title);
  while (handles.has(handle)) handle += '-2';
  handles.add(handle);

  const current = price(item, 'eventPrice') ?? price(item, 'internetPrice') ?? price(item, 'normalPrice');
  if (!current) {
    console.warn(`skip ${item.productId}: no price`);
    continue;
  }

  // Colour variants come with their own photos; products without colours get a single variant.
  const colours = item.variants?.find((v) => v.type === 'COLOR')?.options ?? [];
  const gallery = await images(item.mediaUrls ?? []);
  const variants = [];
  for (const option of colours) {
    const own = option.mediaUrls?.length ? await image(option.mediaUrls[0]) : null;
    if (own && !gallery.some((g) => g.src === own.src)) gallery.push(own);
    variants.push({
      id: `fal-${option.offeringId ?? option.variant}`,
      title: option.label,
      options: [option.label],
      price: current,
      compareAtPrice: null,
      available: option.isPurchaseable !== false,
      sku: null,
      image: own?.src ?? null,
    });
  }
  if (!variants.length) {
    variants.push({
      id: `fal-${item.offeringId ?? item.skuId}`,
      title: 'Default Title',
      options: ['Default Title'],
      price: current,
      compareAtPrice: null,
      available: true,
      sku: null,
      image: null,
    });
  }
  if (!gallery.length) {
    console.warn(`skip ${item.productId}: no photos`);
    continue;
  }

  products.push({
    id: `fal-${item.productId}`,
    handle,
    title,
    descriptionHtml: '',
    description: '',
    vendor: 'Recutex',
    type: null,
    tags: ['falabella'],
    collections: COLLECTION_RULES.find(([re]) => re.test(withoutAccents(title)))?.[1] ?? [],
    sizes: detectSizes(title),
    images: gallery.map((g) => ({ ...g, alt: title })),
    options: colours.length ? [{ name: 'Color', values: colours.map((o) => o.label) }] : [],
    variants,
    priceMin: current,
    priceMax: current,
    available: variants.some((v) => v.available),
    // Falabella's crossed "normal price" is a marketplace reference, not a Recutex discount: not used.
    onSale: false,
    createdAt: takenAt,
    source: item.url,
  });
  console.log(`+ ${handle} ${current} (${variants.length} variants, ${gallery.length} photos)`);
}

const write = (file, data) =>
  writeFileSync(new URL(`../data/${file}`, import.meta.url), JSON.stringify(data, null, 2) + '\n');
write('product-images.json', { source: LISTING, takenAt, products: overrides });
write('falabella-products.json', { source: LISTING, takenAt, products });
console.log(`\n${products.length} products added, ${Object.keys(overrides).length} photo overrides`);
