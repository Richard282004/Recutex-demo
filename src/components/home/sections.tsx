import Image from 'next/image';
import Link from 'next/link';
import { getCollection, getCollectionProducts, getProduct } from '@/lib/catalog';
import type { Product } from '@/lib/types';
import { Icon } from '../Icon';
import { ProductCard } from '../ProductCard';
import { RailControls } from '../ProductRail';
import { NewsletterForm } from './NewsletterForm';

/* ---------- Hero: the brand moment (logo strands stack in once under the headline) ---------- */

export async function Hero({
  title,
  subtitle,
  productHandle,
  primary,
  secondary,
}: {
  title: string;
  subtitle: string;
  productHandle: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
}) {
  const image = (await getProduct(productHandle))?.images[0];
  return (
    <section className="hero hero--split hero--contain" aria-labelledby="HeroTitle">
      <div className="hero__media">
        {image && (
          <Image
            className="hero__image"
            src={image.src}
            alt={image.alt}
            fill
            priority
            fetchPriority="high"
            sizes="(min-width: 990px) 55vw, 100vw"
          />
        )}
      </div>
      <div className="hero__content page-width">
        <div className="hero__text">
          <h1 className="hero__title" id="HeroTitle">
            {title}
          </h1>
          <div className="hero__bands" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <p className="hero__subtitle">{subtitle}</p>
          <div className="hero__actions">
            <Link className="button button--primary" href={primary.href}>
              {primary.label}
            </Link>
            <Link className="button" href={secondary.href}>
              {secondary.label}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Category tiles ---------- */

export async function CollectionTiles({
  items,
}: {
  items: readonly { collection: string; title?: string }[];
}) {
  const tiles = (
    await Promise.all(
      items.map(async (item) => {
        const collection = await getCollection(item.collection);
        const products = await getCollectionProducts(item.collection);
        if (!collection || products.length === 0) return null;
        return {
          handle: collection.handle,
          title: item.title ?? collection.title,
          count: products.length,
          image: products.find((p) => p.images.length)?.images[0]?.src ?? null,
        };
      }),
    )
  ).filter((t) => t !== null);

  return (
    <section className="section collection-tiles" aria-labelledby="CategoriesTitle">
      <div className="page-width">
        <div className="section__header">
          <h2 className="section__title" id="CategoriesTitle">
            Explora por categoría
          </h2>
          <Link className="link" href="/collections">
            Ver todas
          </Link>
        </div>
        <ul className="collection-tiles__list" role="list">
          {tiles.map((tile, index) => (
            <li
              className={`collection-tile${index === 0 ? ' collection-tile--featured' : ''}`}
              key={tile.handle}
              data-reveal
            >
              <Link className="collection-tile__link" href={`/collections/${tile.handle}`}>
                <span className="collection-tile__media collection-tile__media--contain">
                  {tile.image && (
                    <Image
                      src={tile.image}
                      alt=""
                      fill
                      sizes={index === 0 ? '(min-width: 990px) 50vw, 62vw' : '(min-width: 990px) 25vw, 62vw'}
                    />
                  )}
                </span>
                <span className="collection-tile__text">
                  <span className="collection-tile__title">{tile.title}</span>
                  <span className="collection-tile__count">
                    {tile.count} {tile.count === 1 ? 'producto' : 'productos'}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------- Product rail / grid from a collection ---------- */

export async function CollectionRail({
  id,
  title,
  subtitle,
  collection,
  products: provided,
  layout = 'rail',
  tinted = false,
  linkLabel = 'Ver todo',
  limit = 10,
}: {
  id: string;
  title: string;
  subtitle?: string;
  collection?: string;
  products?: Product[];
  layout?: 'rail' | 'grid';
  tinted?: boolean;
  linkLabel?: string;
  limit?: number;
}) {
  // Many catalog items share one photo across sizes; show one card per photo to keep rails varied.
  const seen = new Set<string>();
  const products = (provided ?? (collection ? await getCollectionProducts(collection) : []))
    .filter((p) => {
      const key = p.images[0]?.src ?? p.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
  if (products.length === 0) return null;
  const trackId = `Rail-${id}`;
  return (
    <section
      className={`section featured-collection${tinted ? ' section--tinted' : ''}`}
      aria-labelledby={`${id}-title`}
    >
      <div className="page-width">
        <div className="section__header">
          <div>
            <h2 className="section__title" id={`${id}-title`}>
              {title}
            </h2>
            {subtitle && <p className="section__subtitle">{subtitle}</p>}
          </div>
          <div className="featured-collection__actions">
            {collection && (
              <Link className="link" href={`/collections/${collection}`}>
                {linkLabel}
              </Link>
            )}
            {layout === 'rail' && <RailControls targetId={trackId} />}
          </div>
        </div>
        <ul className={layout === 'rail' ? 'rail' : 'product-grid'} id={trackId} role="list">
          {products.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------- Editorial / storytelling ---------- */

export async function Editorial({
  title,
  text,
  productHandle,
  cta,
}: {
  title: string;
  text: string;
  productHandle: string;
  cta: { label: string; href: string };
}) {
  const image = (await getProduct(productHandle))?.images[0];
  return (
    <section className="section editorial" aria-labelledby="StoryTitle">
      <div className="page-width editorial__grid">
        <div className="editorial__media" data-reveal>
          {image && <Image src={image.src} alt={image.alt} fill sizes="(min-width: 990px) 50vw, 100vw" />}
        </div>
        <div className="editorial__text" data-reveal>
          <h2 className="editorial__title" id="StoryTitle">
            {title}
          </h2>
          <div className="editorial__body">
            <p>{text}</p>
          </div>
          <Link className="button" href={cta.href}>
            {cta.label}
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------- Benefits ---------- */

export function Benefits({
  items,
}: {
  items: readonly { icon: string; title: string; text: string; link?: { label: string; href: string } }[];
}) {
  return (
    <section className="section benefits" aria-labelledby="BenefitsTitle">
      <div className="page-width">
        <h2 className="section__title benefits__heading" id="BenefitsTitle">
          Por qué comprar en Recutex
        </h2>
        <ul className="benefits__list" role="list">
          {items.map((item) => (
            <li className="benefit" key={item.title} data-reveal>
              <span className="benefit__icon">
                <Icon name={item.icon} />
              </span>
              <h3 className="benefit__title">{item.title}</h3>
              <p className="benefit__text">{item.text}</p>
              {item.link && (
                <Link className="link benefit__link" href={item.link.href}>
                  {item.link.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------- Newsletter ---------- */

export function Newsletter() {
  return (
    <section className="section newsletter" aria-labelledby="NewsletterTitle">
      <div className="page-width">
        <div className="newsletter__card">
          <div className="brand-bands newsletter__bands" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="newsletter__text">
            <h2 className="newsletter__title" id="NewsletterTitle">
              Ofertas en tu correo
            </h2>
            <p className="newsletter__subtitle">Suscríbete para recibir nuestras promociones y novedades.</p>
          </div>
          <NewsletterForm />
        </div>
      </div>
    </section>
  );
}
