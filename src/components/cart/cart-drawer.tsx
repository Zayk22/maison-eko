"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "./cart-context";
import { formatMoney, FLAT_SHIPPING_KOBO } from "@/lib/money";
import { MAX_QUANTITY_PER_LINE } from "@/lib/order";

type VariantInfo = {
  id: string;
  productName: string;
  productSlug: string;
  productActive: boolean;
  sizeMl: number;
  priceKobo: number;
  stock: number;
};

type LookupResponse = { variants: VariantInfo[] };

const DRAWER_CSS = `
  @keyframes me-slide-up {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
  @keyframes me-slide-right {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
  @keyframes me-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .me-drawer-overlay[data-state="open"] { animation: me-fade-in 150ms ease-out; }
  .me-drawer-content[data-state="open"] { animation: me-slide-up 200ms ease-out; }
  @media (min-width: 768px) {
    .me-drawer-content[data-state="open"] { animation: me-slide-right 200ms ease-out; }
  }
  @media (prefers-reduced-motion: reduce) {
    .me-drawer-overlay[data-state="open"],
    .me-drawer-content[data-state="open"] { animation: none; }
    .me-drawer-content { transition: none !important; }
  }
`;

export function CartDrawer() {
  const { lines, drawerOpen, closeDrawer, setQuantity, removeItem } = useCart();

  const idsKey = useMemo(
    () => lines.map((l) => l.variantId).join(","),
    [lines],
  );

  const [lookup, setLookup] = useState<{
    done: boolean;
    variantsById: Record<string, VariantInfo>;
  }>({ done: false, variantsById: {} });

  useEffect(() => {
    if (!drawerOpen) return;
    if (lines.length === 0) {
      setLookup({ done: true, variantsById: {} });
      return;
    }
    let cancelled = false;
    setLookup({ done: false, variantsById: {} });
    fetch(`/api/cart/lookup?ids=${encodeURIComponent(idsKey)}`)
      .then((r) => r.json() as Promise<LookupResponse>)
      .then((data) => {
        if (cancelled) return;
        const map: Record<string, VariantInfo> = {};
        for (const v of data.variants) map[v.id] = v;
        setLookup({ done: true, variantsById: map });
      })
      .catch(() => {
        if (!cancelled) setLookup({ done: true, variantsById: {} });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerOpen, idsKey]);

  type ResolvedLine = {
    variantId: string;
    quantity: number;
    variant: VariantInfo | null;
    pending: boolean;
    unavailable: boolean;
    lineTotalKobo: number;
  };

  const resolved: ResolvedLine[] = lines.map((line) => {
    const v = lookup.variantsById[line.variantId];
    const pending = !lookup.done;
    const unavailable =
      lookup.done && (!v || !v.productActive || v.stock === 0);
    return {
      variantId: line.variantId,
      quantity: line.quantity,
      variant: v ?? null,
      pending,
      unavailable,
      lineTotalKobo: v && !unavailable ? v.priceKobo * line.quantity : 0,
    };
  });

  const available = resolved.filter((r) => !r.unavailable && !r.pending);
  const subtotalKobo = available.reduce((sum, r) => sum + r.lineTotalKobo, 0);
  const shippingKobo = subtotalKobo > 0 ? FLAT_SHIPPING_KOBO : 0;
  const totalKobo = subtotalKobo + shippingKobo;

  return (
    <>
      <style>{DRAWER_CSS}</style>
      <Dialog.Root open={drawerOpen} onOpenChange={(o) => !o && closeDrawer()}>
        <Dialog.Portal>
          <Dialog.Overlay className="me-drawer-overlay fixed inset-0 z-50 bg-ink/40 data-[state=closed]:opacity-0 transition-opacity duration-150" />
          <Dialog.Content
            className={[
              "me-drawer-content fixed z-50 bg-surface flex flex-col",
              "inset-x-0 bottom-0 max-h-[85svh] rounded-t-card border-t border-border",
              "md:inset-y-0 md:right-0 md:left-auto md:bottom-auto md:h-full md:w-[420px] md:max-h-none md:rounded-none md:border-l md:border-t-0",
              "transition-transform duration-200 ease-out",
              "data-[state=closed]:translate-y-full data-[state=open]:translate-y-0",
              "md:data-[state=closed]:translate-x-full md:data-[state=closed]:translate-y-0",
              "md:data-[state=open]:translate-x-0 md:data-[state=open]:translate-y-0",
              "focus:outline-none",
            ].join(" ")}
            aria-describedby={undefined}
          >
            <div className="flex items-center justify-between border-b border-border p-4">
              <Dialog.Title className="font-display text-lg text-ink">
                Cart
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-control text-ink hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                  aria-label="Close cart"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </Dialog.Close>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {lines.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted mb-4">Your cart is empty.</p>
                  <Dialog.Close asChild>
                    <Link
                      href="/shop"
                      className="inline-flex items-center justify-center min-h-11 rounded-control bg-ink px-6 text-sm font-medium text-bg hover:opacity-90 transition-opacity"
                    >
                      Browse the collection
                    </Link>
                  </Dialog.Close>
                </div>
              ) : (
                <ul className="space-y-3">
                  {resolved.map((r) => (
                    <li
                      key={r.variantId}
                      className="border border-border rounded-card p-3"
                    >
                      {r.pending ? (
                        <div className="animate-pulse">
                          <div className="h-4 bg-border rounded w-2/3 mb-2" />
                          <div className="h-3 bg-border rounded w-1/3" />
                        </div>
                      ) : r.unavailable ? (
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-ink">
                              {r.variant?.productName ?? "This item"}
                            </p>
                            <p className="text-xs text-muted">
                              No longer available
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(r.variantId)}
                            className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-control text-ink hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium text-ink">
                                {r.variant!.productName}
                              </p>
                              <p className="text-xs text-muted">
                                {r.variant!.sizeMl} ml
                              </p>
                              <p className="text-xs text-muted tabular-nums mt-1">
                                {formatMoney(r.variant!.priceKobo)} each
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(r.variantId)}
                              className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-control text-ink hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                              aria-label="Remove item"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <div className="inline-flex items-center gap-1 border border-border rounded-control">
                              <button
                                type="button"
                                onClick={() =>
                                  setQuantity(r.variantId, r.quantity - 1)
                                }
                                disabled={r.quantity <= 1}
                                className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-control text-ink hover:bg-bg disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                                aria-label="Decrease quantity"
                              >
                                <Minus
                                  className="h-4 w-4"
                                  aria-hidden="true"
                                />
                              </button>
                              <span className="text-sm tabular-nums min-w-[2ch] text-center">
                                {r.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setQuantity(r.variantId, r.quantity + 1)
                                }
                                disabled={r.quantity >= MAX_QUANTITY_PER_LINE}
                                className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-control text-ink hover:bg-bg disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                                aria-label="Increase quantity"
                              >
                                <Plus
                                  className="h-4 w-4"
                                  aria-hidden="true"
                                />
                              </button>
                            </div>
                            <span className="text-sm font-medium text-ink tabular-nums">
                              {formatMoney(r.lineTotalKobo)}
                            </span>
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {lines.length > 0 && available.length > 0 && (
              <div className="border-t border-border p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Subtotal</span>
                  <span className="text-ink tabular-nums">
                    {formatMoney(subtotalKobo)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Shipping</span>
                  <span className="text-ink tabular-nums">
                    {formatMoney(shippingKobo)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-base font-medium border-t border-border pt-3">
                  <span className="text-ink">Total</span>
                  <span className="text-ink tabular-nums">
                    {formatMoney(totalKobo)}
                  </span>
                </div>
                <Dialog.Close asChild>
                  <Link
                    href="/checkout"
                    className="inline-flex items-center justify-center min-h-11 w-full rounded-control bg-ink px-6 text-sm font-medium text-bg hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                  >
                    Checkout
                  </Link>
                </Dialog.Close>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}