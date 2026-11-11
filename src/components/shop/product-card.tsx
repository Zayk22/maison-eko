"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { m, useReducedMotion } from "motion/react";
import { Bottle } from "./bottle";
import { formatMoney } from "@/lib/money";
import { tintWash, BONE, CHOSEN_TINT_PERCENT } from "@/lib/color";
import { useHoverCapable } from "@/lib/use-hover-capable";
import type { ProductWithVariants } from "@/server/queries";

function firstSentence(text: string): string {
  const idx = text.indexOf(". ");
  if (idx === -1) return text;
  return text.slice(0, idx + 1);
}

export function ProductCard({ product }: { product: ProductWithVariants }) {
  const wash = tintWash(product.accentHex, BONE, CHOSEN_TINT_PERCENT);
  const minPrice =
    product.variants.length > 0
      ? Math.min(...product.variants.map((v) => v.priceKobo))
      : null;
  const allOutOfStock =
    product.variants.length === 0 ||
    product.variants.every((v) => v.stock === 0);
  const displaySize =
    product.variants.length > 0
      ? Math.max(...product.variants.map((v) => v.sizeMl))
      : 50;

  const hoverCapable = useHoverCapable();
  const reduce = useReducedMotion();
  const enableTilt = hoverCapable && !reduce;

  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [highlight, setHighlight] = useState({ x: 50, y: 50, show: false });

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!enableTilt) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;
    const clampedX = Math.max(0, Math.min(1, relX));
    const clampedY = Math.max(0, Math.min(1, relY));

    // Max tilt is about 4 degrees: two per axis.
    const rotateY = (clampedX - 0.5) * 4;
    const rotateX = -(clampedY - 0.5) * 4;

    setStyle({
      transform: `perspective(800px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`,
      transition: "transform 80ms ease-out",
    });
    setHighlight({ x: clampedX * 100, y: clampedY * 100, show: true });
  }

  function onPointerLeave() {
    if (!enableTilt) return;
    setStyle({
      transform: "perspective(800px) rotateX(0deg) rotateY(0deg)",
      transition: "transform 200ms ease-out",
    });
    setHighlight((h) => ({ ...h, show: false }));
  }

  return (
    <m.div
      ref={ref}
      onPointerMove={enableTilt ? onPointerMove : undefined}
      onPointerLeave={enableTilt ? onPointerLeave : undefined}
      style={style}
      className="group relative h-full"
      whileTap={!reduce && !hoverCapable ? { scale: 0.98 } : undefined}
    >
      <Link
        href={`/shop/${product.slug}`}
        className="flex flex-col h-full rounded-card border border-border bg-surface overflow-hidden hover:border-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        <div
          className="aspect-[4/5] flex items-center justify-center p-6 relative overflow-hidden"
          style={{ backgroundColor: wash }}
        >
          <Bottle
            accentHex={product.accentHex}
            sizeMl={displaySize}
            className="h-full w-auto max-w-full"
          />
          {enableTilt && (
            <div
              className="absolute inset-0 pointer-events-none"
              aria-hidden="true"
              style={{
                background: `radial-gradient(circle at ${highlight.x}% ${highlight.y}%, rgba(255,255,255,0.4) 0%, transparent 55%)`,
                opacity: highlight.show ? 1 : 0,
                transition: "opacity 150ms ease-out",
              }}
            />
          )}
        </div>
        <div className="p-4 flex flex-col gap-1">
          <h3 className="font-display text-base md:text-lg text-ink leading-tight group-hover:underline group-hover:underline-offset-4 group-hover:decoration-accent group-focus-visible:underline group-focus-visible:underline-offset-4 group-focus-visible:decoration-accent">
            {product.name}
          </h3>
          <p className="text-[13px] text-muted line-clamp-2 leading-relaxed">
            {firstSentence(product.description)}
          </p>
          <div className="mt-2 flex items-center justify-between">
            {minPrice !== null ? (
              <span className="text-sm font-medium text-ink tabular-nums">
                From {formatMoney(minPrice)}
              </span>
            ) : (
              <span className="text-sm text-muted">Unavailable</span>
            )}
            {allOutOfStock && (
              <span className="text-xs font-medium text-danger">
                Sold out
              </span>
            )}
          </div>
        </div>
      </Link>
    </m.div>
  );
}