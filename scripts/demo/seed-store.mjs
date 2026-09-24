// Seeds a DEMO development store with the collections, pages and menus the theme expects.
// Products come from demo/products.csv (Admin → Products → Import); run this after importing.
//
// Safety: refuses to run against the real Recutex store. Idempotent: existing items (matched
// by handle) are left untouched, menus are overwritten.
//
// Env: SHOPIFY_DEMO_STORE (xxx.myshopify.com), SHOPIFY_ADMIN_TOKEN (shpat_...),
//      SHOPIFY_API_VERSION (optional, default below).
import { readFileSync } from 'node:fs';

const STORE = process.env.SHOPIFY_DEMO_STORE?.trim();
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN?.trim();
const API_VERSION = process.env.SHOPIFY_API_VERSION ?? '2026-07';
const PROTECTED_STORES = ['recutex.myshopify.com'];

const tagRule = (tag) => ({ column: 'TAG', relation: 'EQUALS', condition: tag });

const COLLECTIONS = [
  { handle: 'colchones', title: 'Colchones', rules: [tagRule('col-colchones')] },
  { handle: 'dormitorio', title: 'Camas', rules: [tagRule('col-dormitorio')] },
  { handle: 'dormitorio-1', title: 'Dormitorio', rules: [tagRule('col-dormitorio-1')] },
  { handle: 'camarotes', title: 'Camarotes', rules: [tagRule('col-camarotes')] },
  { handle: 'comedores', title: 'Comedores', rules: [tagRule('col-comedores')] },
  { handle: 'sofas', title: 'Sofás', rules: [tagRule('col-sofas')] },
  { handle: 'sillon-futon', title: 'Sillón futón', rules: [tagRule('col-sillon-futon')] },
  { handle: 'futones', title: 'Futones', rules: [tagRule('col-futones')] },
  { handle: 'espuma', title: 'Láminas de espuma', rules: [tagRule('col-espuma')] },
  { handle: 'home', title: 'Destacados', rules: [tagRule('col-home')] },
  { handle: 'ofertas', title: 'Ofertas', rules: [tagRule('oferta')] },
  {
    handle: 'sala-de-estar',
    title: 'Living',
    disjunctive: true,
    rules: [tagRule('col-sofas'), tagRule('col-sillon-futon'), tagRule('col-futones')],
  },
];

const PAGES = [
  { handle: 'nosotros', title: 'Nuestra historia' },
  { handle: 'devolucion-y-garantia', title: 'Devolución y garantía' },
  { handle: 'consultas-frecuentes', title: 'Preguntas frecuentes' },
];

// Menu items reference collections/pages by handle; resolved to IDs at runtime.
const MENUS = [
  {
    handle: 'main-menu',
    title: 'Menú principal',
    items: [
      {
        title: 'Dormitorio',
        collection: 'dormitorio-1',
        items: [
          {
            title: 'Colchones',
            collection: 'colchones',
            items: [
              { title: 'Resortes', url: '/search?q=colchon+resorte&type=product' },
              { title: 'Espuma', url: '/search?q=colchon+espuma&type=product' },
            ],
          },
          { title: 'Camas', collection: 'dormitorio' },
          { title: 'Camarotes', collection: 'camarotes' },
        ],
      },
      {
        title: 'Living',
        collection: 'sala-de-estar',
        items: [
          { title: 'Sofás', collection: 'sofas' },
          { title: 'Sillón futón', collection: 'sillon-futon' },
          { title: 'Futones', collection: 'futones' },
        ],
      },
      { title: 'Comedores', collection: 'comedores' },
      { title: 'Espumas', collection: 'espuma' },
      { title: 'Ofertas', collection: 'ofertas' },
      { title: 'Nosotros', page: 'nosotros' },
    ],
  },
  {
    handle: 'footer',
    title: 'Footer',
    items: [
      { title: 'Nuestra historia', page: 'nosotros' },
      { title: 'Preguntas frecuentes', page: 'consultas-frecuentes' },
      { title: 'Devolución y garantía', page: 'devolucion-y-garantia' },
    ],
  },
];

