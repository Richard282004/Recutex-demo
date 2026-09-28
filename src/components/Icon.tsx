const paths: Record<string, React.ReactNode> = {
  menu: <path d="M3 7h18M3 12h18M3 17h18" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  cart: (
    <>
      <path d="M5 8h14l-1.1 11.1a1 1 0 0 1-1 .9H7.1a1 1 0 0 1-1-.9L5 8Z" />
      <path d="M9 8V7a3 3 0 0 1 6 0v1" />
    </>
  ),
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  'chevron-right': <path d="m9 6 6 6-6 6" />,
  'chevron-left': <path d="m15 6-6 6 6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  factory: (
    <>
      <path d="M3 21V10l5 3V10l5 3V10l5 3V4h3v17H3Z" />
      <path d="M7 17h2M12 17h2" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  truck: (
    <>
      <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" />
      <circle cx="7" cy="18" r="1.8" />
      <circle cx="17" cy="18" r="1.8" />
    </>
  ),
  chat: (
    <>
      <path d="M4 5h16v11H9l-5 4V5Z" />
      <path d="M8 10h8M8 13h5" />
    </>
  ),
  recycle: (
    <>
      <path d="M7 19H4.5a1.5 1.5 0 0 1-1.3-2.3L6 12M17 19h2.5a1.5 1.5 0 0 0 1.3-2.3L18 12M9 5.5l1.7-2.8a1.5 1.5 0 0 1 2.6 0L15 5.5" />
      <path d="m4 9 2 3 3-1M20 9l-2 3-3-1M9 19h6M13 17l2 2-2 2" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
};

export function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <svg
      className={`icon icon--${name}${className ? ` ${className}` : ''}`}
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name] ?? <circle cx="12" cy="12" r="8" />}
    </svg>
  );
}

/** The six coloured strands of the Recutex logo, used as a thin brand accent. */
export function BrandBands({ className }: { className?: string }) {
  return (
    <div className={`brand-bands${className ? ` ${className}` : ''}`} aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}
