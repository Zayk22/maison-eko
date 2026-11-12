import type { Metadata } from "next";
import { getActiveProductsWithVariants } from "@/server/queries";
import { ScentFinderQuiz } from "@/components/shop/scent-finder-quiz";

export const metadata: Metadata = {
  title: "Scent finder",
  description:
    "Three questions. We suggest a fragrance from the Maison Eko collection.",
  alternates: { canonical: "/scent-finder" },
};
export default async function ScentFinderPage() {
  const products = await getActiveProductsWithVariants();

  const entries = products.map((p) => {
    const firstSentence = p.description.split(". ")[0] ?? p.description;
    const minPriceKobo =
      p.variants.length > 0
        ? Math.min(...p.variants.map((v) => v.priceKobo))
        : null;
    return {
      slug: p.slug,
      name: p.name,
      description: firstSentence.endsWith(".") ? firstSentence : firstSentence + ".",
      accentHex: p.accentHex,
      minPriceKobo,
    };
  });

  return (
    <div className="mx-auto max-w-4xl px-4 md:px-8 py-12 md:py-20">
      <h1 className="font-display text-3xl md:text-5xl text-ink mb-3">
        Scent finder
      </h1>
      <p className="text-sm md:text-base text-muted mb-12">
        Three questions. We suggest a fragrance.
      </p>
      <ScentFinderQuiz products={entries} />
    </div>
  );
}