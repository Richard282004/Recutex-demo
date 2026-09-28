'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/components/cart/CartProvider';
import { QuantityInput } from '@/components/cart/QuantityInput';
import { shipping } from '@/content/site';
import { formatPrice } from '@/lib/format';

export function CartPageView() {
  const { lines, subtotal, update, ready } = useCart();

  if (!ready) return null;
  if (lines.length === 0) {
    return (
      <div className="empty-state collection__empty">
        <p>Tu carrito está vacío.</p>
        <Link className="button button--primary" href="/collections">
          Seguir comprando
        </Link>
      </div>
    );
  }

  return (
    <>
      <ul className="cart__items" role="list">
        {lines.map((line) => (
          <li className="cart-item" key={line.variantId}>
            <Link
              className="cart-item__media"
              href={`/products/${line.handle}`}
              tabIndex={-1}
              aria-hidden="true"
            >
              {line.image && <Image src={line.image} alt="" width={192} height={192} sizes="96px" />}
            </Link>
            <div className="cart-item__details">
              <Link className="cart-item__title" href={`/products/${line.handle}`}>
                {line.title}
              </Link>
              {line.variantTitle && <p className="cart-item__variant">{line.variantTitle}</p>}
              <p className="cart-item__price">{formatPrice(line.price * line.quantity)}</p>
            </div>
            <div className="cart-item__quantity">
              <QuantityInput
                value={line.quantity}
                min={0}
                label={`Cantidad de ${line.title}`}
                onChange={(q) => update(line.variantId, q)}
              />
              <button className="cart-line__remove" type="button" onClick={() => update(line.variantId, 0)}>
                Eliminar<span className="visually-hidden"> {line.title}</span>
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="cart__footer">
        <p className="cart__subtotal">
          <span>Subtotal</span>
          <strong>{formatPrice(subtotal)}</strong>
        </p>
        <p className="cart__taxes">IVA incluido. {shipping.note}</p>
        <div className="cart__buttons">
          <Link className="button" href="/collections">
            Seguir comprando
          </Link>
          <Link className="button button--primary" href="/checkout">
            Finalizar compra
          </Link>
        </div>
      </div>
    </>
  );
}
