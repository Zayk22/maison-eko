import Link from "next/link";
import { getActiveProductsWithVariants } from "@/server/queries";
import { ProductCard } from "@/components/shop/product-card";
import { SCENT_FAMILIES, type ScentFamily } from "@/lib/types";
import { SortSelect } from "@/components/shop/sort-select";

type SortKey = "featured" | "price-asc" | "price-desc";

type ShopSearchParams = Promise<{
  scent?: string;
  when?: string;
  sort?: string;
}>;

const SCENT_GROUP: ScentFamily[] = [
  "amber",
  "aquatic",
  "floral",
  "fresh",
  "gourmand",
  "green",
  "powdery",
  "spicy",
  "sweet",
  "warm",
  "woody",
];

const WHEN_GROUP: ScentFamily[] = ["day", "evening", "anytime"];

function parseSort(raw: string | undefined): SortKey {
  if (raw === "price-asc" || raw === "price-desc") return raw;
  return "featured";
}

function parseFilter(raw: string | undefined): ScentFamily | undefined {
  if (!raw) return undefined;
  if (SCENT_FAMILIES.includes(raw as ScentFamily)) return raw as ScentFamily;
  return undefined;
}

function buildUrl(
  current: { scent?: string; when?: string; sort?: string },
  overrides: { scent?: string | null; when?: string | null; sort?: string | null },
): string {
  const nextScent = overrides.scent !== undefined ? overrides.scent : current.scent;
  const nextWhen = overrides.when !== undefined ? overrides.when : current.when;
  const nextSort = overrides.sort !== undefined ? overrides.sort : current.sort;

  const params = new URLSearchParams();
  if (nextScent) params.set("scent", nextScent);
  if (nextWhen) params.set("when", nextWhen);
  if (nextSort && nextSort !== "featured") params.set("sort", nextSort);
  const qs = params.toString();
  return qs ? `/shop?${qs}` : "/shop";
}

function minPriceOf(product: { variants: { priceKobo: number }[] }): number {
  if (product.variants.length === 0) return Number.MAX_SAFE_INTEGER;
  return Math.min(...product.variants.map((v) => v.priceKobo));
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: ShopSearchParams;
}) {
  const params = await searchParams;
  const selectedScent = parseFilter(params.scent);
  const selectedWhen = parseFilter(params.when);
  const sort = parseSort(params.sort);

  const allProducts = await getActiveProductsWithVariants();

  let visible = allProducts;
  if (selectedScent) {
    visible = visible.filter((p) =>
      p.scentFamilyTags.includes(selectedScent),
    );
  }
  if (selectedWhen) {
    visible = visible.filter((p) =>
      p.scentFamilyTags.includes(selectedWhen),
    );
  }
  if (sort === "price-asc") {
    visible = [...visible].sort((a, b) => minPriceOf(a) - minPriceOf(b));
  } else if (sort === "price-desc") {
    visible = [...visible].sort((a, b) => minPriceOf(b) - minPriceOf(a));
  }

  const currentParams = { scent: selectedScent, when: selectedWhen, sort };

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8 py-12 md:py-16">
      <div className="mb-10">
        <h1 className="font-display text-3xl md:text-5xl text-ink">Shop</h1>
      </div>

      <div className="mb-8 space-y-6">
        <div>
          <h2 className="text-sm font-medium text-ink mb-2">Scent</h2>
          <div className="flex overflow-x-auto snap-x snap-mandatory md:flex-wrap gap-2 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link
              href={buildUrl(currentParams, { scent: null })}
              className={
                "snap-start shrink-0 inline-flex items-center min-h-11 px-4 rounded-full border text-sm " +
                (!selectedScent
                  ? "bg-ink text-bg border-ink"
                  : "bg-transparent text-ink border-border hover:border-ink") +
                " focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              }
              aria-pressed={!selectedScent}
            >
              All
            </Link>
            {SCENT_GROUP.map((scent) => {
              const isActive = selectedScent === scent;
              return (
                <Link
                  key={scent}
                  href={buildUrl(currentParams, {
                    scent: isActive ? null : scent,
                  })}
                  className={
                    "snap-start shrink-0 inline-flex items-center min-h-11 px-4 rounded-full border text-sm capitalize " +
                    (isActive
                      ? "bg-ink text-bg border-ink"
                      : "bg-transparent text-ink border-border hover:border-ink") +
                    " focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                  }
                  aria-pressed={isActive}
                >
                  {scent}
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-medium text-ink mb-2">When</h2>
          <div className="flex overflow-x-auto snap-x snap-mandatory md:flex-wrap gap-2 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link
              href={buildUrl(currentParams, { when: null })}
              className={
                "snap-start shrink-0 inline-flex items-center min-h-11 px-4 rounded-full border text-sm " +
                (!selectedWhen
                  ? "bg-ink text-bg border-ink"
                  : "bg-transparent text-ink border-border hover:border-ink") +
                " focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              }
              aria-pressed={!selectedWhen}
            >
              All
            </Link>
            {WHEN_GROUP.map((when) => {
              const isActive = selectedWhen === when;
              return (
                <Link
                  key={when}
                  href={buildUrl(currentParams, {
                    when: isActive ? null : when,
                  })}
                  className={
                    "snap-start shrink-0 inline-flex items-center min-h-11 px-4 rounded-full border text-sm capitalize " +
                    (isActive
                      ? "bg-ink text-bg border-ink"
                      : "bg-transparent text-ink border-border hover:border-ink") +
                    " focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                  }
                  aria-pressed={isActive}
                >
                  {when}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div aria-live="polite" className="text-sm text-muted">
          {visible.length} {visible.length === 1 ? "fragrance" : "fragrances"}
        </div>
        <SortSelect defaultValue={sort} />
      </div>

      {visible.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-muted mb-4">No fragrances match this filter.</p>
          <Link
            href="/shop"
            className="inline-flex items-center min-h-11 rounded-control bg-ink px-6 text-sm font-medium text-bg hover:opacity-90 transition-opacity"
          >
            Clear filters
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {visible.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}