/**
 * Pure rate-limit decision logic, mirroring the SQL CASE-based upsert in
 * src/server/rate-limit.ts. Kept separate so the decision can be tested
 * without a database.
 *
 * Window semantics (mirrors the SQL):
 * - No existing row: this request opens a fresh window with count 1.
 * - Existing row whose reset_at is at or before now: this request resets
 *   the window to count 1 with a fresh reset_at.
 * - Existing row still in its window: this request increments the count.
 * - allowed is true iff the resulting count is <= limit.
 */

export type RateLimitState = {
  count: number;
  resetAt: Date;
};

export type RateLimitDecision = {
  allowed: boolean;
  newCount: number;
  newResetAt: Date;
};

export function decideRateLimit(
  state: RateLimitState | null,
  limit: number,
  windowMs: number,
  now: Date,
): RateLimitDecision {
  if (state === null || state.resetAt.getTime() <= now.getTime()) {
    const newResetAt = new Date(now.getTime() + windowMs);
    return {
      allowed: 1 <= limit,
      newCount: 1,
      newResetAt,
    };
  }
  const newCount = state.count + 1;
  return {
    allowed: newCount <= limit,
    newCount,
    newResetAt: state.resetAt,
  };
}

// Rate-limit constants, one place only.
// Per the architect's decision of 2026-11-09.
export const RATE_LIMITS = {
  orderPerIp: { limit: 8, windowMs: 10 * 60 * 1000 },
  orderPerPhone: { limit: 3, windowMs: 10 * 60 * 1000 },
  trackPerOrderNumber: { limit: 10, windowMs: 10 * 60 * 1000 },
  trackPerIp: { limit: 20, windowMs: 10 * 60 * 1000 },
} as const;

export const RATE_LIMIT_KEYS = {
  orderIp: (ip: string) => `order:ip:${ip}`,
  orderPhone: (phone: string) => `order:phone:${phone}`,
  trackOrder: (orderNumber: string) => `track:order:${orderNumber}`,
  trackIp: (ip: string) => `track:ip:${ip}`,
} as const;