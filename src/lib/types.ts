export type Image = { src: string; width: number; height: number; alt: string };

export type Variant = {
  id: string;
  title: string;
  options: string[];
  price: number;
  compareAtPrice: number | null;
  available: boolean;
  sku: string | null;
  image: string | null;
};

export type Product = {
  id: string;
  handle: string;
  title: string;
  descriptionHtml: string;
  description: string;
  vendor: string;
  type: string | null;
  tags: string[];
  collections: string[];
  sizes: string[];
  images: Image[];
  options: { name: string; values: string[] }[];
  variants: Variant[];
  priceMin: number;
  priceMax: number;
  available: boolean;
  onSale: boolean;
  createdAt: string;
  /** Listing the product was imported from, when it does not come from Recutex's own store. */
  source?: string;
};

export type Collection = {
  handle: string;
  title: string;
  description: string | null;
  image: string | null;
};

export type SortKey = 'relevancia' | 'precio-asc' | 'precio-desc' | 'nombre' | 'nuevos';
