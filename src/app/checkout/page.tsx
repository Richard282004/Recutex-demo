import type { Metadata } from 'next';
import { isWebpayTestMode } from '@/lib/webpay';
import { CheckoutForm } from './CheckoutForm';

export const metadata: Metadata = { title: 'Finalizar compra', robots: { index: false } };

export default function CheckoutPage() {
  return (
    <section className="section">
      <div className="page-width">
        <h1 className="page-title">Finalizar compra</h1>
        <CheckoutForm testMode={isWebpayTestMode()} />
      </div>
    </section>
  );
}
