import Link from "next/link";
import { getActiveProductsWithVariants } from "@/server/queries";
import { ProductCard } from "@/components/shop/product-card";
import { HeroBottle } from "@/components/motion/hero-bottle";
import { HeroCopy, HeroItem } from "@/components/motion/hero-copy";
import { LazyMotion, domAnimation } from "motion/react";

export default async function HomePage() {
  const products = await getActiveProductsWithVariants();
  const featured = products.slice(0, 4);
  const heroProduct = featured[0];

  return (
    <LazyMotion features={domAnimation} strict>
      <section className="mx-auto max-w-7xl px-4 md:px-8 py-16 md:py-28">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div className="max-w-2xl">
            <HeroCopy>
              <HeroItem>
                <h1 className="font-display text-4xl md:text-6xl font-medium tracking-tight text-ink leading-[1.05]">
                  Scented for the way Lagos feels.
                </h1>
              </HeroItem>
              <HeroItem>
                <p className="mt-6 text-base md:text-lg text-muted max-w-lg leading-relaxed">
                  Eight small-batch fragrances, made for the harmattan, the
                  lagoon, and the long evening.
                </p>
              </HeroItem>
              <HeroItem>
                <div className="mt-8 flex flex-col sm:flex-row gap-4 sm:gap-3">
                  <Link
                    href="/shop"
                    className="inline-flex items-center justify-center min-h-11 rounded-control bg-ink px-6 text-sm font-medium text-bg hover:opacity-90 transition-opacity"
                  >
                    Browse the collection
                  </Link>
                  <Link
                    href="/scent-finder"
                    className="inline-flex items-center justify-center min-h-11 rounded-control border border-border px-6 text-sm font-medium text-ink hover:border-ink transition-colors"
                  >
                    Find your scent
                  </Link>
                </div>
              </HeroItem>
            </HeroCopy>
          </div>
          <div className="flex justify-center">
            <HeroBottle
              accentHex={heroProduct?.accentHex ?? "#B8691F"}
              sizeMl={100}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 md:px-8 pb-20 md:pb-28">
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-display text-2xl md:text-3xl text-ink">
            The collection
          </h2>
          <Link
            href="/shop"
            className="text-sm text-ink underline underline-offset-4 decoration-accent"
          >
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </LazyMotion>
  );
}