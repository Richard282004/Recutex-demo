import Link from 'next/link';
import { site } from '@/content/site';

export type Crumb = { title: string; href?: string };

/** Visual breadcrumbs + BreadcrumbList structured data. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ title: 'Inicio', href: '/' }, ...items];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: all.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.title,
      ...(crumb.href ? { item: new URL(crumb.href, site.url).toString() } : {}),
    })),
  };
  return (
    <nav className="breadcrumbs" aria-label="Ruta de navegación">
      <ol>
        {all.map((crumb, i) =>
          crumb.href && i < all.length - 1 ? (
            <li key={crumb.title}>
              <Link href={crumb.href}>{crumb.title}</Link>
            </li>
          ) : (
            <li key={crumb.title} aria-current="page">
              {crumb.title}
            </li>
          ),
        )}
      </ol>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </nav>
  );
}
