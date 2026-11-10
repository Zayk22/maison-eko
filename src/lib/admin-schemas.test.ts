import { describe, it, expect } from "vitest";
import {
  productCreateSchema,
  productUpdateSchema,
  variantCreateSchema,
  variantUpdateSchema,
  MAX_UNIT_PRICE_KOBO,
  MAX_STOCK,
} from "./admin-schemas";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

const validProductCreate = {
  name: "Test Fragrance",
  slug: "test-fragrance",
  description: "A test fragrance for schema validation.",
  pyramid: { top: ["bergamot"], heart: ["rose"], base: ["amber"] },
  scentFamilyTags: ["warm", "evening"] as const,
  accentHex: "#3F8FA6",
};

describe("productCreateSchema", () => {
  it("accepts a valid payload", () => {
    expect(productCreateSchema.safeParse(validProductCreate).success).toBe(
      true,
    );
  });

  it("accepts an omitted slug", () => {
    const { slug, ...rest } = validProductCreate;
    expect(productCreateSchema.safeParse(rest).success).toBe(true);
  });

  it("accepts an empty slug", () => {
    expect(
      productCreateSchema.safeParse({ ...validProductCreate, slug: "" })
        .success,
    ).toBe(true);
  });

  it("rejects a name shorter than 2 characters", () => {
    expect(
      productCreateSchema.safeParse({ ...validProductCreate, name: "A" })
        .success,
    ).toBe(false);
  });

  it("rejects a name over 100 characters", () => {
    expect(
      productCreateSchema.safeParse({
        ...validProductCreate,
        name: "a".repeat(101),
      }).success,
    ).toBe(false);
  });

  it("rejects an invalid slug format", () => {
    expect(
      productCreateSchema.safeParse({
        ...validProductCreate,
        slug: "Not a Slug",
      }).success,
    ).toBe(false);
  });

  it("rejects a slug over 100 characters", () => {
    expect(
      productCreateSchema.safeParse({
        ...validProductCreate,
        slug: "a".repeat(101),
      }).success,
    ).toBe(false);
  });

  it("rejects a description shorter than 10 characters", () => {
    expect(
      productCreateSchema.safeParse({
        ...validProductCreate,
        description: "short",
      }).success,
    ).toBe(false);
  });

  it("rejects a description over 2000 characters", () => {
    expect(
      productCreateSchema.safeParse({
        ...validProductCreate,
        description: "a".repeat(2001),
      }).success,
    ).toBe(false);
  });

  it("rejects an empty pyramid section", () => {
    expect(
      productCreateSchema.safeParse({
        ...validProductCreate,
        pyramid: { top: [], heart: ["rose"], base: ["amber"] },
      }).success,
    ).toBe(false);
  });

  it("rejects a missing pyramid section", () => {
    expect(
      productCreateSchema.safeParse({
        ...validProductCreate,
        pyramid: { top: ["bergamot"], heart: ["rose"] },
      }).success,
    ).toBe(false);
  });

  it("rejects an empty tags array", () => {
    expect(
      productCreateSchema.safeParse({
        ...validProductCreate,
        scentFamilyTags: [],
      }).success,
    ).toBe(false);
  });

  it("rejects more than 5 tags", () => {
    expect(
      productCreateSchema.safeParse({
        ...validProductCreate,
        scentFamilyTags: [
          "warm",
          "amber",
          "woody",
          "evening",
          "day",
          "fresh",
        ],
      }).success,
    ).toBe(false);
  });

  it("rejects an unknown tag", () => {
    expect(
      productCreateSchema.safeParse({
        ...validProductCreate,
        scentFamilyTags: ["warm", "notatag"],
      }).success,
    ).toBe(false);
  });

  it("rejects duplicate tags", () => {
    expect(
      productCreateSchema.safeParse({
        ...validProductCreate,
        scentFamilyTags: ["warm", "warm"],
      }).success,
    ).toBe(false);
  });

  it("rejects an invalid accent hex", () => {
    expect(
      productCreateSchema.safeParse({
        ...validProductCreate,
        accentHex: "not-a-hex",
      }).success,
    ).toBe(false);
  });

  it("accepts a known passing accent (Lagoon)", () => {
    expect(
      productCreateSchema.safeParse({
        ...validProductCreate,
        accentHex: "#3F8FA6",
      }).success,
    ).toBe(true);
  });

  it("rejects an accent whose tinted wash fails the muted check (near black)", () => {
    const result = productCreateSchema.safeParse({
      ...validProductCreate,
      accentHex: "#000000",
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    const issue = result.error.issues.find((i) => i.path[0] === "accentHex");
    expect(issue).toBeDefined();
    expect(issue!.message).toContain("contrast");
  });
});

describe("productUpdateSchema", () => {
  const validProductUpdate = {
    id: VALID_UUID,
    name: "Updated Fragrance",
    description: "An updated fragrance description.",
    pyramid: { top: ["bergamot"], heart: ["rose"], base: ["amber"] },
    scentFamilyTags: ["warm", "evening"] as const,
    accentHex: "#3F8FA6",
  };

  it("accepts a valid payload", () => {
    expect(productUpdateSchema.safeParse(validProductUpdate).success).toBe(
      true,
    );
  });

  it("strips a slug field from the payload", () => {
    const result = productUpdateSchema.safeParse({
      ...validProductUpdate,
      slug: "attacker-edit",
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect((result.data as Record<string, unknown>).slug).toBeUndefined();
  });

  it("rejects an invalid id", () => {
    expect(
      productUpdateSchema.safeParse({
        ...validProductUpdate,
        id: "not-a-uuid",
      }).success,
    ).toBe(false);
  });
});

describe("variantCreateSchema", () => {
  const validVariantCreate = {
    productId: VALID_UUID,
    sizeMl: 50 as const,
    priceKobo: 3_200_000,
    stock: 12,
  };

  it("accepts a valid payload", () => {
    expect(variantCreateSchema.safeParse(validVariantCreate).success).toBe(
      true,
    );
  });

  it("accepts sizes 30, 50 and 100", () => {
    for (const sizeMl of [30, 50, 100] as const) {
      expect(
        variantCreateSchema.safeParse({ ...validVariantCreate, sizeMl }).success,
      ).toBe(true);
    }
  });

  it("rejects an invalid size", () => {
    expect(
      variantCreateSchema.safeParse({ ...validVariantCreate, sizeMl: 40 })
        .success,
    ).toBe(false);
  });

  it("rejects a negative price", () => {
    expect(
      variantCreateSchema.safeParse({
        ...validVariantCreate,
        priceKobo: -1,
      }).success,
    ).toBe(false);
  });

  it("rejects a non-integer price", () => {
    expect(
      variantCreateSchema.safeParse({
        ...validVariantCreate,
        priceKobo: 1000.5,
      }).success,
    ).toBe(false);
  });

  it("rejects a price above the cap", () => {
    expect(
      variantCreateSchema.safeParse({
        ...validVariantCreate,
        priceKobo: MAX_UNIT_PRICE_KOBO + 1,
      }).success,
    ).toBe(false);
  });

  it("accepts a price at the cap", () => {
    expect(
      variantCreateSchema.safeParse({
        ...validVariantCreate,
        priceKobo: MAX_UNIT_PRICE_KOBO,
      }).success,
    ).toBe(true);
  });

  it("rejects a negative stock", () => {
    expect(
      variantCreateSchema.safeParse({ ...validVariantCreate, stock: -1 })
        .success,
    ).toBe(false);
  });

  it("rejects a non-integer stock", () => {
    expect(
      variantCreateSchema.safeParse({ ...validVariantCreate, stock: 1.5 })
        .success,
    ).toBe(false);
  });

  it("rejects stock above the cap", () => {
    expect(
      variantCreateSchema.safeParse({
        ...validVariantCreate,
        stock: MAX_STOCK + 1,
      }).success,
    ).toBe(false);
  });
});

describe("variantUpdateSchema", () => {
  const validVariantUpdate = {
    id: VALID_UUID,
    priceKobo: 3_200_000,
    stock: 12,
  };

  it("accepts a valid payload", () => {
    expect(variantUpdateSchema.safeParse(validVariantUpdate).success).toBe(
      true,
    );
  });

  it("strips a sizeMl field from the payload", () => {
    const result = variantUpdateSchema.safeParse({
      ...validVariantUpdate,
      sizeMl: 50,
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect((result.data as Record<string, unknown>).sizeMl).toBeUndefined();
  });

  it("rejects an invalid id", () => {
    expect(
      variantUpdateSchema.safeParse({ ...validVariantUpdate, id: "not-a-uuid" })
        .success,
    ).toBe(false);
  });

  it("rejects a price above the cap", () => {
    expect(
      variantUpdateSchema.safeParse({
        ...validVariantUpdate,
        priceKobo: MAX_UNIT_PRICE_KOBO + 1,
      }).success,
    ).toBe(false);
  });
});