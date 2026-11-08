import { describe, it, expect } from "vitest";
import { planStockReservation } from "./stock";

describe("planStockReservation", () => {
  it("returns an empty reservation for an empty cart", () => {
    expect(planStockReservation([], {})).toEqual({ ok: true, reservation: [] });
  });

  it("reserves when stock is sufficient for a single line", () => {
    const result = planStockReservation(
      [{ variantId: "a", quantity: 3 }],
      { a: 10 },
    );
    expect(result).toEqual({
      ok: true,
      reservation: [{ variantId: "a", quantity: 3 }],
    });
  });

  it("reserves when stock is exactly equal to the request", () => {
    const result = planStockReservation(
      [{ variantId: "a", quantity: 5 }],
      { a: 5 },
    );
    expect(result.ok).toBe(true);
  });

  it("rejects when stock is one short", () => {
    const result = planStockReservation(
      [{ variantId: "a", quantity: 6 }],
      { a: 5 },
    );
    expect(result).toEqual({
      ok: false,
      conflicts: [{ variantId: "a", requested: 6, available: 5 }],
    });
  });

  it("merges duplicate variantIds before checking", () => {
    const result = planStockReservation(
      [
        { variantId: "a", quantity: 2 },
        { variantId: "a", quantity: 2 },
      ],
      { a: 5 },
    );
    expect(result).toEqual({
      ok: true,
      reservation: [{ variantId: "a", quantity: 4 }],
    });
  });

  it("rejects when merged duplicates exceed stock", () => {
    const result = planStockReservation(
      [
        { variantId: "a", quantity: 3 },
        { variantId: "a", quantity: 3 },
      ],
      { a: 5 },
    );
    expect(result).toEqual({
      ok: false,
      conflicts: [{ variantId: "a", requested: 6, available: 5 }],
    });
  });

  it("returns every conflict, not just the first", () => {
    const result = planStockReservation(
      [
        { variantId: "a", quantity: 10 },
        { variantId: "b", quantity: 1 },
        { variantId: "c", quantity: 2 },
      ],
      { a: 5, b: 10, c: 1 },
    );
    expect(result).toEqual({
      ok: false,
      conflicts: [
        { variantId: "a", requested: 10, available: 5 },
        { variantId: "c", requested: 2, available: 1 },
      ],
    });
  });

  it("treats a missing variantId as zero stock", () => {
    const result = planStockReservation(
      [{ variantId: "missing", quantity: 1 }],
      {},
    );
    expect(result).toEqual({
      ok: false,
      conflicts: [{ variantId: "missing", requested: 1, available: 0 }],
    });
  });

  it("throws on quantity zero", () => {
    expect(() =>
      planStockReservation([{ variantId: "a", quantity: 0 }], { a: 5 }),
    ).toThrow();
  });

  it("throws on negative quantity", () => {
    expect(() =>
      planStockReservation([{ variantId: "a", quantity: -1 }], { a: 5 }),
    ).toThrow();
  });

  it("throws on non-integer quantity", () => {
    expect(() =>
      planStockReservation([{ variantId: "a", quantity: 1.5 }], { a: 5 }),
    ).toThrow();
  });

  it("throws on negative stock in the map", () => {
    expect(() =>
      planStockReservation([{ variantId: "a", quantity: 1 }], { a: -1 }),
    ).toThrow();
  });
});