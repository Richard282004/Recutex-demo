import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Routes that read files at runtime (data/pages, /media) make the tracer copy the whole project into
  // the standalone output. Keep sources, docs, scripts, local env and photos out of the image; only
  // data/pages/*.html is read at runtime (copied explicitly by the Dockerfile).
  outputFileTracingExcludes: {
    '**': [
      './src/**',
      './scripts/**',
      './docs/**',
      './db/**',
      './storage/**',
      './data/*.json',
      './.env*',
      './docker-compose.yml',
      './Dockerfile',
      './*.md',
      './eslint.config.mjs',
      './tsconfig*.json',
    ],
  },
  images: {
    // Product photos are local files served by /media (see src/app/media); next/image resizes them.
    localPatterns: [{ pathname: '/media/**', search: '' }],
    formats: ['image/avif', 'image/webp'],
  },
  // Keep the URLs of the current store so existing SEO and links keep working.
  // Every URL of the old sitemap is checked by `npm run check:legacy-urls` (see docs/LAUNCH.md).
  async redirects() {
    return [
      { source: '/collections/all', destination: '/collections', permanent: true },
      { source: '/pages/recuperadoradetextiles', destination: '/pages/nosotros', permanent: true },
      // Shopify nests product URLs under collections; the canonical URL is /products/:handle.
      {
        source: '/collections/:collection/products/:product',
        destination: '/products/:product',
        permanent: true,
      },
      // Collections that are empty in the current store
      { source: '/collections/:handle(box)', destination: '/collections/dormitorio', permanent: true },
      {
        source: '/collections/:handle(living|living-pack|muebles-living)',
        destination: '/collections/sala-de-estar',
        permanent: true,
      },
      { source: '/collections/almohadas', destination: '/collections', permanent: true },
      // Pages without content in the current store
      { source: '/pages/formas-de-pago', destination: '/pages/terminos-y-condiciones', permanent: true },
      { source: '/pages/gerdarmeria-sename', destination: '/', permanent: true },
      { source: '/blogs/:path*', destination: '/', permanent: true },
      // Shopify system pages
      { source: '/policies/terms-of-service', destination: '/pages/terminos-y-condiciones', permanent: true },
      { source: '/policies/privacy-policy', destination: '/pages/politica-de-privacidad', permanent: true },
      { source: '/policies/refund-policy', destination: '/pages/devolucion-y-garantia', permanent: true },
      { source: '/policies/shipping-policy', destination: '/pages/consultas-frecuentes', permanent: true },
      { source: '/account/:path*', destination: '/', permanent: false },
    ];
  },
};

export default nextConfig;
