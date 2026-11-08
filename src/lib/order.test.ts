import { describe, it, expect } from "vitest";
import {
  allowedTransitionsFrom,
  canTransition,
  computeOrderTotals,
  mergeCartLines,
  shouldRestock,
} from "./order";
import { FLAT_SHIPPING_KOBO } from "./money";
import { ORDER_STATUSES, type OrderStatus } from "./types";

describe("mergeCartLines", () => {
  it("returns an empty array for an empty cart", () => {
    expect(mergeCartLines([])).toEqual([]);
  });

  it("preserves lines when there are no duplicates", () => {
    const lines = [
      { variantId: "a", quantity: 1 },
      { variantId: "b", quantity: 2 },
    ];
    expect(mergeCartLines(lines)).toEqual(lines);
  });

  it("sums quantities for duplicate variantIds", () => {
    const lines = [
      { variantId: "a", quantity: 2 },
      { variantId: "b", quantity: 1 },
      { variantId: "a", quantity: 3 },
    ];
    expect(mergeCartLines(lines)).toEqual([
      { variantId: "a", quantity: 5 },
      { variantId: "b", quantity: 1 },
    ]);
  });
});

describe("computeOrderTotals", () => {
  it("returns all zeros for an empty cart", () => {
    expect(computeOrderTotals([])).toEqual({
      subtotalKobo: 0,
      shippingKobo: 0,
      totalKobo: 0,
    });
  });

  it("adds shipping for a single line", () => {
    expect(
      computeOrderTotals([{ variantId: "a", quantity: 1, unitPriceKobo: 3200000 }]),
    ).toEqual({
      subtotalKobo: 3200000,
      shippingKobo: FLAT_SHIPPING_KOBO,
      totalKobo: 3200000 + FLAT_SHIPPING_KOBO,
    });
  });

  it("adds shipping once for multiple lines", () => {
    expect(
      computeOrderTotals([
        { variantId: "a", quantity: 1, unitPriceKobo: 3200000 },
        { variantId: "b", quantity: 2, unitPriceKobo: 4000000 },
      ]),
    ).toEqual({
      subtotalKobo: 3200000 + 8000000,
      shippingKobo: FLAT_SHIPPING_KOBO,
      totalKobo: 3200000 + 8000000 + FLAT_SHIPPING_KOBO,
    });
  });

  it("uses the prices it is given, so a caller that supplies different prices gets different totals", () => {
    const cheap = computeOrderTotals([
      { variantId: "a", quantity: 1, unitPriceKobo: 1000 },
    ]);
    const expensive = computeOrderTotals([
      { variantId: "a", quantity: 1, unitPriceKobo: 9999 },
    ]);
    expect(cheap.subtotalKobo).toBe(1000);
    expect(expensive.subtotalKobo).toBe(9999);
  });

  it("throws on quantity 0", () => {
    expect(() =>
      computeOrderTotals([{ variantId: "a", quantity: 0, unitPriceKobo: 1000 }]),
    ).toThrow();
  });

  it("throws on non-integer quantity", () => {
    expect(() =>
      computeOrderTotals([
        { variantId: "a", quantity: 1.5, unitPriceKobo: 1000 },
      ]),
    ).toThrow();
  });

  it("throws on negative unit price", () => {
    expect(() =>
      computeOrderTotals([{ variantId: "a", quantity: 1, unitPriceKobo: -100 }]),
    ).toThrow();
  });

  it("throws on non-integer unit price", () => {
    expect(() =>
      computeOrderTotals([
        { variantId: "a", quantity: 1, unitPriceKobo: 1000.5 },
      ]),
    ).toThrow();
  });
});

describe("status transitions", () => {
  const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["paid", "cancelled"],
    paid: ["shipped", "cancelled"],
    shipped: ["delivered"],
    delivered: [],
    cancelled: [],
  };

  for (const from of ORDER_STATUSES) {
    for (const to of ORDER_STATUSES) {
      const allowed = TRANSITIONS[from].includes(to);
      it(`${from} -> ${to}: ${allowed ? "allowed" : "forbidden"}`, () => {
        expect(canTransition(from, to)).toBe(allowed);
      });
    }
  }

  it("allowedTransitionsFrom matches the table", () => {
    for (const from of ORDER_STATUSES) {
      expect(allowedTransitionsFrom(from).sort()).toEqual(
        [...TRANSITIONS[from]].sort(),
      );
    }
  });
});

describe("shouldRestock", () => {
  it("restocks on cancel from pending", () => {
    expect(shouldRestock("pending", "cancelled")).toBe(true);
  });

  it("restocks on cancel from confirmed", () => {
    expect(shouldRestock("confirmed", "cancelled")).toBe(true);
  });

  it("restocks on cancel from paid", () => {
    expect(shouldRestock("paid", "cancelled")).toBe(true);
  });

  it("does not restock on any forward transition", () => {
    expect(shouldRestock("pending", "confirmed")).toBe(false);
    expect(shouldRestock("confirmed", "paid")).toBe(false);
    expect(shouldRestock("paid", "shipped")).toBe(false);
    expect(shouldRestock("shipped", "delivered")).toBe(false);
  });

  it("does not restock when already cancelled", () => {
    expect(shouldRestock("cancelled", "cancelled")).toBe(false);
  });
});