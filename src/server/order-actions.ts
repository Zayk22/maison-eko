"use server";

import { headers as nextHeaders } from "next/headers";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import {
  orders,
  orderItems,
  orderEvents,
  productVariants,
  products,
  stores,
} from "./schema";
import {
  checkoutFormSchema,
  cartSubmissionSchema,
} from "@/lib/schemas";
import { generateOrderNumber } from "@/lib/order-number";
import {
  mergeCartLines,
  computeOrderTotals,
  type PricedLine,
} from "@/lib/order";
import type { CartLine } from "@/lib/types";
import { consumeRateLimit } from "./rate-limit";
import { RATE_LIMITS, RATE_LIMIT_KEYS } from "@/lib/rate-limit";

const MAX_ATTEMPTS = 3;

export type CreateOrderInput = {
  fields: {
    name: string;
    phone: string;
    streetAddress: string;
    area: string;
    state?: string;
    note?: string;
  };
  lines: CartLine[];
};

export type StockConflict = {
  variantId: string;
  requested: number;
  available: number;
};

export type CreateOrderResult =
  | { ok: true; orderNumber: string }
  | { ok: false; reason: "rate_limited" }
  | {
      ok: false;
      reason: "invalid_input";
      fieldErrors: Record<string, string[]>;
    }
  | { ok: false; reason: "insufficient_stock"; conflicts: StockConflict[] }
  | { ok: false; reason: "retry_exhausted" }
  | { ok: false; reason: "internal_error" };

class StockConflictError extends Error {
  constructor(public conflicts: StockConflict[]) {
    super("insufficient_stock");
  }
}

function isUniqueViolation(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; cause?: { code?: string } };
  if (e.code === "23505") return true;
  if (e.cause && e.cause.code === "23505") return true;
  return false;
}

async function getClientIp(): Promise<string> {
  const h = await nextHeaders();
  const realIp = h.get("x-real-ip");
  if (realIp && realIp.trim().length > 0) return realIp.trim();
  return "dev-ip-fallback";
}

async function attemptCreateOrder(input: {
  fields: z.output<typeof checkoutFormSchema>;
  lines: CartLine[];
}): Promise<{ ok: true; orderNumber: string }> {
  const orderNumber = generateOrderNumber();

  return await db.transaction(async (tx) => {
    const [storeRow] = await tx
      .select({ id: stores.id })
      .from(stores)
      .limit(1);
    if (!storeRow) throw new Error("No store row found.");
    const storeId = storeRow.id;

    const merged = mergeCartLines(input.lines);

    const updatedVariants = new Map<
      string,
      { productId: string; priceKobo: number; sizeMl: number }
    >();
    const conflicts: StockConflict[] = [];

    for (const line of merged) {
      const [updated] = await tx
        .update(productVariants)
        .set({
          stock: sql`${productVariants.stock} - ${line.quantity}`,
        })
        .where(
          and(
            eq(productVariants.id, line.variantId),
            gte(productVariants.stock, line.quantity),
          ),
        )
        .returning({
          id: productVariants.id,
          stock: productVariants.stock,
          priceKobo: productVariants.priceKobo,
          sizeMl: productVariants.sizeMl,
          productId: productVariants.productId,
        });

      if (!updated) {
        const [current] = await tx
          .select({ stock: productVariants.stock })
          .from(productVariants)
          .where(eq(productVariants.id, line.variantId))
          .limit(1);
        conflicts.push({
          variantId: line.variantId,
          requested: line.quantity,
          available: current?.stock ?? 0,
        });
      } else {
        updatedVariants.set(line.variantId, {
          productId: updated.productId,
          priceKobo: updated.priceKobo,
          sizeMl: updated.sizeMl,
        });
      }
    }

    if (conflicts.length > 0) {
      throw new StockConflictError(conflicts);
    }

    const pricedLines: PricedLine[] = merged.map((line) => ({
      variantId: line.variantId,
      quantity: line.quantity,
      unitPriceKobo: updatedVariants.get(line.variantId)!.priceKobo,
    }));

    const totals = computeOrderTotals(pricedLines);

    const productIds = Array.from(
      new Set(
        Array.from(updatedVariants.values()).map((v) => v.productId),
      ),
    );
    const productRows = await tx
      .select({ id: products.id, name: products.name })
      .from(products)
      .where(inArray(products.id, productIds));
    const productNameById = new Map(
      productRows.map((p) => [p.id, p.name]),
    );

    const [orderRow] = await tx
      .insert(orders)
      .values({
        storeId,
        orderNumber,
        customerName: input.fields.name,
        phone: input.fields.phone,
        address: input.fields.address,
        note: input.fields.note,
        status: "pending",
        subtotalKobo: totals.subtotalKobo,
        shippingKobo: totals.shippingKobo,
        totalKobo: totals.totalKobo,
      })
      .returning({ id: orders.id });

    if (!orderRow) throw new Error("Order insert returned no row.");
    const orderId = orderRow.id;

    await tx.insert(orderItems).values(
      merged.map((line) => {
        const v = updatedVariants.get(line.variantId)!;
        return {
          orderId,
          variantId: line.variantId,
          productName: productNameById.get(v.productId) ?? "Unknown",
          sizeMl: v.sizeMl,
          unitPriceKobo: v.priceKobo,
          quantity: line.quantity,
          lineTotalKobo: v.priceKobo * line.quantity,
        };
      }),
    );

    await tx.insert(orderEvents).values({
      orderId,
      status: "pending",
      note: "Order created",
    });

    return { ok: true as const, orderNumber };
  });
}

