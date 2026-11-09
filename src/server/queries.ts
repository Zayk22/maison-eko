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

export type VariantWithProduct = VariantRow & {
  productName: string;
  productSlug: string;
  productActive: boolean;
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

/**
 * Look up variants by id, joined with their product so the cart drawer can
 * display name, slug, size and current active/stock without a second query.
 * Unknown ids simply do not appear in the result, which the caller treats
 * as "no longer available".
 */
export async function getVariantsByIds(
  ids: string[],
): Promise<VariantWithProduct[]> {
  if (ids.length === 0) return [];
  const rows = await db
    .select({
      id: productVariants.id,
      productId: productVariants.productId,
      sizeMl: productVariants.sizeMl,
      priceKobo: productVariants.priceKobo,
      stock: productVariants.stock,
      createdAt: productVariants.createdAt,
      productName: products.name,
      productSlug: products.slug,
      productActive: products.active,
    })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(inArray(productVariants.id, ids));
  return rows;
}