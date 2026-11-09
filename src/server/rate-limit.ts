import { sql } from "drizzle-orm";
import { db } from "./db";
import { rateLimits } from "./schema";

export type RateLimitResult =
  | { allowed: true; reason?: "fail_open" }
  | { allowed: false; reason: "limit_exceeded" | "fail_closed" };

/**
 * Atomically consume one slot against `key`. The whole decision happens in
 * a single `INSERT ... ON CONFLICT DO UPDATE` statement, so concurrent
 * callers serialise on the row lock. The CASE expression resets the window
 * when reset_at has passed, rather than only filtering on reset_at > now().
 *
 * failMode "closed": on a database error, return { allowed: false }.
 *                    Use for order creation (a failing limiter must not
 *                    allow unbounded orders through).
 * failMode "open":   on a database error, return { allowed: true } with
 *                    reason "fail_open". Use for tracking lookups.
 *
 * This function is called OUTSIDE any order transaction, so a rollback in
 * the caller does not erase the counter.
 */
export async function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  failMode: "closed" | "open",
): Promise<RateLimitResult> {
  try {
    const resetAt = new Date(Date.now() + windowMs);
    const [row] = await db
      .insert(rateLimits)
      .values({ key, count: 1, resetAt })
      .onConflictDoUpdate({
        target: rateLimits.key,
        set: {
          count: sql`CASE WHEN ${rateLimits.resetAt} <= now() THEN 1 ELSE ${rateLimits.count} + 1 END`,
          resetAt: sql`CASE WHEN ${rateLimits.resetAt} <= now() THEN ${resetAt} ELSE ${rateLimits.resetAt} END`,
        },
      })
      .returning({ count: rateLimits.count });

    if (!row) {
      return failMode === "closed"
        ? { allowed: false, reason: "fail_closed" }
        : { allowed: true, reason: "fail_open" };
    }
    if (row.count > limit) {
      return { allowed: false, reason: "limit_exceeded" };
    }
    return { allowed: true };
  } catch {
    return failMode === "closed"
      ? { allowed: false, reason: "fail_closed" }
      : { allowed: true, reason: "fail_open" };
  }
}