import { NextResponse, type NextRequest } from 'next/server';
import { searchCollections, searchProducts } from '@/lib/catalog';
import { displayTitle, formatPrice } from '@/lib/format';

/** Predictive search used by the header overlay. */
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get('q') ?? '').slice(0, 80);
  const [products, collections] = await Promise.all([searchProducts(q), searchCollections(q)]);
  return NextResponse.json(
    {
      total: products.length,
      collections: collections.slice(0, 4).map((c) => ({ handle: c.handle, title: c.title })),
      products: products.slice(0, 6).map((p) => {
        const cheapest = p.variants.reduce((a, b) => (b.price < a.price ? b : a));
        return {
          handle: p.handle,
          title: displayTitle(p.title),
          image: p.images[0]?.src ?? null,
          price: (p.priceMin !== p.priceMax ? 'Desde ' : '') + formatPrice(cheapest.price),
          compareAt: cheapest.compareAtPrice ? formatPrice(cheapest.compareAtPrice) : null,
        };
      }),
    },
    { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300' } },
  );
}
