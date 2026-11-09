import { notFound } from "next/navigation";
import { cache } from "react";
import type { Metadata } from "next";
import {
  getProductBySlug,
  getVariantsForProduct,
} from "@/server/queries";
import { Bottle } from "@/components/shop/bottle";
import { ProductPurchase } from "@/components/shop/product-purchase";
import { tintWash, BONE, CHOSEN_TINT_PERCENT } from "@/lib/color";

type Params = Promise<{ slug: string }>;

const loadProduct = cache(async (slug: string) => getProductBySlug(slug));

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) {
    return { title: "Product not found — Maison Eko" };
  }
  return {
    title: `${product.name} — Maison Eko`,
    description: product.description,
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) {
    notFound();
  }

  const variants = await getVariantsForProduct(product.id);
  const wash = tintWash(product.accentHex, BONE, CHOSEN_TINT_PERCENT);
  const displaySize =
    variants.length > 0
      ? Math.max(...variants.map((v) => v.sizeMl))
      : 50;

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8 pt-8 md:pt-16 pb-24 md:pb-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
        <div
          className="aspect-square rounded-card flex items-center justify-center p-8"
          style={{ backgroundColor: wash }}
        >
          <Bottle
            accentHex={product.accentHex}
            sizeMl={displaySize}
            className="h-full w-auto max-w-full"
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

          <ProductPurchase
            variants={variants.map((v) => ({
              id: v.id,
              sizeMl: v.sizeMl,
              priceKobo: v.priceKobo,
              stock: v.stock,
            }))}
          />

          <div className="border-t border-border pt-6 space-y-4">
            <h2 className="text-sm font-medium text-ink">Scent notes</h2>
            <div>
              <p className="text-xs text-muted uppercase tracking-wide mb-1">
                Top
              </p>
              <p className="text-sm text-ink">
                {product.pyramid.top.join(", ")}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted uppercase tracking-wide mb-1">
                Heart
              </p>
              <p className="text-sm text-ink">
                {product.pyramid.heart.join(", ")}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted uppercase tracking-wide mb-1">
                Base
              </p>
              <p className="text-sm text-ink">
                {product.pyramid.base.join(", ")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}