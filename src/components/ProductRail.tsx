'use client';

/** Horizontal rail with native scroll-snap (touch swipe) plus prev/next buttons on desktop. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';

export function RailControls({ targetId }: { targetId: string }) {
  const [edges, setEdges] = useState({ start: true, end: false });
  const trackRef = useRef<HTMLElement | null>(null);

  const update = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setEdges({
      start: track.scrollLeft <= 4,
      end: track.scrollLeft + track.clientWidth >= track.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    trackRef.current = document.getElementById(targetId);
    const track = trackRef.current;
    if (!track) return;
    update();
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      track.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [targetId, update]);

  const scroll = (direction: number) => {
    const track = trackRef.current;
    if (!track) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    track.scrollBy({ left: direction * track.clientWidth * 0.9, behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <div className="rail-controls">
      <button
        className="icon-button"
        type="button"
        onClick={() => scroll(-1)}
        disabled={edges.start}
        aria-label="Anterior"
      >
        <Icon name="chevron-left" />
      </button>
      <button
        className="icon-button"
        type="button"
        onClick={() => scroll(1)}
        disabled={edges.end}
        aria-label="Siguiente"
      >
        <Icon name="chevron-right" />
      </button>
    </div>
  );
}
