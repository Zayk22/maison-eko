"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/cart-context";
import { formatMoney } from "@/lib/money";

type Variant = {
  id: string;
  sizeMl: number;
  priceKobo: number;
  stock: number;
};

type Props = {
  variants: Variant[];
};

export function ProductPurchase({ variants }: Props) {
  const { addItem } = useCart();
  const inStock = variants.filter((v) => v.stock > 0);
  const firstAvailableId = inStock[0]?.id ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(firstAvailableId);
  const [added, setAdded] = useState(false);

  const selected = variants.find((v) => v.id === selectedId) ?? null;
  const allOut = inStock.length === 0;

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 2000);
    return () => clearTimeout(t);
  }, [added]);

  function handleAdd() {
    if (!selected || selected.stock === 0) return;
    addItem(selected.id);
    setAdded(true);
  }

  return (
    <>
      <div className="space-y-4">
        <div>
          <p className="text-xs text-muted uppercase tracking-wide mb-2">
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

        {allOut ? (
          <p className="text-sm text-danger">Sold out</p>
        ) : selected ? (
          <p className="text-sm text-muted">
            {selected.stock} {selected.stock === 1 ? "in stock" : "in stock"}
          </p>
        ) : null}

        <button
          type="button"
          onClick={handleAdd}
          disabled={!selected || selected.stock === 0}
          className="hidden md:inline-flex items-center justify-center min-h-12 w-full rounded-control bg-ink px-6 text-sm font-medium text-bg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          {added ? "Added to cart" : "Add to cart"}
        </button>
      </div>

      {selected && selected.stock > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface px-4 py-3 md:hidden">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted">{selected.sizeMl}ml</p>
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
    </>
  );
}