"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "./db";
import { productVariants, products, orderItems } from "./schema";
import { requireAdmin } from "./auth";
import { parseMoneyToKobo } from "@/lib/money";
import {
  variantCreateSchema,
  variantUpdateSchema,
} from "@/lib/admin-schemas";

type ActionResult =
  | { ok: true }
  | { ok: false; error: string; field?: string };

function isUniqueViolation(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; cause?: { code?: string } };
  if (e.code === "23505") return true;
  if (e.cause?.code === "23505") return true;
  return false;
}

async function revalidateProduct(productId: string) {
  const existing = (
    await db
      .select({ slug: products.slug })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1)
  ).at(0);

  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath(`/admin/products/${productId}`);

  if (existing) {
    revalidatePath(`/shop/${existing.slug}`);
  }
}

export async function createVariantAction(payload: {
  productId: string;
  sizeMl: number;
  priceNaira: string;
  stock: number;
}): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (auth.status === "unauthenticated") return { ok: false, error: "unauthenticated" };
  if (auth.status === "forbidden") return { ok: false, error: "forbidden" };
  if (auth.status === "misconfigured") return { ok: false, error: "misconfigured" };

  let priceKobo: number;
  try {
    priceKobo = parseMoneyToKobo(payload.priceNaira);
  } catch {
    return { ok: false, error: "invalid_price", field: "priceNaira" };
  }

  const parsed = variantCreateSchema.safeParse({
    productId: payload.productId,
    sizeMl: payload.sizeMl,
    priceKobo,
    stock: payload.stock,
  });

  if (!parsed.success) {
    return { ok: false, error: "invalid_input", field: "variant" };
  }

  try {
    await db.insert(productVariants).values({
      productId: parsed.data.productId,
      sizeMl: parsed.data.sizeMl,
      priceKobo: parsed.data.priceKobo,
      stock: parsed.data.stock,
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { ok: false, error: "size_taken", field: "sizeMl" };
    }
    return { ok: false, error: "internal_error" };
  }

  await revalidateProduct(parsed.data.productId);
  return { ok: true };
}

export async function updateVariantAction(payload: {
  id: string;
  productId: string;
  priceNaira: string;
  stock: number;
}): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (auth.status === "unauthenticated") return { ok: false, error: "unauthenticated" };
  if (auth.status === "forbidden") return { ok: false, error: "forbidden" };
  if (auth.status === "misconfigured") return { ok: false, error: "misconfigured" };

  let priceKobo: number;
  try {
    priceKobo = parseMoneyToKobo(payload.priceNaira);
  } catch {
    return { ok: false, error: "invalid_price", field: "priceNaira" };
  }

  const parsed = variantUpdateSchema.safeParse({
    id: payload.id,
    priceKobo,
    stock: payload.stock,
  });

  if (!parsed.success) {
    return { ok: false, error: "invalid_input", field: "variant" };
  }

  try {
    await db
      .update(productVariants)
      .set({
        priceKobo: parsed.data.priceKobo,
        stock: parsed.data.stock,
      })
      .where(eq(productVariants.id, parsed.data.id));
  } catch {
    return { ok: false, error: "internal_error" };
  }

  await revalidateProduct(payload.productId);
  return { ok: true };
}

export async function deleteVariantAction(payload: {
  id: string;
  productId: string;
}): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (auth.status === "unauthenticated") return { ok: false, error: "unauthenticated" };
  if (auth.status === "forbidden") return { ok: false, error: "forbidden" };
  if (auth.status === "misconfigured") return { ok: false, error: "misconfigured" };

  const referenced = (
    await db
      .select({ id: orderItems.id })
      .from(orderItems)
      .where(eq(orderItems.variantId, payload.id))
      .limit(1)
  ).at(0);

  if (referenced) {
    return { ok: false, error: "variant_has_orders" };
  }

  try {
    await db.delete(productVariants).where(eq(productVariants.id, payload.id));
  } catch {
    return { ok: false, error: "internal_error" };
  }

  await revalidateProduct(payload.productId);
  return { ok: true };
}