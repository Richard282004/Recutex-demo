import type { MetadataRoute } from 'next';
import { site } from '@/content/site';

export default function robots(): MetadataRoute.Robots {
  // The demo is not meant to be indexed; flip ALLOW_INDEXING=true in production.
  const allow = process.env.ALLOW_INDEXING === 'true';
  return {
    rules: allow
      ? { userAgent: '*', allow: '/', disallow: ['/checkout', '/cart', '/api/'] }
      : { userAgent: '*', disallow: '/' },
    sitemap: new URL('/sitemap.xml', site.url).toString(),
  };
}
