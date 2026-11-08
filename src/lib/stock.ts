export type StockLine = {
  variantId: string;
  quantity: number;
};

export type StockMap = Record<string, number>;

export type ReservationConflict = {
  variantId: string;
  requested: number;
  available: number;
};

export type ReservationResult =
  | { ok: true; reservation: StockLine[] }
  | { ok: false; conflicts: ReservationConflict[] };

/**
 * Pure decision logic for reserving stock. Given the cart lines and the
 * current stock per variant, return either the reservation plan (quantities
 * per variant to decrement) or the full list of conflicts.
 *
 * Duplicate variantIds are merged before checking, so callers may pass raw
 * cart lines. A variantId absent from `stockByVariant` is treated as zero
 * stock, which surfaces as a conflict rather than a crash.
 *
 * This function does not itself mutate stock. The transactional SQL in
 * Batch 5.1 uses `UPDATE ... WHERE stock >= $qty RETURNING stock` as the
 * real guard; this pure function is the testable decision layer that the
 * transaction consults before and after the guarded update.
 */
export function planStockReservation(
  lines: StockLine[],
  stockByVariant: StockMap,
): ReservationResult {
  for (const line of lines) {
    if (!Number.isInteger(line.quantity) || line.quantity < 1) {
      throw new Error(
        `Invalid quantity for ${line.variantId}: ${line.quantity}`,
      );
    }
  }

  const merged = new Map<string, number>();
  for (const line of lines) {
    merged.set(
      line.variantId,
      (merged.get(line.variantId) ?? 0) + line.quantity,
    );
  }

  const reservation: StockLine[] = [];
  const conflicts: ReservationConflict[] = [];

  for (const [variantId, requested] of merged) {
    const available = stockByVariant[variantId] ?? 0;
    if (!Number.isInteger(available) || available < 0) {
      throw new Error(`Invalid stock value for ${variantId}: ${available}`);
    }
    if (requested > available) {
      conflicts.push({ variantId, requested, available });
    } else {
      reservation.push({ variantId, quantity: requested });
    }
  }

  if (conflicts.length > 0) {
    return { ok: false, conflicts };
  }
  return { ok: true, reservation };
}