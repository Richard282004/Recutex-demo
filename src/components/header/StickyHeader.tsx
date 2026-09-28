'use client';

/** Sticky header: condensed shadow after scrolling, hides going down, reappears going up. */
import { useEffect, useRef, useState } from 'react';

export function StickyHeader({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 8);
        const menuOpen = document.querySelector('.mega-menu.is-open, .drawer[data-open]');
        setHidden(!menuOpen && y > lastY.current && y > 400);
        lastY.current = y;
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className={`section-header${hidden ? ' is-hidden' : ''}`}>
      <header className={`site-header${scrolled ? ' is-scrolled' : ''}`}>{children}</header>
    </div>
  );
}
