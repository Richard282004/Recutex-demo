import { discountPercent, formatPrice } from '@/lib/format';
import type { Product } from '@/lib/types';

/** Shows a discount only when the catalog has a real compare-at price. */
export function Price({
  price,
  compareAtPrice,
  from = false,
  className,
}: {
  price: number;
  compareAtPrice?: number | null;
  from?: boolean;
  className?: string;
}) {
  const percent = discountPercent(price, compareAtPrice ?? null);
  const current = from ? `Desde ${formatPrice(price)}` : formatPrice(price);
  return (
    <div className={`price${percent ? ' price--on-sale' : ''}${className ? ` ${className}` : ''}`}>
      {percent && compareAtPrice ? (
        <>
          <span className="visually-hidden">Precio oferta</span>
          <span className="price__current">{current}</span>
          <span className="visually-hidden">Precio normal</span>
          <s className="price__compare">{formatPrice(compareAtPrice)}</s>
          <span className="price__badge">-{percent}%</span>
        </>
      ) : (
        <span className="price__current">{current}</span>
      )}
    </div>
  );
}

/** Price shown on cards: cheapest variant, "Desde" when prices vary. */
export function productPriceProps(product: Pick<Product, 'priceMin' | 'priceMax' | 'variants'>) {
  const cheapest = product.variants.reduce((a, b) => (b.price < a.price ? b : a));
  return {
    price: cheapest.price,
    compareAtPrice: cheapest.compareAtPrice,
    from: product.priceMin !== product.priceMax,
  };
}
