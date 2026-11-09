"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { CartLine } from "@/lib/types";
import { MAX_QUANTITY_PER_LINE } from "@/lib/order";
import {
  CART_STORAGE_KEY,
  parseStoredCart,
  serializeCart,
} from "@/lib/cart";

type CartContextValue = {
  lines: CartLine[];
  itemCount: number;
  hydrated: boolean;
  addItem: (variantId: string, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function clampQuantity(q: number): number {
  if (!Number.isFinite(q)) return 1;
  const n = Math.trunc(q);
  if (n < 1) return 1;
  if (n > MAX_QUANTITY_PER_LINE) return MAX_QUANTITY_PER_LINE;
  return n;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const hydratedRef = useRef(false);

  // Hydrate once on mount. The first paint renders with lines = [],
  // which is deliberate. No badge is rendered until hydrated is true.
  useEffect(() => {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(CART_STORAGE_KEY);
    } catch {
      raw = null;
    }
    setLines(parseStoredCart(raw));
    setHydrated(true);
    hydratedRef.current = true;
  }, []);

  // Persist on every change, but only after hydration, so the initial
  // empty state never overwrites whatever was already in storage.
  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, serializeCart(lines));
    } catch {
      // Quota exceeded or storage disabled. The in-memory state remains
      // valid; the next successful write will sync.
    }
  }, [lines]);

  // Keep tabs in sync. Only the "storage" event fires across documents;
  // the writing tab handles its own state through setLines.
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== CART_STORAGE_KEY) return;
      if (event.storageArea !== window.localStorage) return;
      setLines(parseStoredCart(event.newValue));
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addItem = useCallback((variantId: string, quantity = 1) => {
    if (typeof variantId !== "string" || variantId.length === 0) return;
    const q = clampQuantity(quantity);
    setLines((prev) => {
      const existing = prev.find((l) => l.variantId === variantId);
      if (existing) {
        return prev.map((l) =>
          l.variantId === variantId
            ? { ...l, quantity: clampQuantity(l.quantity + q) }
            : l,
        );
      }
      return [...prev, { variantId, quantity: q }];
    });
  }, []);

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    const q = clampQuantity(quantity);
    setLines((prev) =>
      prev.map((l) => (l.variantId === variantId ? { ...l, quantity: q } : l)),
    );
  }, []);

  const removeItem = useCallback((variantId: string) => {
    setLines((prev) => prev.filter((l) => l.variantId !== variantId));
  }, []);

  const clear = useCallback(() => {
    setLines([]);
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);
    return {
      lines,
      itemCount,
      hydrated,
      addItem,
      setQuantity,
      removeItem,
      clear,
    };
  }, [lines, hydrated, addItem, setQuantity, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (ctx === null) {
    throw new Error("useCart must be used inside a CartProvider.");
  }
  return ctx;
}