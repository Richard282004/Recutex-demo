'use client';

/*
  Desktop mega menu (disclosure pattern). Opens on hover-intent for pointer devices and on
  click/Enter for keyboard and touch. Escape closes and returns focus to the trigger.
*/
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { NavItem } from '@/content/site';
import { Icon } from '../Icon';

export type MenuItemWithPromo = Omit<NavItem, 'promo'> & {
  promo?: { title: string; text: string; href: string; image?: string | null };
};

export function MegaMenu({ items }: { items: MenuItemWithPromo[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const pathname = usePathname();
  const timers = useRef<{ open?: number; close?: number }>({});
  const openedAt = useRef(0);
  const navRef = useRef<HTMLElement>(null);

  // Close whenever the route changes.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset UI state on navigation
    setOpenIndex(null);
  }, [pathname]);

  // Timestamps come from the DOM event (event.timeStamp) to keep render pure.
  const hover = (index: number | null, timeStamp: number) => {
    if (!window.matchMedia('(hover: hover)').matches) return;
    window.clearTimeout(timers.current.open);
    window.clearTimeout(timers.current.close);
    if (index === null) {
      timers.current.close = window.setTimeout(() => setOpenIndex(null), 180);
    } else {
      timers.current.open = window.setTimeout(() => {
        openedAt.current = timeStamp + 90;
        setOpenIndex(index);
      }, 90);
    }
  };

  // Ignore the click that immediately follows a hover-open, so hover + click doesn't close it.
  const toggle = (index: number, timeStamp: number) => {
    const justOpened = timeStamp - openedAt.current < 400;
    if (openIndex === index && !justOpened) setOpenIndex(null);
    else {
      if (openIndex !== index) openedAt.current = timeStamp;
      setOpenIndex(index);
    }
  };

  return (
    <nav
      className="site-nav"
      aria-label="Navegación principal"
      ref={navRef}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && openIndex !== null) {
          navRef.current?.querySelector<HTMLButtonElement>(`[data-trigger="${openIndex}"]`)?.focus();
          setOpenIndex(null);
        }
      }}
      onBlur={(event) => {
        if (!navRef.current?.contains(event.relatedTarget as Node)) setOpenIndex(null);
      }}
    >
      <ul className="site-nav__list" role="list">
        {items.map((item, index) =>
          item.children?.length ? (
            <li
              className="site-nav__item"
              key={item.title}
              onMouseEnter={(event) => hover(index, event.timeStamp)}
              onMouseLeave={(event) => hover(null, event.timeStamp)}
            >
              <button
                className="site-nav__link site-nav__trigger"
                type="button"
                data-trigger={index}
                aria-expanded={openIndex === index}
                aria-controls={`MegaMenu-${index}`}
                onClick={(event) => toggle(index, event.timeStamp)}
              >
                {item.title}
                <Icon name="chevron-down" />
              </button>
              <div
                className={`mega-menu${openIndex === index ? ' is-open' : ''}`}
                id={`MegaMenu-${index}`}
                hidden={openIndex !== index}
              >
                <div className="page-width mega-menu__inner">
                  <div className="mega-menu__columns">
                    {item.children.map((child) => (
                      <div className="mega-menu__column" key={child.title}>
                        <Link className="mega-menu__heading" href={child.href}>
                          {child.title}
                        </Link>
                        {child.children && (
                          <ul className="mega-menu__links" role="list">
                            {child.children.map((link) => (
                              <li key={link.title}>
                                <Link href={link.href}>{link.title}</Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                    <div className="mega-menu__column">
                      <Link className="link" href={item.href}>
                        Ver todo {item.title}
                      </Link>
                    </div>
                  </div>
                  {item.promo && (
                    <Link className="mega-menu__promo" href={item.promo.href}>
                      {item.promo.image && (
                        <Image
                          className="mega-menu__promo-image"
                          src={item.promo.image}
                          alt=""
                          fill
                          sizes="360px"
                        />
                      )}
                      <span className="mega-menu__promo-text">
                        <strong>{item.promo.title}</strong>
                        <span>{item.promo.text}</span>
                      </span>
                    </Link>
                  )}
                </div>
              </div>
            </li>
          ) : (
            <li className="site-nav__item" key={item.title}>
              <Link
                className="site-nav__link"
                href={item.href}
                aria-current={pathname === item.href ? 'page' : undefined}
              >
                {item.title}
              </Link>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}
