'use client';

/*
  Reveal-on-scroll for [data-reveal] elements (IntersectionObserver, no scroll-jacking).
  A MutationObserver picks up content added later (route changes, filters). The layout's inline
  script arms the effect before paint and disarms it if this never runs.
*/
import { useEffect } from 'react';

export function Reveal() {
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-reveal-ready', '');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !root.classList.contains('reveal-armed')) {
      root.classList.remove('reveal-armed');
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries
          .filter((entry) => entry.isIntersecting)
          .forEach((entry, index) => {
            const el = entry.target as HTMLElement;
            el.style.setProperty('--reveal-index', String(index));
            el.classList.add('is-visible');
            io.unobserve(el);
          });
      },
      { rootMargin: '0px 0px 10% 0px', threshold: 0 },
    );

    const scan = (node: ParentNode) =>
      node.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-visible)').forEach((el) => io.observe(el));
    scan(document);

    const mo = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches('[data-reveal]:not(.is-visible)')) io.observe(node);
          scan(node);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
