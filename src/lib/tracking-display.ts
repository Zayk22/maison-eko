import type { OrderStatus } from "./types";

export type TrackingStage = {
  status: OrderStatus;
  done: boolean;
};

const FORWARD_ORDER: OrderStatus[] = [
  "pending",
  "confirmed",
  "paid",
  "shipped",
  "delivered",
];

/**
 * Format a date in a stable, locale-independent shape for both server and
 * client rendering. The output looks like "9 Nov 2026, 4:53 pm".
 *
 * Uses Africa/Lagos as the time zone so the output is the same regardless
 * of the server's or the user's local time zone. Lowercases the am/pm
 * suffix because Intl emits "AM"/"PM".
 */
export function formatOrderDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const raw = d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Africa/Lagos",
  });
  return raw.replace(/\b(AM|PM)\b/, (m) => m.toLowerCase());
}

/**
 * Return the ordered list of tracking stages for a given order status.
 *
 * For a normal order: every stage up to and including currentStatus is
 * marked done, and the stages after it are marked pending. If an event
 * exists for a future stage (e.g. the admin skipped ahead), that stage is
 * also marked done.
 *
 * For a cancelled order: every stage that has an event is marked done,
 * and a single `cancelled` entry is appended. No future stages.
 */
export function trackingStages(
  currentStatus: OrderStatus,
  events: readonly { status: OrderStatus }[],
): TrackingStage[] {
  const eventSet = new Set(events.map((e) => e.status));

  if (currentStatus === "cancelled") {
    const done: TrackingStage[] = [];
    for (const status of FORWARD_ORDER) {
      if (eventSet.has(status)) {
        done.push({ status, done: true });
      }
    }
    done.push({ status: "cancelled", done: true });
    return done;
  }

  const currentIdx = FORWARD_ORDER.indexOf(currentStatus);
  const out: TrackingStage[] = [];
  for (let i = 0; i < FORWARD_ORDER.length; i++) {
    const status = FORWARD_ORDER[i]!;
    const done = i <= currentIdx || eventSet.has(status);
    out.push({ status, done });
  }
  return out;
}