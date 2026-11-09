import { normalizePhone } from "./phone";
import { isValidOrderNumber } from "./order-number";

/**
 * The single result shape returned by the tracking lookup. Every failure
 * is the same shape with the same reason; the route never distinguishes
 * "wrong order number" from "wrong phone" so a caller cannot probe either
 * field independently.
 */
export type TrackingVerification = { ok: true } | { ok: false };

/**
 * Verify that the supplied phone matches the phone stored with an order.
 * The order-number format is checked first so we do not pay the cost of
 * a database query for a request that could never match.
 *
 * The stored phone is expected to already be in the canonical
 * +234xxxxxxxxxx form (the order creation action writes it that way). The
 * supplied phone is normalised here so a customer who types 0803... or
 * 234803... still matches.
 */
export function verifyTrackingMatch(
  storedPhone: string,
  suppliedOrderNumber: string,
  suppliedPhone: string,
): TrackingVerification {
  if (!isValidOrderNumber(suppliedOrderNumber)) return { ok: false };
  let normalised: string;
  try {
    normalised = normalizePhone(suppliedPhone);
  } catch {
    return { ok: false };
  }
  if (storedPhone !== normalised) return { ok: false };
  return { ok: true };
}