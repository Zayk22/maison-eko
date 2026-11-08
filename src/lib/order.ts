import type { CartLine, OrderStatus } from "./types";
import { FLAT_SHIPPING_KOBO } from "./money";

/**
 * Merge duplicate variantId lines by summing quantities.
 * Preserves the order of first appearance so test output is stable.
 */
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

/**
 * Compute subtotal, shipping and total from lines the server has priced.
 * Never trusts the client: the caller must supply unitPriceKobo looked up
 * from the database (Batch 5.1 does this inside the order-creation transaction).
 *
 * Shipping is zero when the cart is empty, so a defensive caller cannot
 * charge shipping on nothing. Real checkouts reject empty carts upstream.
 */
export function computeOrderTotals(lines: PricedLine[]): OrderTotals {
  let subtotalKobo = 0;
  for (const line of lines) {
    if (!Number.isInteger(line.quantity) || line.quantity < 1) {
      throw new Error(`Invalid quantity for ${line.variantId}: ${line.quantity}`);
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

/**
 * Allowed forward transitions:
 *   pending   -> confirmed | cancelled
 *   confirmed -> paid | cancelled
 *   paid      -> shipped | cancelled
 *   shipped   -> delivered
 *   delivered -> (terminal)
 *   cancelled -> (terminal)
 *
 * Any other move, including same-status, is forbidden. Backwards moves
 * (e.g. paid -> confirmed) are not supported in v1.
 */
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

/**
 * Stock was decremented at order creation, so it is restored only when an
 * order is cancelled. Because `cancelled -> cancelled` is not a valid
 * transition and every update is conditional on the current status, the
 * database can never restock twice for the same order.
 */
export function shouldRestock(from: OrderStatus, to: OrderStatus): boolean {
  return to === "cancelled" && from !== "cancelled";
}