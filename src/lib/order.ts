import type { CartLine, OrderStatus } from "./types";
import { FLAT_SHIPPING_KOBO } from "./money";

/**
 * Per-line cap on quantity. Shared between the cart context and the order
 * Zod schema so the UI cannot accumulate a quantity the order schema would
 * reject. 10 is the number already implied by the overflow analysis in
 * PROJECT_STATE.md (10 lines x 10 qty x 10,000,000 kobo ceiling).
 */
export const MAX_QUANTITY_PER_LINE = 10;

export function mergeCartLines(lines: CartLine[]): CartLine[] {
  const byId = new Map<string, number>();
  const order: string[] = [];
  for (const line of lines) {
    if (!byId.has(line.variantId)) order.push(line.variantId);
    byId.set(line.variantId, (byId.get(line.variantId) ?? 0) + line.quantity);
  }
  return order.map((variantId) => ({ variantId, quantity: byId.get(variantId)! }));
}

export type PricedLine = {
  variantId: string;
  quantity: number;
  unitPriceKobo: number;
};

export type OrderTotals = {
  subtotalKobo: number;
  shippingKobo: number;
  totalKobo: number;
};

export function computeOrderTotals(lines: PricedLine[]): OrderTotals {
  let subtotalKobo = 0;
  for (const line of lines) {
    if (!Number.isInteger(line.quantity) || line.quantity < 1) {
      throw new Error(`Invalid quantity for ${line.variantId}: ${line.quantity}`);
    }
    if (line.quantity > MAX_QUANTITY_PER_LINE) {
      throw new Error(
        `Quantity for ${line.variantId} exceeds the per-line cap of ${MAX_QUANTITY_PER_LINE}.`,
      );
    }
    if (!Number.isInteger(line.unitPriceKobo) || line.unitPriceKobo < 0) {
      throw new Error(
        `Invalid unit price for ${line.variantId}: ${line.unitPriceKobo}`,
      );
    }
    subtotalKobo += line.unitPriceKobo * line.quantity;
  }
  if (!Number.isSafeInteger(subtotalKobo)) {
    throw new Error("Order subtotal exceeds safe integer limits.");
  }
  const shippingKobo = subtotalKobo > 0 ? FLAT_SHIPPING_KOBO : 0;
  return {
    subtotalKobo,
    shippingKobo,
    totalKobo: subtotalKobo + shippingKobo,
  };
}

const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["paid", "cancelled"],
  paid: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function allowedTransitionsFrom(from: OrderStatus): OrderStatus[] {
  return [...TRANSITIONS[from]];
}

export function shouldRestock(from: OrderStatus, to: OrderStatus): boolean {
  return to === "cancelled" && from !== "cancelled";
}