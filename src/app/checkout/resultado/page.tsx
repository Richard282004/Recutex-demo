import type { Metadata } from 'next';
import Link from 'next/link';
import { site } from '@/content/site';
import { formatPrice } from '@/lib/format';
import { webpayTransaction } from '@/lib/webpay';
import { ClearCart } from './ClearCart';

export const metadata: Metadata = { title: 'Resultado del pago', robots: { index: false } };

type Props = { searchParams: Promise<{ estado?: string; token?: string; orden?: string }> };

type TransactionStatus = {
  status: string;
  response_code: number;
  amount: number;
  buy_order: string;
  authorization_code?: string;
  transaction_date?: string;
  card_detail?: { card_number?: string };
  payment_type_code?: string;
  installments_number?: number;
};

const PAYMENT_TYPES: Record<string, string> = {
  VD: 'Débito',
  VP: 'Prepago',
  VN: 'Crédito',
  VC: 'Crédito en cuotas',
  SI: 'Crédito, 3 cuotas sin interés',
  S2: 'Crédito, 2 cuotas sin interés',
  NC: 'Crédito, cuotas sin interés',
};

export default async function ResultPage({ searchParams }: Props) {
  const { estado, token, orden } = await searchParams;

  // Always confirm with Transbank instead of trusting the query string.
  let tx: TransactionStatus | null = null;
  if (token) {
    try {
      tx = (await webpayTransaction().status(token)) as TransactionStatus;
    } catch {
      tx = null;
    }
  }
  const approved = tx?.status === 'AUTHORIZED' && tx.response_code === 0;

  return (
    <section className="section">
      <div className="page-width page-width--narrow checkout-result">
        {approved && tx ? (
          <>
            <ClearCart />
            <p className="checkout-result__icon checkout-result__icon--ok" aria-hidden="true">
              ✓
            </p>
            <h1 className="page-title">Pago aprobado</h1>
            <p>Gracias por tu compra. Te contactaremos para coordinar el despacho.</p>
            <dl className="checkout-result__details">
              <div>
                <dt>Orden de compra</dt>
                <dd>{tx.buy_order}</dd>
              </div>
              <div>
                <dt>Monto pagado</dt>
                <dd>{formatPrice(tx.amount)}</dd>
              </div>
              {tx.authorization_code && (
                <div>
                  <dt>Código de autorización</dt>
                  <dd>{tx.authorization_code}</dd>
                </div>
              )}
              {tx.card_detail?.card_number && (
                <div>
                  <dt>Tarjeta</dt>
                  <dd>**** {tx.card_detail.card_number}</dd>
                </div>
              )}
              {tx.payment_type_code && (
                <div>
                  <dt>Tipo de pago</dt>
                  <dd>
                    {PAYMENT_TYPES[tx.payment_type_code] ?? tx.payment_type_code}
                    {tx.installments_number ? `, ${tx.installments_number} cuotas` : ''}
                  </dd>
                </div>
              )}
              {tx.transaction_date && (
                <div>
                  <dt>Fecha</dt>
                  <dd>
                    {new Date(tx.transaction_date).toLocaleString('es-CL', { timeZone: 'America/Santiago' })}
                  </dd>
                </div>
              )}
            </dl>
            <Link className="button button--primary" href="/">
              Volver a la tienda
            </Link>
          </>
        ) : (
          <>
            <p className="checkout-result__icon" aria-hidden="true">
              !
            </p>
            <h1 className="page-title">
              {estado === 'anulado'
                ? 'Pago cancelado'
                : estado === 'rechazado'
                  ? 'Pago rechazado'
                  : 'No pudimos completar el pago'}
            </h1>
            <p>
              {estado === 'anulado'
                ? 'Cancelaste el pago en Webpay. Tu carrito sigue guardado.'
                : estado === 'rechazado'
                  ? 'Tu banco rechazó la transacción. No se realizó ningún cargo; puedes intentar con otro medio de pago.'
                  : 'La transacción no se completó y no se realizó ningún cargo. Intenta nuevamente.'}
              {orden ? ` Orden ${orden}.` : ''}
            </p>
            <div className="checkout-result__actions">
              <Link className="button button--primary" href="/checkout">
                Intentar de nuevo
              </Link>
              <a
                className="button"
                href={`https://wa.me/${site.contact.whatsapp}`}
                target="_blank"
                rel="noopener"
              >
                Pedir ayuda por WhatsApp
              </a>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
