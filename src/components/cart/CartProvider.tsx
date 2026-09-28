'use client';

/*
  Cart state lives in the browser (localStorage). Line prices are display-only: the server
  recalculates every amount from the catalog before creating the payment (see checkout/actions.ts).
*/
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type CartLine = {
  variantId: string;
  handle: string;
  title: string;
  variantTitle: string | null;
  price: number;
  compareAtPrice: number | null;
  image: string | null;
  quantity: number;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  ready: boolean;
  open: () => void;
  close: () => void;
  add: (line: Omit<CartLine, 'quantity'>, quantity?: number) => void;
  update: (variantId: string, quantity: number) => void;
  clear: () => void;
};

// v2: images moved from remote CDNs to /media; older carts would reference URLs no longer allowed.
const STORAGE_KEY = 'recutex-cart-v2';
const MAX_QUANTITY = 20;
const CartContext = createContext<CartContextValue | null>(null);

function readStorage(): CartLine[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Hydrate after mount so server and client markup match.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from localStorage
    setLines(readStorage());
    setReady(true);
    const onStorage = (event: StorageEvent) => event.key === STORAGE_KEY && setLines(readStorage());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Private mode / storage full: the cart still works for this page view.
    }
  }, [lines, ready]);

  const add = useCallback<CartContextValue['add']>((line, quantity = 1) => {
    setLines((current) => {
      const existing = current.find((l) => l.variantId === line.variantId);
      if (existing) {
        return current.map((l) =>
          l.variantId === line.variantId
            ? { ...l, ...line, quantity: Math.min(MAX_QUANTITY, l.quantity + quantity) }
            : l,
        );
      }
      return [...current, { ...line, quantity: Math.min(MAX_QUANTITY, quantity) }];
    });
  }, []);

  const update = useCallback((variantId: string, quantity: number) => {
    setLines((current) =>
      quantity <= 0
        ? current.filter((l) => l.variantId !== variantId)
        : current.map((l) =>
            l.variantId === variantId ? { ...l, quantity: Math.min(MAX_QUANTITY, quantity) } : l,
          ),
    );
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: lines.reduce((sum, l) => sum + l.quantity, 0),
      subtotal: lines.reduce((sum, l) => sum + l.price * l.quantity, 0),
      isOpen,
      ready,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      add,
      update,
      clear: () => setLines([]),
    }),
    [lines, isOpen, ready, add, update],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside <CartProvider>');
  return context;
}
