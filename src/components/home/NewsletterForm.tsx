'use client';

import { useActionState } from 'react';
import { subscribe, type SubscribeState } from '@/app/actions/newsletter';

export function NewsletterForm() {
  const [state, action, pending] = useActionState<SubscribeState, FormData>(subscribe, { status: 'idle' });

  if (state.status === 'success') {
    return (
      <p className="form-message" role="status">
        {state.message}
      </p>
    );
  }

  return (
    <form className="newsletter__form" action={action} noValidate>
      <div className="newsletter__field">
        <label className="visually-hidden" htmlFor="NewsletterEmail">
          Tu email
        </label>
        <input
          className="field__input"
          id="NewsletterEmail"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="Tu email"
          required
          defaultValue={state.email}
          aria-invalid={state.status === 'error' || undefined}
          aria-describedby={state.status === 'error' ? 'NewsletterError' : undefined}
        />
        <button className="button button--primary" type="submit" disabled={pending}>
          {pending ? 'Enviando…' : 'Suscribirme'}
        </button>
      </div>
      {state.status === 'error' && (
        <p className="form-message form-message--error" id="NewsletterError" role="alert">
          {state.message}
        </p>
      )}
    </form>
  );
}
