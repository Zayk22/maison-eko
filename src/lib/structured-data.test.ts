import { describe, it, expect } from "vitest";
import { buildProductJsonLd, serializeJsonLd } from "./structured-data";

const baseInput = {
  name: "Eko Nights",
  description: "A warm amber fragrance.",
  slug: "eko-nights",
  siteUrl: "https://example.test",
  variants: [
    { priceKobo: 3200000, stock: 12 },
    { priceKobo: 4800000, stock: 20 },
    { priceKobo: 7200000, stock: 0 },
  ],
};

describe("buildProductJsonLd", () => {
  it("builds a Product with brand and a single AggregateOffer", () => {
    const jsonld = buildProductJsonLd(baseInput);
    expect(jsonld["@type"]).toBe("Product");
    expect(jsonld.brand).toEqual({ "@type": "Brand", name: "Maison Eko" });
    expect(jsonld.offers["@type"]).toBe("AggregateOffer");
    expect(jsonld.offers.priceCurrency).toBe("NGN");
    expect(jsonld.offers.offerCount).toBe(3);
  });

  it("uses integer maths to compute low and high price strings", () => {
    const jsonld = buildProductJsonLd(baseInput);
    expect(jsonld.offers.lowPrice).toBe("32000.00");
    expect(jsonld.offers.highPrice).toBe("72000.00");
  });

  it("formats prices with non-zero kobo correctly", () => {
    const jsonld = buildProductJsonLd({
      ...baseInput,
      variants: [{ priceKobo: 3200050, stock: 1 }],
    });
    expect(jsonld.offers.lowPrice).toBe("32000.50");
  });

  it("marks InStock when any variant has stock", () => {
    const jsonld = buildProductJsonLd(baseInput);
    expect(jsonld.offers.availability).toBe("https://schema.org/InStock");
  });

  it("marks OutOfStock when all variants have zero stock", () => {
    const jsonld = buildProductJsonLd({
      ...baseInput,
      variants: [
        { priceKobo: 3200000, stock: 0 },
        { priceKobo: 4800000, stock: 0 },
      ],
    });
    expect(jsonld.offers.availability).toBe("https://schema.org/OutOfStock");
  });

  it("includes image only when an image URL is provided", () => {
    const withImage = buildProductJsonLd({
      ...baseInput,
      imageUrl: "https://example.test/og-image.png",
    });
    expect(withImage.image).toBe("https://example.test/og-image.png");

    const withoutImage = buildProductJsonLd(baseInput);
    expect(withoutImage.image).toBeUndefined();
    expect("image" in withoutImage).toBe(false);
  });

  it("does not include aggregateRating or review", () => {
    const jsonld = buildProductJsonLd(baseInput);
    const obj = jsonld as Record<string, unknown>;
    expect(obj.aggregateRating).toBeUndefined();
    expect(obj.review).toBeUndefined();
  });

  it("throws on negative or non-integer price", () => {
    expect(() =>
      buildProductJsonLd({
        ...baseInput,
        variants: [{ priceKobo: -1, stock: 1 }],
      }),
    ).toThrow();
    expect(() =>
      buildProductJsonLd({
        ...baseInput,
        variants: [{ priceKobo: 100.5, stock: 1 }],
      }),
    ).toThrow();
  });

  it("trims trailing slash from siteUrl in the canonical url", () => {
    const jsonld = buildProductJsonLd({
      ...baseInput,
      siteUrl: "https://example.test/",
    });
    expect(jsonld.url).toBe("https://example.test/shop/eko-nights");
  });
});

describe("serializeJsonLd", () => {
  it("escapes < so a </script> in a description cannot break out", () => {
    const out = serializeJsonLd({ name: "</script><b>X</b>" });
    expect(out).not.toContain("</script>");
    expect(out).toContain("\\u003c");
  });

  it("round-trips a normal object", () => {
    const input = { a: 1, b: "two", c: [3] };
    expect(JSON.parse(serializeJsonLd(input))).toEqual(input);
  });
});