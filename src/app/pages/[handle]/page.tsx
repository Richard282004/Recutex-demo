import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { pages } from '@/content/site';

type Props = { params: Promise<{ handle: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(pages).map((handle) => ({ handle }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const page = pages[handle];
  return page
    ? { title: page.title, description: page.description, alternates: { canonical: `/pages/${handle}` } }
    : {};
}

export default async function ContentPage({ params }: Props) {
  const { handle } = await params;
  const page = pages[handle];
  if (!page) notFound();
  const html = await readFile(path.join(process.cwd(), 'data', 'pages', `${handle}.html`), 'utf8');

  return (
    <section className="section page">
      <div className="page-width page-width--narrow">
        <Breadcrumbs items={[{ title: page.title }]} />
        <h1 className="page-title">{page.title}</h1>
        {page.draft && (
          <p className="page__draft" role="note">
            Borrador para la demo: este texto debe ser validado por Recutex y un abogado antes de publicarse.
            Los datos marcados están pendientes.
          </p>
        )}
        <div className="rte" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </section>
  );
}
