'use client';

/*
  Add to cart with feedback: "Agregar al carrito" → "Agregando…" → "Agregado ✓", then opens
  the cart drawer. The short delay only sequences the animation; the cart updates immediately.
*/
import { useEffect, useRef, useState } from 'react';
import { Icon } from '../Icon';
import { type CartLine, useCart } from './CartProvider';

type State = 'idle' | 'loading' | 'success';

export function AddToCartButton({
  line,
  quantity = 1,
  disabled = false,
  className = 'button button--primary',
  compact = false,
  label = 'Agregar al carrito',
  ariaLabel,
}: {
  line: Omit<CartLine, 'quantity'>;
  quantity?: number;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
  label?: string;
  ariaLabel?: string;
}) {
  const { add, open } = useCart();
  const [state, setState] = useState<State>('idle');
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  const onClick = () => {
    if (state !== 'idle') return;
    setState('loading');
    add(line, quantity);
    timers.current.push(
      window.setTimeout(() => {
        setState('success');
        open();
      }, 350),
      window.setTimeout(() => setState('idle'), 1900),
    );
  };

  const stateClass = state === 'loading' ? ' is-loading' : state === 'success' ? ' is-success' : '';

  return (
    <button
      className={`${className}${stateClass}`}
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-busy={state === 'loading'}
      aria-label={ariaLabel}
    >
      <span className="button__label">
        {compact ? (
          <>
            <span className="button__plus">
              <Icon name="plus" />
            </span>
            <span className="button__text">{label}</span>
          </>
        ) : (
          label
        )}
      </span>
      <span className="button__state button__state--loading" aria-hidden={state !== 'loading'}>
        <span className="spinner" />
        {!compact && 'Agregando…'}
      </span>
      <span className="button__state button__state--success" aria-hidden={state !== 'success'}>
        <Icon name="check" />
        {!compact && 'Agregado'}
      </span>
      <span className="visually-hidden" role="status">
        {state === 'success' ? 'Producto agregado al carrito' : ''}
      </span>
    </button>
  );
}
