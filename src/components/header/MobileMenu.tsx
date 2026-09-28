'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { NavItem } from '@/content/site';
import { Drawer } from '../Drawer';
import { Icon } from '../Icon';

export function MobileMenu({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- close on navigation
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        className="icon-button site-header__menu-toggle"
        type="button"
        aria-expanded={open}
        aria-controls="MenuDrawer"
        onClick={() => setOpen(true)}
      >
        <Icon name="menu" />
        <span className="visually-hidden">Menú</span>
      </button>
      <Drawer id="MenuDrawer" open={open} onClose={() => setOpen(false)} side="left" title="Menú">
        <nav className="menu-drawer" aria-label="Navegación principal">
          <ul className="menu-drawer__list" role="list">
            {items.map((item) => (
              <li key={item.title}>
                {item.children?.length ? (
                  <details className="accordion menu-drawer__group">
                    <summary>{item.title}</summary>
                    <div className="accordion__content">
                      <ul role="list">
                        {item.children.map((child) => (
                          <li key={child.title}>
                            <Link href={child.href}>{child.title}</Link>
                            {child.children && (
                              <ul role="list" className="menu-drawer__sublist">
                                {child.children.map((link) => (
                                  <li key={link.title}>
                                    <Link href={link.href}>{link.title}</Link>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        ))}
                        <li>
                          <Link className="link" href={item.href}>
                            Ver todo {item.title}
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </details>
                ) : (
                  <Link className="menu-drawer__link" href={item.href}>
                    {item.title}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </Drawer>
    </>
  );
}
