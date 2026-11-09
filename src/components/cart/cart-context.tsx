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

export type LastAnnouncement = { message: string; key: number };

type CartContextValue = {
  lines: CartLine[];
  itemCount: number;
  hydrated: boolean;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (variantId: string, quantity?: number, label?: string) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clear: () => void;
  lastAnnouncement: LastAnnouncement | null;
  clearAnnouncement: () => void;
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lastAnnouncement, setLastAnnouncement] =
    useState<LastAnnouncement | null>(null);
  const hydratedRef = useRef(false);
  const announcementKeyRef = useRef(0);

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

  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, serializeCart(lines));
    } catch {
      // Quota or storage disabled; in-memory state remains valid.
    }
  }, [lines]);

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== CART_STORAGE_KEY) return;
      if (event.storageArea !== window.localStorage) return;
      setLines(parseStoredCart(event.newValue));
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addItem = useCallback(
    (variantId: string, quantity = 1, label?: string) => {
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
      if (label) {
        announcementKeyRef.current += 1;
        setLastAnnouncement({
          message: `${label} added to cart`,
          key: announcementKeyRef.current,
        });
      }
    },
    [],
  );

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

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const clearAnnouncement = useCallback(
    () => setLastAnnouncement(null),
    [],
  );

  const value = useMemo<CartContextValue>(() => {
    const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);
    return {
      lines,
      itemCount,
      hydrated,
      drawerOpen,
      openDrawer,
      closeDrawer,
      addItem,
      setQuantity,
      removeItem,
      clear,
      lastAnnouncement,
      clearAnnouncement,
    };
  }, [
    lines,
    hydrated,
    drawerOpen,
    openDrawer,
    closeDrawer,
    addItem,
    setQuantity,
    removeItem,
    clear,
    lastAnnouncement,
    clearAnnouncement,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (ctx === null) {
    throw new Error("useCart must be used inside a CartProvider.");
  }
  return ctx;
}