async function gql(query, variables = {}) {
  const response = await fetch(`https://${STORE}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': TOKEN },
    body: JSON.stringify({ query, variables }),
  });
  const json = await response.json();
  if (!response.ok || json.errors) throw new Error(JSON.stringify(json.errors ?? json, null, 2));
  return json.data;
}

function assertNoUserErrors(result, label) {
  const errors = result?.userErrors ?? [];
  if (errors.length) throw new Error(`${label}: ${errors.map((e) => e.message).join('; ')}`);
}

async function onlineStorePublicationId() {
  const data = await gql(`{ publications(first: 20) { nodes { id name } } }`);
  const publication = data.publications.nodes.find((p) => p.name === 'Online Store');
  if (!publication) throw new Error('Online Store publication not found (is the Online Store channel installed?).');
  return publication.id;
}

async function findCollection(handle) {
  const data = await gql(`query ($q: String!) { collections(first: 1, query: $q) { nodes { id handle } } }`, {
    q: `handle:${handle}`,
  });
  return data.collections.nodes.find((c) => c.handle === handle);
}

async function ensureCollections(publicationId) {
  const ids = {};
  for (const spec of COLLECTIONS) {
    const existing = await findCollection(spec.handle);
    if (existing) {
      ids[spec.handle] = existing.id;
      console.log(`= collection ${spec.handle}`);
      continue;
    }
    const data = await gql(
      `mutation ($input: CollectionInput!) {
        collectionCreate(input: $input) { collection { id } userErrors { field message } }
      }`,
      {
        input: {
          title: spec.title,
          handle: spec.handle,
          ruleSet: { appliedDisjunctively: Boolean(spec.disjunctive), rules: spec.rules },
        },
      },
    );
    assertNoUserErrors(data.collectionCreate, `collection ${spec.handle}`);
    const id = data.collectionCreate.collection.id;
    const published = await gql(
      `mutation ($id: ID!, $input: [PublicationInput!]!) {
        publishablePublish(id: $id, input: $input) { userErrors { field message } }
      }`,
      { id, input: [{ publicationId }] },
    );
    assertNoUserErrors(published.publishablePublish, `publish ${spec.handle}`);
    ids[spec.handle] = id;
    console.log(`+ collection ${spec.handle}`);
  }
  return ids;
}

async function ensurePages() {
  const ids = {};
  for (const spec of PAGES) {
    const found = await gql(`query ($q: String!) { pages(first: 1, query: $q) { nodes { id handle } } }`, {
      q: `handle:${spec.handle}`,
    });
    const existing = found.pages.nodes.find((p) => p.handle === spec.handle);
    if (existing) {
      ids[spec.handle] = existing.id;
      console.log(`= page ${spec.handle}`);
      continue;
    }
    const body = readFileSync(new URL(`../../demo/pages/${spec.handle}.html`, import.meta.url), 'utf8');
    const data = await gql(
      `mutation ($page: PageCreateInput!) { pageCreate(page: $page) { page { id } userErrors { field message } } }`,
      { page: { title: spec.title, handle: spec.handle, body, isPublished: true } },
    );
    assertNoUserErrors(data.pageCreate, `page ${spec.handle}`);
    ids[spec.handle] = data.pageCreate.page.id;
    console.log(`+ page ${spec.handle}`);
  }
  return ids;
}

function toMenuItems(items, refs) {
  return items.map((item) => {
    const base = { title: item.title };
    if (item.collection) Object.assign(base, { type: 'COLLECTION', resourceId: refs.collections[item.collection] });
    else if (item.page) Object.assign(base, { type: 'PAGE', resourceId: refs.pages[item.page] });
    else Object.assign(base, { type: 'HTTP', url: item.url });
    if (item.items) base.items = toMenuItems(item.items, refs);
    return base;
  });
}

async function ensureMenus(refs) {
  const data = await gql(`{ menus(first: 50) { nodes { id handle } } }`);
  for (const spec of MENUS) {
    const items = toMenuItems(spec.items, refs);
    const existing = data.menus.nodes.find((m) => m.handle === spec.handle);
    if (existing) {
      const result = await gql(
        `mutation ($id: ID!, $title: String!, $handle: String, $items: [MenuItemUpdateInput!]!) {
          menuUpdate(id: $id, title: $title, handle: $handle, items: $items) { menu { id } userErrors { field message } }
        }`,
        { id: existing.id, title: spec.title, handle: spec.handle, items },
      );
      assertNoUserErrors(result.menuUpdate, `menu ${spec.handle}`);
      console.log(`~ menu ${spec.handle}`);
    } else {
      const result = await gql(
        `mutation ($title: String!, $handle: String!, $items: [MenuItemCreateInput!]!) {
          menuCreate(title: $title, handle: $handle, items: $items) { menu { id } userErrors { field message } }
        }`,
        { title: spec.title, handle: spec.handle, items },
      );
      assertNoUserErrors(result.menuCreate, `menu ${spec.handle}`);
      console.log(`+ menu ${spec.handle}`);
    }
  }
}

async function main() {
  if (!STORE || !TOKEN) {
    console.error('Set SHOPIFY_DEMO_STORE and SHOPIFY_ADMIN_TOKEN in .env (see docs/DEMO.md).');
    process.exit(1);
  }
  if (PROTECTED_STORES.includes(STORE.toLowerCase())) {
    console.error(`ABORTED: ${STORE} is the real Recutex store. This script only seeds the demo store.`);
    process.exit(1);
  }
  console.log(`Seeding ${STORE} (API ${API_VERSION})...`);
  const publicationId = await onlineStorePublicationId();
  const collections = await ensureCollections(publicationId);
  const pages = await ensurePages();
  await ensureMenus({ collections, pages });
  console.log('Done.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
