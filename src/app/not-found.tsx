import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="section">
      <div className="page-width page-width--narrow text-center not-found">
        <h1 className="page-title">Página no encontrada</h1>
        <p>La página que buscas no existe o cambió de dirección.</p>
        <Link className="button button--primary" href="/collections">
          Ver categorías
        </Link>
      </div>
    </section>
  );
}
