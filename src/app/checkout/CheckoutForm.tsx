'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState, useTransition } from 'react';
import { useCart } from '@/components/cart/CartProvider';
import { Icon } from '@/components/Icon';
import { regions, shipping } from '@/content/site';
import { formatPrice } from '@/lib/format';
import { startPayment } from './actions';

const FIELDS = ['name', 'email', 'phone', 'region', 'comuna', 'address'] as const;
const FOCUS_ORDER = [...FIELDS, 'acceptTerms'] as const;

export function CheckoutForm({ testMode }: { testMode: boolean }) {
  const { lines, subtotal, ready } = useCart();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [redirect, setRedirect] = useState<{ url: string; token: string } | null>(null);
  const webpayForm = useRef<HTMLFormElement>(null);

  if (!ready) return <p className="checkout__loading">Cargando tu carrito…</p>;

  if (lines.length === 0 && !redirect) {
    return (
      <div className="empty-state collection__empty">
        <p>Tu carrito está vacío.</p>
        <Link className="button button--primary" href="/collections">
          Ver productos
        </Link>
      </div>
    );
  }

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const get = (key: string) => String(data.get(key) ?? '');
    setMessage(null);
    startTransition(async () => {
      const result = await startPayment({
        customer: {
          name: get('name'),
          email: get('email'),
          phone: get('phone'),
          region: get('region'),
          comuna: get('comuna'),
          address: get('address'),
          notes: get('notes') || undefined,
        },
        items: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
        acceptTerms: data.get('acceptTerms') === 'on',
      });
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        setMessage(result.message);
        const firstInvalid = FOCUS_ORDER.find((f) => result.fieldErrors?.[f]);
        if (firstInvalid) document.getElementById(`checkout-${firstInvalid}`)?.focus();
        return;
      }
      setErrors({});
      setRedirect(result);
      // Webpay expects a POST with token_ws to its form URL.
      requestAnimationFrame(() => webpayForm.current?.submit());
    });
  };

  const field = (
    name: (typeof FIELDS)[number],
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => (
    <div className={`field${errors[name] ? ' field--error' : ''}`}>
      <label className="field__label" htmlFor={`checkout-${name}`}>
        {label}
      </label>
      <input
        className="field__input"
        id={`checkout-${name}`}
        name={name}
        aria-invalid={Boolean(errors[name]) || undefined}
        aria-describedby={errors[name] ? `checkout-${name}-error` : undefined}
        {...props}
      />
      {errors[name] && (
        <p className="field__error" id={`checkout-${name}-error`}>
          {errors[name]}
        </p>
      )}
    </div>
  );

  return (
    <div className="checkout">
      <form className="checkout__form" onSubmit={onSubmit} noValidate>
        <fieldset className="checkout__group">
          <legend>Contacto</legend>
          {field('name', 'Nombre y apellido', { autoComplete: 'name', required: true })}
          <div className="checkout__row">
            {field('email', 'Email', { type: 'email', autoComplete: 'email', required: true })}
            {field('phone', 'Teléfono', {
              type: 'tel',
              autoComplete: 'tel',
              placeholder: '+56 9 1234 5678',
              required: true,
            })}
          </div>
        </fieldset>

        <fieldset className="checkout__group">
          <legend>Dirección de despacho</legend>
          <div className="checkout__row">
            <div className={`field${errors.region ? ' field--error' : ''}`}>
              <label className="field__label" htmlFor="checkout-region">
                Región
              </label>
              <select
                className="field__input"
                id="checkout-region"
                name="region"
                defaultValue="Metropolitana de Santiago"
                aria-invalid={Boolean(errors.region) || undefined}
              >
                {regions.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
              {errors.region && <p className="field__error">{errors.region}</p>}
            </div>
            {field('comuna', 'Comuna', { autoComplete: 'address-level2', required: true })}
          </div>
          {field('address', 'Calle, número y depto.', { autoComplete: 'street-address', required: true })}
          <div className="field">
            <label className="field__label" htmlFor="checkout-notes">
              Indicaciones para el despacho (opcional)
            </label>
            <textarea className="field__input" id="checkout-notes" name="notes" maxLength={500} />
          </div>
        </fieldset>

        <div className={`field checkout__terms${errors.acceptTerms ? ' field--error' : ''}`}>
          <label className="checkout__terms-label">
            <input
              id="checkout-acceptTerms"
              type="checkbox"
              name="acceptTerms"
              required
              aria-invalid={Boolean(errors.acceptTerms) || undefined}
              aria-describedby={errors.acceptTerms ? 'checkout-acceptTerms-error' : undefined}
            />
            <span>
              Leí y acepto los{' '}
              <Link href="/pages/terminos-y-condiciones" target="_blank">
                términos y condiciones
              </Link>{' '}
              y la{' '}
              <Link href="/pages/politica-de-privacidad" target="_blank">
                política de privacidad
              </Link>
              .
            </span>
          </label>
          {errors.acceptTerms && (
            <p className="field__error" id="checkout-acceptTerms-error">
              {errors.acceptTerms}
            </p>
          )}
        </div>

        {message && (
          <p className="form-message form-message--error" role="alert">
            {message}
          </p>
        )}

        <button
          className="button button--primary button--full checkout__pay"
          type="submit"
          disabled={pending || Boolean(redirect)}
        >
          <Icon name="lock" />
          {redirect
            ? 'Redirigiendo a Webpay…'
            : pending
              ? 'Preparando el pago…'
              : `Pagar ${formatPrice(subtotal)} con Webpay`}
        </button>
        {testMode && (
          <p className="checkout__test-note">
            Modo de prueba de Transbank: no se realizan cobros reales. Usa la tarjeta de prueba VISA 4051 8856
            0044 6623, CVV 123, cualquier fecha futura; RUT 11.111.111-1 y clave 123.
          </p>
        )}
      </form>

      <aside className="checkout__summary" aria-label="Resumen del pedido">
        <h2 className="checkout__summary-title">Tu pedido</h2>
        <ul className="checkout__lines" role="list">
          {lines.map((line) => (
            <li className="checkout__line" key={line.variantId}>
              <span className="checkout__line-media">
                {line.image && <Image src={line.image} alt="" width={128} height={128} sizes="64px" />}
                <span className="checkout__line-qty">{line.quantity}</span>
              </span>
              <span className="checkout__line-info">
                <span>{line.title}</span>
                {line.variantTitle && <span className="cart-line__meta">{line.variantTitle}</span>}
              </span>
              <span className="checkout__line-price">{formatPrice(line.price * line.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="checkout__totals">
          <div>
            <dt>Subtotal</dt>
            <dd>{formatPrice(subtotal)}</dd>
          </div>
          <div>
            <dt>Despacho</dt>
            <dd>Por confirmar</dd>
          </div>
          <div className="checkout__total">
            <dt>Total a pagar</dt>
            <dd>{formatPrice(subtotal)}</dd>
          </div>
        </dl>
        <p className="checkout__note">IVA incluido. {shipping.note}</p>
      </aside>

      {redirect && (
        <form ref={webpayForm} action={redirect.url} method="POST" hidden>
          <input type="hidden" name="token_ws" value={redirect.token} />
        </form>
      )}
    </div>
  );
}
