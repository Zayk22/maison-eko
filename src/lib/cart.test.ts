import { describe, it, expect } from "vitest";
import { parseStoredCart, serializeCart, CART_STORAGE_KEY } from "./cart";
import { MAX_QUANTITY_PER_LINE } from "./order";

describe("CART_STORAGE_KEY", () => {
  it("is stable", () => {
    expect(CART_STORAGE_KEY).toBe("maison-eko:cart:v1");
  });
});

describe("parseStoredCart", () => {
  it("returns [] for null", () => {
    expect(parseStoredCart(null)).toEqual([]);
  });

  it("returns [] for invalid JSON", () => {
    expect(parseStoredCart("{not json")).toEqual([]);
  });

  it("returns [] for non-array JSON", () => {
    expect(parseStoredCart('{"a":1}')).toEqual([]);
    expect(parseStoredCart('"string"')).toEqual([]);
    expect(parseStoredCart("42")).toEqual([]);
  });

  it("returns [] for an empty array", () => {
    expect(parseStoredCart("[]")).toEqual([]);
  });

  it("accepts a single valid line", () => {
    const raw = JSON.stringify([{ variantId: "abc", quantity: 2 }]);
    expect(parseStoredCart(raw)).toEqual([{ variantId: "abc", quantity: 2 }]);
  });

  it("accepts multiple valid lines", () => {
    const lines = [
      { variantId: "a", quantity: 1 },
      { variantId: "b", quantity: 3 },
    ];
    expect(parseStoredCart(JSON.stringify(lines))).toEqual(lines);
  });

  it("rejects quantity 0", () => {
    expect(
      parseStoredCart(JSON.stringify([{ variantId: "a", quantity: 0 }])),
    ).toEqual([]);
  });

  it("rejects quantity above the shared cap", () => {
    expect(
      parseStoredCart(
        JSON.stringify([{ variantId: "a", quantity: MAX_QUANTITY_PER_LINE + 1 }]),
      ),
    ).toEqual([]);
  });

  it("rejects non-integer quantity", () => {
    expect(
      parseStoredCart(JSON.stringify([{ variantId: "a", quantity: 1.5 }])),
    ).toEqual([]);
  });

  it("rejects empty variantId", () => {
    expect(
      parseStoredCart(JSON.stringify([{ variantId: "", quantity: 1 }])),
    ).toEqual([]);
  });

  it("rejects duplicate variantIds", () => {
    expect(
      parseStoredCart(
        JSON.stringify([
          { variantId: "a", quantity: 1 },
          { variantId: "a", quantity: 2 },
        ]),
      ),
    ).toEqual([]);
  });

  it("rejects when any single entry is invalid", () => {
    expect(
      parseStoredCart(
        JSON.stringify([
          { variantId: "a", quantity: 1 },
          { variantId: "b", quantity: -1 },
        ]),
      ),
    ).toEqual([]);
  });
});

describe("serializeCart", () => {
  it("round-trips through parseStoredCart", () => {
    const lines = [
      { variantId: "a", quantity: 2 },
      { variantId: "b", quantity: 5 },
    ];
    expect(parseStoredCart(serializeCart(lines))).toEqual(lines);
  });
});