export async function createOrder(
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  // 1. IP rate limit (outside the transaction, so a rollback does not
  //    erase the count). Fail closed.
  const ip = await getClientIp();
  const ipResult = await consumeRateLimit(
    RATE_LIMIT_KEYS.orderIp(ip),
    RATE_LIMITS.orderPerIp.limit,
    RATE_LIMITS.orderPerIp.windowMs,
    "closed",
  );
  if (!ipResult.allowed) {
    return { ok: false, reason: "rate_limited" };
  }

  // 2. Validate the form.
  const parsedFields = checkoutFormSchema.safeParse(input.fields);
  if (!parsedFields.success) {
    const flat = z.flattenError(parsedFields.error);
    const fieldErrors: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(flat.fieldErrors)) {
      if (v && v.length > 0) fieldErrors[k] = v;
    }
    return { ok: false, reason: "invalid_input", fieldErrors };
  }

  // 3. Validate the cart.
  const parsedLines = cartSubmissionSchema.safeParse({ lines: input.lines });
  if (!parsedLines.success) {
    return {
      ok: false,
      reason: "invalid_input",
      fieldErrors: { cart: ["Invalid cart."] },
    };
  }

  // 4. Phone rate limit (uses the normalised phone). Fail closed.
  const phoneResult = await consumeRateLimit(
    RATE_LIMIT_KEYS.orderPhone(parsedFields.data.phone),
    RATE_LIMITS.orderPerPhone.limit,
    RATE_LIMITS.orderPerPhone.windowMs,
    "closed",
  );
  if (!phoneResult.allowed) {
    return { ok: false, reason: "rate_limited" };
  }

  // 5. Attempt the transaction, retrying the whole block on 23505.
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      return await attemptCreateOrder({
        fields: parsedFields.data,
        lines: parsedLines.data.lines,
      });
    } catch (err) {
      if (err instanceof StockConflictError) {
        return {
          ok: false,
          reason: "insufficient_stock",
          conflicts: err.conflicts,
        };
      }
      if (isUniqueViolation(err)) {
        continue;
      }
      return { ok: false, reason: "internal_error" };
    }
  }

  return { ok: false, reason: "retry_exhausted" };
}