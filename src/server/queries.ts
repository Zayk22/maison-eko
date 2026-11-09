import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { products, productVariants } from "./schema";
import { pyramidSchema, type Pyramid } from "../lib/pyramid";

export type ProductRow = typeof products.$inferSelect;
export type VariantRow = typeof productVariants.$inferSelect;

// The row type already declares pyramid as Pyramid via $type<Pyramid>().
// The runtime parse below is defence in depth: if the DB contains a shape
// that no longer matches pyramidSchema (bad admin write, bad migration),
// the query throws at the boundary rather than letting malformed data
// flow into the UI.
export type ProductWithPyramid = Omit<ProductRow, "pyramid"> & {
  pyramid: Pyramid;
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