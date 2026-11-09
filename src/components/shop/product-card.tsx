import Link from "next/link";
import { Bottle } from "./bottle";
import { formatMoney } from "@/lib/money";
import { tintWash, BONE, CHOSEN_TINT_PERCENT } from "@/lib/color";
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

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group flex flex-col rounded-card border border-border bg-surface overflow-hidden hover:border-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
    >
      <div
        className="aspect-[4/5] flex items-center justify-center p-6"
        style={{ backgroundColor: wash }}
      >
        <Bottle
          accentHex={product.accentHex}
          sizeMl={displaySize}
          className="h-full w-auto max-w-full"
        />
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
            <span className="text-xs font-medium text-danger">Sold out</span>
          )}
        </div>
      </div>
    </Link>
  );
}