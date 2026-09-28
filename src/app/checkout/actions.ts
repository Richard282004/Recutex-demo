'use server';

/*
  Starts a Webpay Plus payment. The amount is recalculated here from the catalog; prices sent
  by the browser are ignored. Production also persists the order (pending) before redirecting.
*/
import { randomUUID } from 'node:crypto';
import { headers } from 'next/headers';
import { z } from 'zod';
import { regions } from '@/content/site';
import { findVariant } from '@/lib/catalog';
import { webpayTransaction } from '@/lib/webpay';

const checkoutSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(3, 'Ingresa tu nombre y apellido.').max(120),
    email: z.email('Ingresa un email válido, por ejemplo nombre@correo.cl.'),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[\d\s]{8,15}$/, 'Ingresa un teléfono de 9 dígitos, por ejemplo +56 9 1234 5678.'),
    region: z.enum(regions as [string, ...string[]], { message: 'Elige tu región.' }),
    comuna: z.string().trim().min(2, 'Ingresa tu comuna.').max(80),
    address: z.string().trim().min(5, 'Ingresa calle y número.').max(200),
    notes: z.string().trim().max(500).optional(),
  }),
  items: z
    .array(z.object({ variantId: z.string().min(1), quantity: z.number().int().min(1).max(20) }))
    .min(1, 'Tu carrito está vacío.')
    .max(50),
  // Ley 19.496 art. 12 A: the buyer must have had clear access to the terms before contracting.
  acceptTerms: z.boolean().refine((v) => v, 'Debes aceptar los términos y la política de privacidad.'),
});

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutResult =
  | { ok: true; url: string; token: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

async function originFromRequest() {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const proto = h.get('x-forwarded-proto') ?? (host?.startsWith('localhost') ? 'http' : 'https');
  return host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000');
}

export async function startPayment(input: CheckoutInput): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.at(-1);
      if (typeof key === 'string' && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, message: 'Revisa los datos marcados.', fieldErrors };
  }

  let amount = 0;
  for (const item of parsed.data.items) {
    const found = await findVariant(item.variantId);
    if (!found)
      return { ok: false, message: 'Un producto de tu carrito ya no existe. Elimínalo e intenta de nuevo.' };
    if (!found.variant.available) {
      return {
        ok: false,
        message: `“${found.product.title}” está agotado. Elimínalo del carrito para continuar.`,
      };
    }
    amount += found.variant.price * item.quantity;
  }

  const buyOrder = `RX${Date.now().toString(36).toUpperCase()}`;
  const sessionId = randomUUID().slice(0, 26);
  const returnUrl = `${await originFromRequest()}/checkout/return`;

  try {
    const response = await webpayTransaction().create(buyOrder, sessionId, amount, returnUrl);
    return { ok: true, url: response.url, token: response.token };
  } catch (error) {
    console.error('Webpay create failed', error);
    return { ok: false, message: 'No pudimos conectar con Webpay. Intenta de nuevo en unos minutos.' };
  }
}
