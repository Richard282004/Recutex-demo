'use server';

import { z } from 'zod';

export type SubscribeState = { status: 'idle' | 'success' | 'error'; message?: string; email?: string };

const schema = z.object({ email: z.email() });

/**
 * Demo: validates the address but does not store it yet. Production connects this action to the
 * email provider chosen by Recutex (see docs/ARCHITECTURE.md).
 */
export async function subscribe(_prev: SubscribeState, formData: FormData): Promise<SubscribeState> {
  const email = String(formData.get('email') ?? '').trim();
  const parsed = schema.safeParse({ email });
  if (!parsed.success) {
    return { status: 'error', message: 'Ingresa un email válido, por ejemplo nombre@correo.cl.', email };
  }
  return {
    status: 'success',
    message: 'Suscripción recibida. (Demo: aún no se guarda en una lista de correo.)',
  };
}
