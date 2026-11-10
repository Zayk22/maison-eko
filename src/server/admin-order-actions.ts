"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "./db";
import {
  orders,
  orderItems,
  orderEvents,
  productVariants,
} from "./schema";
import { requireAdmin } from "./auth";
import { orderStatusUpdateSchema } from "@/lib/admin-schemas";
import { canTransition, shouldRestock } from "@/lib/order";
import type { OrderStatus } from "@/lib/types";

type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateOrderStatusAction(payload: {
  orderId: string;
  nextStatus: OrderStatus;
}): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (auth.status === "unauthenticated") return { ok: false, error: "unauthenticated" };
  if (auth.status === "forbidden") return { ok: false, error: "forbidden" };
  if (auth.status === "misconfigured") return { ok: false, error: "misconfigured" };

  const parsed = orderStatusUpdateSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  try {
    return await db.transaction(async (tx) => {
      const currentRow = (
        await tx
          .select({ status: orders.status })
          .from(orders)
          .where(eq(orders.id, parsed.data.orderId))
          .limit(1)
      ).at(0);
      if (!currentRow) return { ok: false, error: "not_found" };

      if (!canTransition(currentRow.status, parsed.data.nextStatus)) {
        return { ok: false, error: "invalid_transition" };
      }

      // Conditional update to prevent races from another admin tab.
      const updated = await tx
        .update(orders)
        .set({ status: parsed.data.nextStatus })
        .where(eq(orders.id, parsed.data.orderId))
        .returning({ id: orders.id });
        
      if (updated.length === 0) return { ok: false, error: "stale" };

      if (shouldRestock(currentRow.status, parsed.data.nextStatus)) {
        const items = await tx
          .select({
            variantId: orderItems.variantId,
            quantity: orderItems.quantity,
          })
          .from(orderItems)
          .where(eq(orderItems.orderId, parsed.data.orderId));
        for (const item of items) {
          await tx
            .update(productVariants)
            .set({ stock: sql`${productVariants.stock} + ${item.quantity}` })
            .where(eq(productVariants.id, item.variantId));
        }
      }

      await tx.insert(orderEvents).values({
        orderId: parsed.data.orderId,
        status: parsed.data.nextStatus,
        note: `Status changed to ${parsed.data.nextStatus}`,
      });

      revalidatePath("/admin/orders");
      revalidatePath(`/admin/orders/${parsed.data.orderId}`);
      revalidatePath("/track-order");
      return { ok: true };
    });
  } catch {
    return { ok: false, error: "internal_error" };
  }
}