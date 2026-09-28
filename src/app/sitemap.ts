import type { MetadataRoute } from 'next';
import { pages, site } from '@/content/site';
import { getCollections, getProducts } from '@/lib/catalog';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [collections, products] = await Promise.all([getCollections(), getProducts()]);
  const url = (p: string) => new URL(p, site.url).toString();
  return [
    { url: url('/'), changeFrequency: 'weekly', priority: 1 },
    { url: url('/collections'), changeFrequency: 'weekly' },
    ...collections.map((c) => ({
      url: url(`/collections/${c.handle}`),
      changeFrequency: 'weekly' as const,
    })),
    ...products.map((p) => ({ url: url(`/products/${p.handle}`), changeFrequency: 'weekly' as const })),
    ...Object.keys(pages).map((h) => ({ url: url(`/pages/${h}`), changeFrequency: 'monthly' as const })),
  ];
}
