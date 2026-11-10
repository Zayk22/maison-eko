"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "./db";
import { products, productVariants } from "./schema";
import { requireAdmin } from "./auth";
import { getStoreId } from "./queries";
import { slugify } from "@/lib/slug";
import {
  productCreateSchema,
  productUpdateSchema,
} from "@/lib/admin-schemas";
import type { Pyramid } from "@/lib/pyramid";
import type { ScentFamily } from "@/lib/types";

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

function revalidateAll() {
  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/shop");
}

export async function createProductAction(payload: {
  name: string;
  slug?: string;
  description: string;
  pyramid: Pyramid;
  scentFamilyTags: ScentFamily[];
  accentHex: string;
}): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (auth.status === "unauthenticated") return { ok: false, error: "unauthenticated" };
  if (auth.status === "forbidden") return { ok: false, error: "forbidden" };
  if (auth.status === "misconfigured") return { ok: false, error: "misconfigured" };

  const parsed = productCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: "invalid_input" };
  }

  const finalSlug = parsed.data.slug?.trim()
    ? parsed.data.slug.trim()
    : slugify(parsed.data.name);

  if (finalSlug.length < 2) {
    return { ok: false, error: "invalid_slug", field: "slug" };
  }

  const storeId = await getStoreId();

  try {
    await db.insert(products).values({
      storeId,
      name: parsed.data.name,
      slug: finalSlug,
      description: parsed.data.description,
      pyramid: parsed.data.pyramid,
      scentFamilyTags: parsed.data.scentFamilyTags,
      accentHex: parsed.data.accentHex,
      active: false,
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { ok: false, error: "slug_taken", field: "slug" };
    }
    return { ok: false, error: "internal_error" };
  }

  revalidateAll();
  return { ok: true };
}

export async function updateProductAction(payload: {
  id: string;
  name: string;
  description: string;
  pyramid: Pyramid;
  scentFamilyTags: ScentFamily[];
  accentHex: string;
}): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (auth.status === "unauthenticated") return { ok: false, error: "unauthenticated" };
  if (auth.status === "forbidden") return { ok: false, error: "forbidden" };
  if (auth.status === "misconfigured") return { ok: false, error: "misconfigured" };

  const parsed = productUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: "invalid_input" };
  }

  const existing = await db
    .select({ slug: products.slug })
    .from(products)
    .where(eq(products.id, parsed.data.id))
    .limit(1);

  if (!existing[0]) {
    return { ok: false, error: "not_found" };
  }

  try {
    await db
      .update(products)
      .set({
        name: parsed.data.name,
        description: parsed.data.description,
        pyramid: parsed.data.pyramid,
        scentFamilyTags: parsed.data.scentFamilyTags,
        accentHex: parsed.data.accentHex,
      })
      .where(eq(products.id, parsed.data.id));
  } catch {
    return { ok: false, error: "internal_error" };
  }

  revalidateAll();
  revalidatePath(`/shop/${existing[0].slug}`);
  revalidatePath(`/admin/products/${parsed.data.id}`);
  return { ok: true };
}

export async function setProductActiveAction(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (auth.status === "unauthenticated") return { ok: false, error: "unauthenticated" };
  if (auth.status === "forbidden") return { ok: false, error: "forbidden" };
  if (auth.status === "misconfigured") return { ok: false, error: "misconfigured" };

  if (active) {
    const existingVariant = (
      await db
        .select({ id: productVariants.id })
        .from(productVariants)
        .where(eq(productVariants.productId, id))
        .limit(1)
    ).at(0);
    if (!existingVariant) {
      return { ok: false, error: "no_variants" };
    }
  }

  const existing = (
    await db
      .select({ slug: products.slug })
      .from(products)
      .where(eq(products.id, id))
      .limit(1)
  ).at(0);

  if (!existing) {
    return { ok: false, error: "not_found" };
  }

  try {
    await db.update(products).set({ active }).where(eq(products.id, id));
  } catch {
    return { ok: false, error: "internal_error" };
  }

  revalidateAll();
  revalidatePath(`/shop/${existing.slug}`);
  revalidatePath(`/admin/products/${id}`);
  return { ok: true };
}