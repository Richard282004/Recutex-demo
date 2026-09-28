-- RECUTEX storefront catalog. Applied automatically by the postgres container on first start
-- (docker-entrypoint-initdb.d) and by `npm run db:seed`, which is idempotent.
-- Prices are integers in CLP (no decimals).

CREATE TABLE IF NOT EXISTS collections (
  handle      text PRIMARY KEY,
  title       text NOT NULL,
  description text,
  image       text,
  position    integer NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id               text PRIMARY KEY,
  handle           text NOT NULL UNIQUE,
  title            text NOT NULL,
  description_html text NOT NULL DEFAULT '',
  description      text NOT NULL DEFAULT '',
  vendor           text NOT NULL DEFAULT 'Recutex',
  type             text,
  tags             text[] NOT NULL DEFAULT '{}',
  sizes            text[] NOT NULL DEFAULT '{}',
  options          jsonb NOT NULL DEFAULT '[]',
  price_min        integer NOT NULL CHECK (price_min >= 0),
  price_max        integer NOT NULL CHECK (price_max >= price_min),
  available        boolean NOT NULL DEFAULT true,
  on_sale          boolean NOT NULL DEFAULT false,
  -- Where the product data came from (own store or a marketplace listing).
  source           text NOT NULL DEFAULT 'shopify',
  source_url       text,
  position         integer NOT NULL,
  created_at       timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS product_collections (
  product_id        text NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  collection_handle text NOT NULL REFERENCES collections (handle) ON DELETE CASCADE,
  PRIMARY KEY (product_id, collection_handle)
);

CREATE TABLE IF NOT EXISTS product_images (
  product_id text NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  position   integer NOT NULL,
  -- Path under /media served by the app (files live in MEDIA_DIR, not in the database).
  src        text NOT NULL,
  width      integer NOT NULL,
  height     integer NOT NULL,
  alt        text NOT NULL DEFAULT '',
  -- Original URL the file was downloaded from, to re-fetch or audit it.
  origin_url text,
  PRIMARY KEY (product_id, position)
);

CREATE TABLE IF NOT EXISTS variants (
  id               text PRIMARY KEY,
  product_id       text NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  position         integer NOT NULL,
  title            text NOT NULL,
  options          text[] NOT NULL DEFAULT '{}',
  price            integer NOT NULL CHECK (price >= 0),
  compare_at_price integer CHECK (compare_at_price IS NULL OR compare_at_price > price),
  available        boolean NOT NULL DEFAULT true,
  sku              text,
  image            text
);

CREATE INDEX IF NOT EXISTS variants_product_idx ON variants (product_id);
CREATE INDEX IF NOT EXISTS product_collections_collection_idx ON product_collections (collection_handle);
