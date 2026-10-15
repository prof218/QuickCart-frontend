'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { CartLine, Product } from '@/types';
import { useAuth } from '@/context/AuthContext';

const STORAGE_PREFIX = 'quickcart:cart:v1';
// Cart is namespaced per user id so one account's cart never leaks to another.
// Guests use a separate bucket (but purchase actions are gated, so it stays empty).
const keyFor = (userId: string | null) => `${STORAGE_PREFIX}:${userId ?? 'guest'}`;

interface CartContextValue {
  items: CartLine[];
  itemCount: number; // total quantity across lines
  subtotal: number; // paise — DISPLAY ESTIMATE ONLY
  hydrated: boolean; // true after localStorage has loaded (avoids SSR mismatch)
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

/** Validate + sanitize data read from localStorage (may be corrupted/outdated). */
function parseStoredCart(raw: string | null): CartLine[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const lines: CartLine[] = [];
    for (const entry of parsed) {
      if (!entry || typeof entry !== 'object') continue;
      const e = entry as Record<string, unknown>;
      const id = typeof e.id === 'string' ? e.id : null;
      const name = typeof e.name === 'string' ? e.name : '';
      const price = typeof e.price === 'number' && e.price >= 0 ? e.price : null;
      const image = typeof e.image === 'string' ? e.image : '';
      const stock = typeof e.stock === 'number' && e.stock >= 0 ? Math.floor(e.stock) : 0;
      const quantityRaw = typeof e.quantity === 'number' ? Math.floor(e.quantity) : 0;
      if (!id || price === null || quantityRaw < 1) continue;
      // Cap quantity to the last known stock (if any).
      const quantity = stock > 0 ? Math.min(quantityRaw, stock) : quantityRaw;
      lines.push({ id, name, price, image, stock, quantity });
    }
    return lines;
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  // Always start empty so SSR and the first client render match (no hydration mismatch).
  const [items, setItems] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const loadedRef = useRef(false);
  const activeUserRef = useRef<string | null>(null);

  // Load the correct cart on mount and whenever the user changes (login/logout).
  // Setting state here is intentional: we hydrate from localStorage (an external store)
  // for the active user. Because this effect runs before the parent AuthProvider resumes
  // a pending action, a post-login "add to cart" lands on the freshly-loaded user cart.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    loadedRef.current = false;
    activeUserRef.current = userId;
    try {
      setItems(parseStoredCart(window.localStorage.getItem(keyFor(userId))));
    } catch {
      setItems([]);
    } finally {
      loadedRef.current = true;
      setHydrated(true);
    }
  }, [userId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Persist whenever items change — to the active user's bucket only (never another user's).
  useEffect(() => {
    if (!loadedRef.current) return;
    try {
      window.localStorage.setItem(keyFor(activeUserRef.current), JSON.stringify(items));
    } catch {
      /* storage unavailable (private mode / quota) — ignore */
    }
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    const clamp = (qty: number, stock: number) =>
      stock > 0 ? Math.max(1, Math.min(qty, stock)) : Math.max(1, qty);

    return {
      items,
      itemCount: items.reduce((n, l) => n + l.quantity, 0),
      subtotal: items.reduce((s, l) => s + l.price * l.quantity, 0),
      hydrated,

      addItem(product, quantity = 1) {
        setItems((prev) => {
          const existing = prev.find((l) => l.id === product.id);
          if (existing) {
            // No duplicate lines — bump the existing one, capped at stock.
            return prev.map((l) =>
              l.id === product.id
                ? { ...l, stock: product.stock, quantity: clamp(l.quantity + quantity, product.stock) }
                : l,
            );
          }
          return [
            ...prev,
            {
              id: product.id,
              name: product.name,
              price: product.price,
              image: product.image,
              stock: product.stock,
              quantity: clamp(quantity, product.stock),
            },
          ];
        });
      },

      removeItem(id) {
        setItems((prev) => prev.filter((l) => l.id !== id));
      },

      updateQuantity(id, quantity) {
        setItems((prev) =>
          prev.flatMap((l) => {
            if (l.id !== id) return [l];
            if (quantity < 1) return []; // drop the line
            return [{ ...l, quantity: clamp(quantity, l.stock) }];
          }),
        );
      },

      clearCart() {
        setItems([]);
      },
    };
  }, [items, hydrated]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
