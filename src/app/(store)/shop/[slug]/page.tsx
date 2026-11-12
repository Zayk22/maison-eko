import { notFound } from "next/navigation";
import { cache } from "react";
import type { Metadata } from "next";
import { getProductBySlug, getVariantsForProduct } from "@/server/queries";
import { ProductPurchase } from "@/components/shop/product-purchase";
import { ScentPyramid } from "@/components/shop/scent-pyramid";

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

  return (
    <div className="pb-24 md:pb-0">
      <ProductPurchase product={product} variants={variants} />
      <ScentPyramid accentHex={product.accentHex} pyramid={product.pyramid} />
    </div>
  );
}