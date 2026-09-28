'use client';

/*
  Variant picker (pills per option; combinations without stock are struck through), quantity,
  add to cart and "Comprar ahora" (adds and goes straight to checkout). Updates ?variant= in the URL.
*/
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { displayTitle } from '@/lib/format';
import type { Product } from '@/lib/types';
import { AddToCartButton } from '../cart/AddToCartButton';
import { useCart } from '../cart/CartProvider';
import { QuantityInput } from '../cart/QuantityInput';
import { Price } from '../Price';
import { ProductGallery } from './ProductGallery';

export function ProductView({ product, info }: { product: Product; info: React.ReactNode }) {
  const initial = product.variants.find((v) => v.available) ?? product.variants[0];
  const [selected, setSelected] = useState<string[]>(initial.options);

  // Deep links (?variant=ID) are applied after hydration so the page stays fully static.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('variant');
    const fromUrl = product.variants.find((v) => v.id === id);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync with URL once on mount
    if (fromUrl) setSelected(fromUrl.options);
  }, [product.variants]);
  const [quantity, setQuantity] = useState(1);
  const router = useRouter();
  const { add } = useCart();

  const variant = useMemo(
    () => product.variants.find((v) => v.options.every((value, i) => value === selected[i])),
    [product.variants, selected],
  );
  const title = displayTitle(product.title);

  const choose = (optionIndex: number, value: string) => {
    const next = [...selected];
    next[optionIndex] = value;
    setSelected(next);
    const match = product.variants.find((v) => v.options.every((val, i) => val === next[i]));
    if (match) window.history.replaceState(null, '', `?variant=${match.id}`);
  };

  const isAvailable = (optionIndex: number, value: string) => {
    const candidate = [...selected];
    candidate[optionIndex] = value;
    return product.variants.some((v) => v.available && v.options.every((val, i) => val === candidate[i]));
  };

  const line = variant && {
    variantId: variant.id,
    handle: product.handle,
    title,
    variantTitle: product.options.length ? variant.title : null,
    price: variant.price,
    compareAtPrice: variant.compareAtPrice,
    image: variant.image ?? product.images[0]?.src ?? null,
  };

  const buyNow = () => {
    if (!line) return;
    add(line, quantity);
    router.push('/checkout');
  };

  return (
    <div className="product__grid">
      <ProductGallery images={product.images} title={title} activeSrc={variant?.image} />

      <div className="product__info">
        <div className="product__title-wrap">
          <h1 className="product__title">{title}</h1>
        </div>

        <div className="product__price">
          {variant ? (
            <Price price={variant.price} compareAtPrice={variant.compareAtPrice} />
          ) : (
            <p>No disponible</p>
          )}
          <p className="product__tax-note">IVA incluido.</p>
        </div>

        {product.options.length > 0 && (
          <div className="variant-picker">
            {product.options.map((option, optionIndex) => (
              <fieldset className="variant-picker__option" key={option.name}>
                <legend className="field__label">
                  {option.name}: <span className="variant-picker__selected">{selected[optionIndex]}</span>
                </legend>
                <div className="variant-picker__values">
                  {option.values.map((value) => {
                    const id = `opt-${optionIndex}-${value.replace(/\W+/g, '-')}`;
                    return (
                      <span key={value}>
                        <input
                          className="visually-hidden"
                          type="radio"
                          id={id}
                          name={option.name}
                          value={value}
                          checked={selected[optionIndex] === value}
                          onChange={() => choose(optionIndex, value)}
                        />
                        <label
                          className={`pill${isAvailable(optionIndex, value) ? '' : ' is-unavailable'}`}
                          htmlFor={id}
                        >
                          {value}
                        </label>
                      </span>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
        )}

        <div className="product__buy">
          <p className={`product__availability${variant?.available ? '' : ' is-out'}`}>
            <span className="product__availability-dot" aria-hidden="true" />
            {variant ? (variant.available ? 'Disponible' : 'Agotado') : 'Combinación no disponible'}
          </p>
          <div className="product-form__row">
            <QuantityInput value={quantity} onChange={setQuantity} label="Cantidad" />
            {line ? (
              <AddToCartButton
                className="button button--primary product-form__submit"
                line={line}
                quantity={quantity}
                disabled={!variant?.available}
                label={variant?.available ? 'Agregar al carrito' : 'Agotado'}
              />
            ) : (
              <button className="button button--primary product-form__submit" type="button" disabled>
                No disponible
              </button>
            )}
          </div>
          <button
            className="button button--full"
            type="button"
            onClick={buyNow}
            disabled={!variant?.available}
          >
            Comprar ahora
          </button>
        </div>

        {info}
      </div>
    </div>
  );
}
