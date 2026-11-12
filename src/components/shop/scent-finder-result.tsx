"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Bottle } from "./bottle";
import { formatMoney } from "@/lib/money";
import { tintWash, BONE, CHOSEN_TINT_PERCENT } from "@/lib/color";
import type { ScentFinderResult } from "@/lib/scent-finder";
import type { QuizProduct } from "./scent-finder-quiz";

type Props = {
  result: ScentFinderResult;
  products: QuizProduct[];
  onReset: () => void;
};

function findProduct(
  products: QuizProduct[],
  slug: string,
): QuizProduct | null {
  return products.find((p) => p.slug === slug) ?? null;
}

export function ScentFinderResultView({ result, products, onReset }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  const best = findProduct(products, result.bestMatch.slug);
  const runner = result.runnerUp
    ? findProduct(products, result.runnerUp.slug)
    : null;

  return (
    <div className="space-y-8">
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="font-display text-2xl md:text-3xl text-ink outline-none"
      >
        Your match
      </h2>

      {best ? (
        <ResultCard product={best} primary delayMs={0} />
      ) : (
        <p className="text-sm text-muted">
          The suggested fragrance is not currently available. Try the quiz again
          or browse the shop.
        </p>
      )}

      {runner && runner.slug !== best?.slug && (
        <div className="me-rise-in" style={{ animationDelay: "350ms" }}>
          <p className="text-[13px] uppercase tracking-widest text-muted mb-3">
            Runner-up
          </p>
          <ResultCard product={runner} primary={false} delayMs={350} />
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center justify-center min-h-11 rounded-control border border-border-strong px-4 text-sm font-medium text-ink hover:border-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          Start over
        </button>
        <Link
          href="/shop"
          className="text-sm text-muted hover:text-ink transition-colors"
        >
          Browse all fragrances
        </Link>
      </div>
    </div>
  );
}

function ResultCard({
  product,
  primary,
  delayMs,
}: {
  product: QuizProduct;
  primary: boolean;
  delayMs: number;
}) {
  const wash = tintWash(product.accentHex, BONE, CHOSEN_TINT_PERCENT);
  return (
    <Link
      href={`/shop/${product.slug}`}
      className="flex flex-col md:flex-row gap-6 items-center rounded-card border border-border bg-surface p-6 hover:border-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
    >
      {/* Colour wash fades in first, then the bottle morphs (scales) in on top. */}
      <div
        className={
          "relative flex items-center justify-center rounded-card shrink-0 overflow-hidden " +
          (primary ? "w-32 md:w-40 aspect-[1/2]" : "w-20 md:w-24 aspect-[1/2]")
        }
      >
        <div
          className="me-wash-in absolute inset-0"
          style={{ backgroundColor: wash, animationDelay: `${delayMs}ms` }}
          aria-hidden="true"
        />
        <div
          className="me-morph-in relative w-full"
          style={{ animationDelay: `${delayMs + 120}ms` }}
        >
          <Bottle
            accentHex={product.accentHex}
            sizeMl={100}
            className="w-full h-auto p-2"
          />
        </div>
      </div>
      <div
        className="me-rise-in flex-1 text-center md:text-left"
        style={{ animationDelay: `${delayMs + 220}ms` }}
      >
        <h3
          className={
            "font-display text-ink leading-tight " +
            (primary ? "text-xl md:text-2xl" : "text-base md:text-lg")
          }
        >
          {product.name}
        </h3>
        <p className="text-sm text-muted mt-2 leading-relaxed">
          {product.description}
        </p>
        {product.minPriceKobo !== null && (
          <p className="mt-3 text-sm font-medium text-ink tabular-nums">
            From {formatMoney(product.minPriceKobo)}
          </p>
        )}
        <p className="mt-3 text-sm text-ink underline underline-offset-4 decoration-accent">
          View product
        </p>
      </div>
    </Link>
  );
}