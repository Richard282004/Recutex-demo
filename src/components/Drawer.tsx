'use client';

/*
  Accessible drawer (menu, search, cart, filters): focus moves in and is trapped, Escape and
  overlay click close it, focus returns to the opener, page scroll is locked while open.
*/
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])';

export function Drawer({
  id,
  open,
  onClose,
  side = 'right',
  title,
  hideHeader = false,
  className,
  panelClassName,
  children,
  footer,
  initialFocus,
}: {
  id?: string;
  open: boolean;
  onClose: () => void;
  side?: 'left' | 'right' | 'top' | 'bottom';
  title: React.ReactNode;
  hideHeader?: boolean;
  className?: string;
  panelClassName?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  initialFocus?: React.RefObject<HTMLElement | null>;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // Portal to <body>: ancestors with backdrop-filter/transform (e.g. the sticky header)
  // would otherwise become the containing block of this fixed-position overlay.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- enable portal after hydration
    setMounted(true);
  }, []);
  const openerRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement;
    document.body.classList.add('is-locked');
    const frame = requestAnimationFrame(() =>
      (initialFocus?.current ?? panelRef.current)?.focus({ preventScroll: true }),
    );

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null,
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
      document.body.classList.remove('is-locked');
      (openerRef.current as HTMLElement | null)?.focus?.({ preventScroll: true });
    };
  }, [open, onClose, initialFocus]);

  if (!mounted) return null;

  return createPortal(
    <div
      id={id}
      className={`drawer drawer--${side}${className ? ` ${className}` : ''}`}
      data-open={open || undefined}
      aria-hidden={!open}
      inert={!open}
    >
      <div className="drawer__overlay" onClick={onClose} />
      <div
        ref={panelRef}
        className={`drawer__panel${panelClassName ? ` ${panelClassName}` : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        tabIndex={-1}
      >
        {!hideHeader && (
          <div className="drawer__header">
            <h2 className="drawer__title">{title}</h2>
            <button className="icon-button" type="button" onClick={onClose}>
              <Icon name="close" />
              <span className="visually-hidden">Cerrar</span>
            </button>
          </div>
        )}
        <div className="drawer__body">{children}</div>
        {footer && <div className="drawer__footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
