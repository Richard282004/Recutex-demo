'use client';

import { useEffect, useRef, useState } from 'react';
import { useCart } from '../cart/CartProvider';
import { Icon } from '../Icon';

export function CartButton() {
  const { count, open, isOpen, ready } = useCart();
  const [bump, setBump] = useState(false);
  const previous = useRef(count);

  // Small bump animation when the count increases (cart feedback).
  useEffect(() => {
    if (ready && count > previous.current) {
      setBump(true);
      const timer = window.setTimeout(() => setBump(false), 500);
      previous.current = count;
      return () => window.clearTimeout(timer);
    }
    previous.current = count;
  }, [count, ready]);

  return (
    <button
      className="icon-button"
      type="button"
      onClick={open}
      aria-expanded={isOpen}
      aria-controls="CartDrawer"
    >
      <Icon name="cart" />
      <span className="visually-hidden">Carrito, {count} productos</span>
      <span
        className={`cart-count${count === 0 ? ' is-empty' : ''}${bump ? ' is-bumped' : ''}`}
        aria-hidden="true"
      >
        {count}
      </span>
    </button>
  );
}
