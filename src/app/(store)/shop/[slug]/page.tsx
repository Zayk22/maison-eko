import { notFound } from "next/navigation";
import { cache } from "react";
import type { Metadata } from "next";
import { getProductBySlug, getVariantsForProduct } from "@/server/queries";
import { ProductPurchase } from "@/components/shop/product-purchase";
import { ScentPyramid } from "@/components/shop/scent-pyramid";
import { SITE_URL } from "@/lib/site";
import {
  buildProductJsonLd,
  serializeJsonLd,
} from "@/lib/structured-data";

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
    return { title: "Product not found" };
  }
  const canonical = `/shop/${slug}`;
  return {
    title: product.name,
    description: product.description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: product.name,
      description: product.description,
      url: canonical,
    },
    twitter: {
      card: "summary",
      title: product.name,
      description: product.description,
    },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) {
    notFound();
  }

  const variants = await getVariantsForProduct(product.id);

  const jsonld = buildProductJsonLd({
    name: product.name,
    description: product.description,
    slug: product.slug,
    siteUrl: SITE_URL,
    variants: variants.map((v) => ({
      priceKobo: v.priceKobo,
      stock: v.stock,
    })),
  });

  return (
    <div className="pb-24 md:pb-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonld) }}
      />
      <ProductPurchase product={product} variants={variants} />
      <ScentPyramid accentHex={product.accentHex} pyramid={product.pyramid} />
    </div>
  );
}