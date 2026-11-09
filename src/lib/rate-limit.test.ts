import { describe, it, expect } from "vitest";
import { decideRateLimit, RATE_LIMITS } from "./rate-limit";

const WINDOW_MS = 60_000;
const NOW = new Date("2026-01-01T12:00:00Z");

describe("decideRateLimit", () => {
  it("opens a fresh window when no row exists", () => {
    const result = decideRateLimit(null, 5, WINDOW_MS, NOW);
    expect(result.allowed).toBe(true);
    expect(result.newCount).toBe(1);
    expect(result.newResetAt.getTime()).toBe(NOW.getTime() + WINDOW_MS);
  });

  it("increments within an active window", () => {
    const state = {
      count: 3,
      resetAt: new Date(NOW.getTime() + WINDOW_MS),
    };
    const result = decideRateLimit(state, 5, WINDOW_MS, NOW);
    expect(result.allowed).toBe(true);
    expect(result.newCount).toBe(4);
    expect(result.newResetAt.getTime()).toBe(state.resetAt.getTime());
  });

  it("allows the request that reaches the limit exactly", () => {
    const state = {
      count: 4,
      resetAt: new Date(NOW.getTime() + WINDOW_MS),
    };
    const result = decideRateLimit(state, 5, WINDOW_MS, NOW);
    expect(result.allowed).toBe(true);
    expect(result.newCount).toBe(5);
  });

  it("blocks the request that would exceed the limit", () => {
    const state = {
      count: 5,
      resetAt: new Date(NOW.getTime() + WINDOW_MS),
    };
    const result = decideRateLimit(state, 5, WINDOW_MS, NOW);
    expect(result.allowed).toBe(false);
    expect(result.newCount).toBe(6);
  });

  it("resets the count when the window has expired (regression)", () => {
    // The critical regression: a stored row at the limit but with a
    // resetAt in the past must be reset to 1 and allowed, not blocked.
    const state = {
      count: 5,
      resetAt: new Date(NOW.getTime() - 1000),
    };
    const result = decideRateLimit(state, 5, WINDOW_MS, NOW);
    expect(result.allowed).toBe(true);
    expect(result.newCount).toBe(1);
    expect(result.newResetAt.getTime()).toBe(NOW.getTime() + WINDOW_MS);
  });

  it("resets when resetAt equals now exactly", () => {
    const state = { count: 5, resetAt: new Date(NOW.getTime()) };
    const result = decideRateLimit(state, 5, WINDOW_MS, NOW);
    expect(result.allowed).toBe(true);
    expect(result.newCount).toBe(1);
  });

  it("works with the documented order-per-IP limit", () => {
    const { limit, windowMs } = RATE_LIMITS.orderPerIp;
    for (let i = 1; i <= limit; i++) {
      const state = {
        count: i - 1,
        resetAt: new Date(NOW.getTime() + windowMs),
      };
      expect(decideRateLimit(state, limit, windowMs, NOW).allowed).toBe(true);
    }
    const atLimit = {
      count: limit,
      resetAt: new Date(NOW.getTime() + windowMs),
    };
    expect(decideRateLimit(atLimit, limit, windowMs, NOW).allowed).toBe(false);
  });

  it("works with the documented order-per-phone limit", () => {
    const { limit, windowMs } = RATE_LIMITS.orderPerPhone;
    const atLimit = {
      count: limit,
      resetAt: new Date(NOW.getTime() + windowMs),
    };
    expect(decideRateLimit(atLimit, limit, windowMs, NOW).allowed).toBe(false);
  });

  it("works with the documented track-per-order-number limit", () => {
    const { limit, windowMs } = RATE_LIMITS.trackPerOrderNumber;
    const atLimit = {
      count: limit,
      resetAt: new Date(NOW.getTime() + windowMs),
    };
    expect(decideRateLimit(atLimit, limit, windowMs, NOW).allowed).toBe(false);
  });

  it("works with the documented track-per-IP limit", () => {
    const { limit, windowMs } = RATE_LIMITS.trackPerIp;
    const atLimit = {
      count: limit,
      resetAt: new Date(NOW.getTime() + windowMs),
    };
    expect(decideRateLimit(atLimit, limit, windowMs, NOW).allowed).toBe(false);
  });
});