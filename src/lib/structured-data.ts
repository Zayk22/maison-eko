/**
 * Build a Product JSON-LD object with one AggregateOffer covering all
 * variants. Prices are built from integer kobo without float division:
 * every price string is `naira + "." + kobo-padded-to-two` computed with
 * integers only.
 *
 * No aggregateRating, no review. This is a demo store.
 */

export type JsonLdVariant = {
  priceKobo: number;
  stock: number;
};

export type BuildProductJsonLdInput = {
  name: string;
  description: string;
  slug: string;
  siteUrl: string;
  imageUrl?: string;
  variants: JsonLdVariant[];
};

export type ProductJsonLd = {
  "@context": "https://schema.org";
  "@type": "Product";
  name: string;
  description: string;
  url: string;
  brand: { "@type": "Brand"; name: "Maison Eko" };
  image?: string;
  offers: {
    "@type": "AggregateOffer";
    priceCurrency: "NGN";
    lowPrice: string;
    highPrice: string;
    offerCount: number;
    availability:
      | "https://schema.org/InStock"
      | "https://schema.org/OutOfStock";
  };
};

function koboToNairaString(kobo: number): string {
  if (!Number.isInteger(kobo) || kobo < 0) {
    throw new Error("Price must be a non-negative integer number of kobo.");
  }
  const naira = Math.floor(kobo / 100);
  const remainder = kobo - naira * 100;
  const koboStr = remainder.toString().padStart(2, "0");
  return `${naira}.${koboStr}`;
}

export function buildProductJsonLd(
  input: BuildProductJsonLdInput,
): ProductJsonLd {
  const { name, description, slug, siteUrl, imageUrl, variants } = input;

  const prices = variants.map((v) => v.priceKobo);
  const lowKobo = prices.length > 0 ? Math.min(...prices) : 0;
  const highKobo = prices.length > 0 ? Math.max(...prices) : 0;
  const inStock = variants.some((v) => v.stock > 0);

  const baseUrl = siteUrl.replace(/\/+$/, "");
  const url = `${baseUrl}/shop/${slug}`;

  const jsonld: ProductJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    url,
    brand: { "@type": "Brand", name: "Maison Eko" },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "NGN",
      lowPrice: koboToNairaString(lowKobo),
      highPrice: koboToNairaString(highKobo),
      offerCount: variants.length,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  if (imageUrl) {
    jsonld.image = imageUrl;
  }

  return jsonld;
}

/**
 * Serialise a JSON-LD object for inline use in a <script> tag. Escapes
 * `<` so a description containing "</script>" or similar cannot break out
 * of the script element.
 */
export function serializeJsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}