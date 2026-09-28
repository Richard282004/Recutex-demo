import Image from 'next/image';
import Link from 'next/link';
import { displayTitle } from '@/lib/format';
import type { Product } from '@/lib/types';
import { AddToCartButton } from './cart/AddToCartButton';
import { Icon } from './Icon';
import { Price, productPriceProps } from './Price';

/** Product card: all data from the catalog (no hardcoded prices, stock or discounts). */
export function ProductCard({
  product,
  priority = false,
  sizes = '(min-width: 1200px) 22vw, (min-width: 750px) 30vw, 48vw',
}: {
  product: Product;
  priority?: boolean;
  sizes?: string;
}) {
  const [primary, secondary] = product.images;
  const title = displayTitle(product.title);
  const singleVariant = product.variants.length === 1;
  const variant = product.variants[0];
  const firstOption = product.options[0];

  return (
    <article className={`product-card${secondary ? ' product-card--has-hover' : ''}`} data-reveal>
      <div className="product-card__media-wrap">
        <div className="product-card__media">
          {primary && (
            <Image
              className="product-card__image product-card__image--primary"
              src={primary.src}
              alt={primary.alt ? displayTitle(primary.alt) : title}
              fill
              sizes={sizes}
              priority={priority}
            />
          )}
          {secondary && (
            <Image
              className="product-card__image product-card__image--secondary"
              src={secondary.src}
              alt=""
              fill
              sizes={sizes}
            />
          )}
          <div className="product-card__badges">
            {!product.available ? (
              <span className="badge badge--muted">Agotado</span>
            ) : product.onSale ? (
              <span className="badge badge--sale">Oferta</span>
            ) : null}
          </div>
        </div>

        {product.available && (
          <div className="product-card__quick-add">
            {singleVariant ? (
              <AddToCartButton
                compact
                className="button button--light button--small"
                ariaLabel={`Agregar al carrito: ${title}`}
                line={{
                  variantId: variant.id,
                  handle: product.handle,
                  title,
                  variantTitle: null,
                  price: variant.price,
                  compareAtPrice: variant.compareAtPrice,
                  image: variant.image ?? primary?.src ?? null,
                }}
              />
            ) : (
              <Link
                className="button button--light button--small"
                href={`/products/${product.handle}`}
                aria-label={`Elegir opción: ${title}`}
                tabIndex={-1}
              >
                <span className="button__label">
                  <span className="button__plus">
                    <Icon name="plus" />
                  </span>
                  <span className="button__text">Elegir opción</span>
                </span>
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="product-card__info">
        <h3 className="product-card__title">
          <Link href={`/products/${product.handle}`}>{title}</Link>
        </h3>
        {firstOption && firstOption.values.length > 1 && (
          <p className="product-card__options">
            {firstOption.values.length} opciones de {firstOption.name.toLowerCase()}
          </p>
        )}
        <Price {...productPriceProps(product)} />
      </div>
    </article>
  );
}
