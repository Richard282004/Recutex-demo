import type { Metadata } from 'next';
import { CartPageView } from './CartPageView';

export const metadata: Metadata = { title: 'Carrito', robots: { index: false } };

export default function CartPage() {
  return (
    <section className="section cart">
      <div className="page-width page-width--narrow">
        <h1 className="page-title">Tu carrito</h1>
        <CartPageView />
      </div>
    </section>
  );
}
