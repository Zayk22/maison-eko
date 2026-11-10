import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "./db";
import {
  orders,
  orderEvents,
  orderItems,
  products,
  productVariants,
  stores,
} from "./schema";
import { pyramidSchema, type Pyramid } from "../lib/pyramid";
import type { OrderStatus } from "@/lib/types";

export type ProductRow = typeof products.$inferSelect;
export type VariantRow = typeof productVariants.$inferSelect;
export type OrderRow = typeof orders.$inferSelect;
export type OrderItemRow = typeof orderItems.$inferSelect;
export type OrderEventRow = typeof orderEvents.$inferSelect;

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

export type OrderWithItems = OrderRow & { items: OrderItemRow[] };

export async function getStoreId(): Promise<string> {
  const row = (
    await db.select({ id: stores.id }).from(stores).limit(1)
  ).at(0);
  if (!row) throw new Error("No store row found.");
  return row.id;
}

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

export async function getVariantsByIds(
  ids: string[],
): Promise<VariantWithProduct[]> {
  if (ids.length === 0) return [];
  return db
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
}

export async function getOrderWithItems(
  orderNumber: string,
): Promise<OrderWithItems | null> {
  const orderRow = (
    await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber))
      .limit(1)
  ).at(0);
  if (orderRow === undefined) return null;

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderRow.id))
    .orderBy(orderItems.createdAt);

  return { ...orderRow, items };
}

export async function getOrderEvents(
  orderId: string,
): Promise<OrderEventRow[]> {
  return db
    .select()
    .from(orderEvents)
    .where(eq(orderEvents.orderId, orderId))
    .orderBy(asc(orderEvents.createdAt));
}

export async function getAllProducts(): Promise<ProductWithVariants[]> {
  const productRows = await db
    .select()
    .from(products)
    .orderBy(desc(products.createdAt));

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

export async function getProductById(
  id: string,
): Promise<ProductWithVariants | null> {
  const row = (
    await db.select().from(products).where(eq(products.id, id)).limit(1)
  ).at(0);
  if (row === undefined) return null;

  const variants = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, id))
    .orderBy(productVariants.sizeMl);

  return {
    ...row,
    pyramid: pyramidSchema.parse(row.pyramid),
    variants,
  };
}

export async function getVariantsByProductId(
  productId: string,
): Promise<VariantRow[]> {
  return db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, productId))
    .orderBy(productVariants.sizeMl);
}
export async function getAllOrders(
  statusFilter?: OrderStatus,
): Promise<OrderRow[]> {
  const query = db.select().from(orders);
  const filtered = statusFilter
    ? query.where(eq(orders.status, statusFilter))
    : query;
  return filtered.orderBy(desc(orders.createdAt));
}

export async function getOrderById(
  id: string,
): Promise<OrderWithItems & { events: OrderEventRow[] } | null> {
  const row = (
    await db.select().from(orders).where(eq(orders.id, id)).limit(1)
  ).at(0);
  if (!row) return null;

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, row.id))
    .orderBy(orderItems.createdAt);

  const events = await db
    .select()
    .from(orderEvents)
    .where(eq(orderEvents.orderId, row.id))
    .orderBy(asc(orderEvents.createdAt));

  return { ...row, items, events };
}