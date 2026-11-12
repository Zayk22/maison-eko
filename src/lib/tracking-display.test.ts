import { describe, it, expect } from "vitest";
import { formatOrderDate, trackingStages } from "./tracking-display";
import type { OrderStatus } from "./types";

describe("formatOrderDate", () => {
  it("formats a known date as '9 Nov 2026, 4:53 pm'", () => {
    // 2026-11-09T15:53:00Z is 16:53 in Africa/Lagos (UTC+1, no DST).
    // Use 15:53Z to get 16:53 Lagos — adjust the target to the Lagos hour.
    const d = new Date("2026-11-09T15:53:00Z");
    // 15:53 UTC = 16:53 Lagos = "9 Nov 2026, 4:53 pm"
    expect(formatOrderDate(d)).toBe("9 Nov 2026, 4:53 pm");
  });

  it("handles morning times with lowercase am", () => {
    const d = new Date("2026-11-09T04:05:00Z"); // 05:05 Lagos
    expect(formatOrderDate(d)).toBe("9 Nov 2026, 5:05 am");
  });

  it("accepts a string input", () => {
    const d = "2026-11-09T15:53:00Z";
    expect(formatOrderDate(d)).toBe("9 Nov 2026, 4:53 pm");
  });
});

describe("trackingStages", () => {
  const emptyEvents: { status: OrderStatus }[] = [];

  it("pending shows pending done, rest pending", () => {
    const stages = trackingStages("pending", emptyEvents);
    expect(stages.map((s) => s.status)).toEqual([
      "pending",
      "confirmed",
      "paid",
      "shipped",
      "delivered",
    ]);
    expect(stages[0]!.done).toBe(true);
    expect(stages.slice(1).every((s) => !s.done)).toBe(true);
  });

  it("confirmed shows pending and confirmed done", () => {
    const stages = trackingStages("confirmed", emptyEvents);
    expect(stages[0]!.done).toBe(true);
    expect(stages[1]!.done).toBe(true);
    expect(stages[2]!.done).toBe(false);
  });

  it("paid shows pending, confirmed, paid done", () => {
    const stages = trackingStages("paid", emptyEvents);
    expect(stages.slice(0, 3).every((s) => s.done)).toBe(true);
    expect(stages.slice(3).every((s) => !s.done)).toBe(true);
  });

  it("shipped shows four stages done", () => {
    const stages = trackingStages("shipped", emptyEvents);
    expect(stages.slice(0, 4).every((s) => s.done)).toBe(true);
    expect(stages[4]!.done).toBe(false);
  });

  it("delivered shows all stages done", () => {
    const stages = trackingStages("delivered", emptyEvents);
    expect(stages.every((s) => s.done)).toBe(true);
  });

  it("cancelled shows only stages with events plus a cancelled entry", () => {
    const events: { status: OrderStatus }[] = [
      { status: "pending" },
      { status: "confirmed" },
    ];
    const stages = trackingStages("cancelled", events);
    expect(stages.map((s) => s.status)).toEqual([
      "pending",
      "confirmed",
      "cancelled",
    ]);
    expect(stages.every((s) => s.done)).toBe(true);
  });

  it("cancelled from pending shows only pending and cancelled", () => {
    const events: { status: OrderStatus }[] = [{ status: "pending" }];
    const stages = trackingStages("cancelled", events);
    expect(stages.map((s) => s.status)).toEqual(["pending", "cancelled"]);
  });
});