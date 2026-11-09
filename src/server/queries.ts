import { and, eq, inArray } from "drizzle-orm";
import { db } from "./db";
import { products, productVariants } from "./schema";
import { pyramidSchema, type Pyramid } from "../lib/pyramid";

export type ProductRow = typeof products.$inferSelect;
export type VariantRow = typeof productVariants.$inferSelect;

export type ProductWithPyramid = Omit<ProductRow, "pyramid"> & {
  pyramid: Pyramid;
};

export type ProductWithVariants = ProductWithPyramid & {
  variants: VariantRow[];
};

export async function getActiveProducts(): Promise<ProductWithPyramid[]> {
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.active, true))
    .orderBy(products.createdAt);
  return rows.map((r) => ({
    ...r,
    pyramid: pyramidSchema.parse(r.pyramid),
  }));
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductWithPyramid | null> {
  const row = (
    await db
      .select()
      .from(products)
      .where(and(eq(products.slug, slug), eq(products.active, true)))
      .limit(1)
  ).at(0);
  if (row === undefined) return null;
  return { ...row, pyramid: pyramidSchema.parse(row.pyramid) };
}

export async function getVariantsForProduct(
  productId: string,
): Promise<VariantRow[]> {
  return db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, productId))
    .orderBy(productVariants.sizeMl);
}

/**
 * Active products with their variants attached. Used by the shop grid and
 * the home page featured section, both of which need the minimum variant
 * price for the "from" label and for price sorting.
 */
export async function getActiveProductsWithVariants(): Promise<
  ProductWithVariants[]
> {
  const productRows = await db
    .select()
    .from(products)
    .where(eq(products.active, true))
    .orderBy(products.createdAt);

  if (productRows.length === 0) return [];

  const ids = productRows.map((p) => p.id);
  const variantRows = await db
    .select()
    .from(productVariants)
    .where(inArray(productVariants.productId, ids))
    .orderBy(productVariants.sizeMl);

  const byProduct = new Map<string, VariantRow[]>();
  for (const v of variantRows) {
    const list = byProduct.get(v.productId) ?? [];
    list.push(v);
    byProduct.set(v.productId, list);
  }

  return productRows.map((p) => ({
    ...p,
    pyramid: pyramidSchema.parse(p.pyramid),
    variants: byProduct.get(p.id) ?? [],
  }));
}