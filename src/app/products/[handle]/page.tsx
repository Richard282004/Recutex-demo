import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { CollectionRail } from '@/components/home/sections';
import { Icon } from '@/components/Icon';
import { ProductView } from '@/components/product/ProductForm';
import { shipping, site } from '@/content/site';
import { getCollection, getCollectionProducts, getProduct } from '@/lib/catalog';
import { displayTitle } from '@/lib/format';

type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct((await params).handle);
  if (!product) return {};
  const title = displayTitle(product.title);
  return {
    title,
    description: product.description || site.description,
    alternates: { canonical: `/products/${product.handle}` },
    openGraph: {
      title,
      images: product.images.slice(0, 1).map((i) => ({ url: i.src, width: i.width, height: i.height })),
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProduct((await params).handle);
  if (!product) notFound();

  const title = displayTitle(product.title);
  const mainCollection = (await Promise.all(product.collections.map(getCollection))).find(
    (c) => c && !['home', 'ofertas'].includes(c.handle),
  );
  const related = mainCollection
    ? (await getCollectionProducts(mainCollection.handle)).filter((p) => p.id !== product.id)
    : [];
  const whatsappText = encodeURIComponent(
    `Hola, quiero consultar por ${title}: ${site.url}/products/${product.handle}`,
  );

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: title,
    image: product.images.map((i) => new URL(i.src, site.url).toString()),
    description: product.description,
    sku: product.variants[0]?.sku ?? undefined,
    brand: { '@type': 'Brand', name: product.vendor },
    offers: product.variants.map((v) => ({
      '@type': 'Offer',
      price: v.price,
      priceCurrency: 'CLP',
      availability: v.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${site.url}/products/${product.handle}?variant=${v.id}`,
    })),
  };

  const info = (
    <>
      <a
        className="product__contact"
        href={`https://wa.me/${site.contact.whatsapp}?text=${whatsappText}`}
        target="_blank"
        rel="noopener"
      >
        <Icon name="chat" />
        <span>¿Dudas? Escríbenos por WhatsApp</span>
      </a>
      <div>
        {product.descriptionHtml && (
          <details className="accordion" open>
            <summary>Descripción</summary>
            <div
              className="accordion__content rte"
              dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
            />
          </details>
        )}
        <details className="accordion">
          <summary>Plazos de despacho</summary>
          <div className="accordion__content rte">
            {shipping.times.map((t) => (
              <p key={t}>{t}</p>
            ))}
          </div>
        </details>
        <details className="accordion">
          <summary>Garantía</summary>
          <div className="accordion__content rte">
            <p>
              6 meses de garantía legal desde que recibes el producto: ante una falla de fabricación eliges
              reparación, cambio o devolución. Escríbenos a{' '}
              <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a> detallando el desperfecto.
            </p>
            <p>
              Además tienes 10 días de derecho a retracto desde la recepción.{' '}
              <Link href="/pages/devolucion-y-garantia">Ver condiciones</Link>
            </p>
          </div>
        </details>
      </div>
    </>
  );

  return (
    <>
      <section className="section product">
        <div className="page-width">
          <Breadcrumbs
            items={[
              ...(mainCollection
                ? [{ title: mainCollection.title, href: `/collections/${mainCollection.handle}` }]
                : []),
              { title },
            ]}
          />
          <ProductView product={product} info={info} />
        </div>
      </section>
      <CollectionRail id="related" title="También te puede interesar" products={related} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
