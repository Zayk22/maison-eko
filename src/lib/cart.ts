import type { CartLine } from "./types";
import { MAX_QUANTITY_PER_LINE } from "./order";

export const CART_STORAGE_KEY = "maison-eko:cart:v1";

function isValidLine(value: unknown): value is CartLine {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.variantId !== "string" || v.variantId.length === 0) return false;
  if (typeof v.quantity !== "number") return false;
  if (!Number.isInteger(v.quantity)) return false;
  if (v.quantity < 1) return false;
  if (v.quantity > MAX_QUANTITY_PER_LINE) return false;
  return true;
}

/**
 * Read a cart from the raw string previously written to localStorage.
 * Returns [] on any malformed input. Partial carts are not reconstructed
 * from partially valid data: a single invalid entry discards the whole
 * value, so a corrupted key cannot leave the user with half a cart.
 */
export function parseStoredCart(raw: string | null): CartLine[] {
  if (raw === null) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const out: CartLine[] = [];
  const seen = new Set<string>();
  for (const entry of parsed) {
    if (!isValidLine(entry)) return [];
    if (seen.has(entry.variantId)) return [];
    seen.add(entry.variantId);
    out.push({ variantId: entry.variantId, quantity: entry.quantity });
  }
  return out;
}

export function serializeCart(lines: CartLine[]): string {
  return JSON.stringify(lines);
}