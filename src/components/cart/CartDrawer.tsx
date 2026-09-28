'use client';

import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/format';
import { shipping } from '@/content/site';
import { Drawer } from '../Drawer';
import { useCart } from './CartProvider';
import { QuantityInput } from './QuantityInput';

export function CartDrawer() {
  const { lines, count, subtotal, isOpen, close, update } = useCart();

  return (
    <Drawer
      id="CartDrawer"
      open={isOpen}
      onClose={close}
      side="right"
      panelClassName="cart-drawer"
      title={<>Tu carrito {count > 0 && <span className="cart-drawer__count">({count})</span>}</>}
      footer={
        lines.length > 0 ? (
          <>
            <p className="cart-drawer__subtotal">
              <span>Subtotal</span>
              <strong>{formatPrice(subtotal)}</strong>
            </p>
            <p className="cart-drawer__taxes">IVA incluido. {shipping.note}</p>
            <Link className="button button--primary button--full" href="/checkout" onClick={close}>
              Finalizar compra
            </Link>
            <Link className="cart-drawer__view-cart" href="/cart" onClick={close}>
              Ver carrito
            </Link>
          </>
        ) : undefined
      }
    >
      {lines.length === 0 ? (
        <div className="cart-drawer__empty">
          <p>Tu carrito está vacío.</p>
          <Link className="button button--primary" href="/collections" onClick={close}>
            Seguir comprando
          </Link>
        </div>
      ) : (
        <ul className="cart-drawer__items" role="list">
          {lines.map((line) => (
            <li className="cart-line" key={line.variantId}>
              <Link
                className="cart-line__media"
                href={`/products/${line.handle}`}
                tabIndex={-1}
                aria-hidden="true"
                onClick={close}
              >
                {line.image && <Image src={line.image} alt="" width={176} height={176} sizes="88px" />}
              </Link>
              <div className="cart-line__details">
                <Link className="cart-line__title" href={`/products/${line.handle}`} onClick={close}>
                  {line.title}
                </Link>
                {line.variantTitle && <p className="cart-line__meta">{line.variantTitle}</p>}
                <div className="cart-line__bottom">
                  <QuantityInput
                    small
                    value={line.quantity}
                    min={0}
                    label={`Cantidad de ${line.title}`}
                    onChange={(quantity) => update(line.variantId, quantity)}
                  />
                  <div className="cart-line__price">
                    {line.compareAtPrice && (
                      <s className="price__compare">{formatPrice(line.compareAtPrice * line.quantity)}</s>
                    )}
                    <span className="price__current">{formatPrice(line.price * line.quantity)}</span>
                  </div>
                </div>
                <button className="cart-line__remove" type="button" onClick={() => update(line.variantId, 0)}>
                  Eliminar<span className="visually-hidden"> {line.title}</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
}
