import Link from 'next/link';
import { navigation, site } from '@/content/site';
import { getCollectionProducts } from '@/lib/catalog';
import { BrandBands } from '../Icon';
import { CartButton } from './CartButton';
import { MegaMenu, type MenuItemWithPromo } from './MegaMenu';
import { MobileMenu } from './MobileMenu';
import { SearchButton } from './SearchOverlay';
import { StickyHeader } from './StickyHeader';

export async function Header() {
  // Promo image for each mega menu: first product photo of the referenced collection.
  const items: MenuItemWithPromo[] = await Promise.all(
    navigation.map(async ({ promo, ...item }) => {
      if (!promo) return item;
      const product = (await getCollectionProducts(promo.collection)).find((p) => p.images.length > 0);
      return {
        ...item,
        promo: {
          title: promo.title,
          text: promo.text,
          href: `/collections/${promo.collection}`,
          image: product?.images[0]?.src ?? null,
        },
      };
    }),
  );

  return (
    <>
      <div className="announcement-bar" role="region" aria-label="Anuncios">
        <div className="page-width announcement-bar__inner">
          <p className="announcement-bar__message">
            <a href={site.announcement.href} target="_blank" rel="noopener">
              {site.announcement.text}
            </a>
          </p>
        </div>
      </div>
      <StickyHeader>
        <BrandBands className="site-header__bands" />
        <div className="page-width site-header__inner">
          <MobileMenu items={navigation} />
          <div className="site-header__logo">
            <Link href="/" className="site-header__logo-link" aria-label={`${site.name}, inicio`}>
              <span className="site-header__logo-text">{site.name}</span>
            </Link>
          </div>
          <MegaMenu items={items} />
          <div className="site-header__actions">
            <SearchButton />
            <CartButton />
          </div>
        </div>
      </StickyHeader>
    </>
  );
}
