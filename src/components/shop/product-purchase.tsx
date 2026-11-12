"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/cart-context";
import { formatMoney } from "@/lib/money";
import { Bottle } from "./bottle";
import { tintWash, BONE, CHOSEN_TINT_PERCENT } from "@/lib/color";
import type { ProductWithPyramid, VariantRow } from "@/server/queries";

type Props = {
  product: ProductWithPyramid;
  variants: VariantRow[];
};

export function ProductPurchase({ product, variants }: Props) {
  const { addItem } = useCart();
  const inStock = variants.filter((v) => v.stock > 0);
  const firstAvailableId = inStock[0]?.id ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(firstAvailableId);
  const [added, setAdded] = useState(false);

  const selected = variants.find((v) => v.id === selectedId) ?? variants[0] ?? null;
  const allOut = inStock.length === 0;
  const wash = tintWash(product.accentHex, BONE, CHOSEN_TINT_PERCENT);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 2000);
    return () => clearTimeout(t);
  }, [added]);

  function handleAdd() {
    if (!selected || selected.stock === 0) return;
    addItem(selected.id, 1, `${product.name} ${selected.sizeMl} ml`);
    setAdded(true);
  }

  function getStockText(stock: number) {
    if (stock === 0) return "Sold out";
    if (stock <= 5) return `Only ${stock} left`;
    return "In stock";
  }

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8 pt-8 md:pt-16 pb-16 md:pb-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
        <div
          className="h-[55svh] md:h-auto md:aspect-square rounded-card flex items-center justify-center p-8"
          style={{ backgroundColor: wash }}
        >
          <Bottle
            accentHex={product.accentHex}
            sizeMl={selected?.sizeMl ?? 50}
            className="h-full w-auto max-w-full transition-all duration-300"
          />
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <h1 className="font-display text-3xl md:text-5xl text-ink leading-tight">
              {product.name}
            </h1>
            <p className="mt-4 text-base text-muted leading-relaxed">
              {product.description}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-[13px] text-muted uppercase tracking-wide mb-2">
                Size
              </p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => {
                  const isActive = v.id === selectedId;
                  const isOut = v.stock === 0;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedId(v.id)}
                      disabled={isOut}
                      className={
                        "inline-flex flex-col items-center justify-center min-h-12 min-w-[80px] px-4 rounded-control border text-sm " +
                        (isActive && !isOut
                          ? "bg-ink text-bg border-ink"
                          : isOut
                          ? "bg-transparent text-muted border-border opacity-50 cursor-not-allowed"
                          : "bg-transparent text-ink border-border hover:border-ink") +
                        " focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                      }
                      aria-pressed={isActive && !isOut}
                    >
                      <span className="font-medium">{v.sizeMl}ml</span>
                      <span className="text-xs tabular-nums">
                        {formatMoney(v.priceKobo)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div aria-live="polite" className="text-[13px] text-muted min-h-[20px]">
              {allOut
                ? "Sold out"
                : selected
                ? getStockText(selected.stock)
                : null}
            </div>

            <button
              type="button"
              onClick={handleAdd}
              disabled={!selected || selected.stock === 0}
              className="hidden md:inline-flex items-center justify-center min-h-12 w-full rounded-control bg-ink px-6 text-sm font-medium text-bg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              {added ? "Added to cart" : "Add to cart"}
            </button>
          </div>
        </div>
      </div>

      <div className="h-24 md:hidden" aria-hidden="true" />

      {selected && selected.stock > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface px-4 py-3 md:hidden">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[13px] text-muted">{selected.sizeMl}ml</p>
              <p className="text-sm font-medium text-ink tabular-nums">
                {formatMoney(selected.priceKobo)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex items-center justify-center min-h-11 flex-1 max-w-xs rounded-control bg-ink px-6 text-sm font-medium text-bg hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              {added ? "Added" : "Add to cart"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}