import { describe, it, expect } from "vitest";
import {
  ORDER_NUMBER_ALPHABET,
  ORDER_NUMBER_LENGTH,
  ORDER_NUMBER_PREFIX,
  generateOrderNumber,
  isValidOrderNumber,
} from "./order-number";

describe("ORDER_NUMBER_ALPHABET", () => {
  it("excludes 0, O, 1 and I", () => {
    expect(ORDER_NUMBER_ALPHABET).not.toMatch(/0/);
    expect(ORDER_NUMBER_ALPHABET).not.toMatch(/O/);
    expect(ORDER_NUMBER_ALPHABET).not.toMatch(/1/);
    expect(ORDER_NUMBER_ALPHABET).not.toMatch(/I/);
  });

  it("has 32 characters", () => {
    expect(ORDER_NUMBER_ALPHABET.length).toBe(32);
  });
});

describe("generateOrderNumber", () => {
  it("produces ME- plus six characters from the alphabet", () => {
    const n = generateOrderNumber();
    expect(n.startsWith(ORDER_NUMBER_PREFIX)).toBe(true);
    expect(n.length).toBe(ORDER_NUMBER_PREFIX.length + ORDER_NUMBER_LENGTH);
    for (const ch of n.slice(ORDER_NUMBER_PREFIX.length)) {
      expect(ORDER_NUMBER_ALPHABET.includes(ch)).toBe(true);
    }
  });

  // Sample-only uniqueness check. A collision inside 1000 samples has
  // probability around 0.0005 given the ~1.07B space, so this catches
  // obvious bugs (fixed return, tiny pool) without being flaky.
  it("produces unique values across 1000 generations", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      const n = generateOrderNumber();
      expect(seen.has(n)).toBe(false);
      seen.add(n);
    }
  });

  it("returns values accepted by isValidOrderNumber", () => {
    for (let i = 0; i < 50; i++) {
      expect(isValidOrderNumber(generateOrderNumber())).toBe(true);
    }
  });
});

describe("isValidOrderNumber", () => {
  it("rejects wrong prefix", () => {
    expect(isValidOrderNumber("MX-ABCDEF")).toBe(false);
    expect(isValidOrderNumber("ABCDEF")).toBe(false);
  });

  it("rejects wrong length", () => {
    expect(isValidOrderNumber("ME-ABCDE")).toBe(false);
    expect(isValidOrderNumber("ME-ABCDEFG")).toBe(false);
  });

  it("rejects excluded characters in the body", () => {
    expect(isValidOrderNumber("ME-ABC0EF")).toBe(false);
    expect(isValidOrderNumber("ME-ABCOEF")).toBe(false);
    expect(isValidOrderNumber("ME-ABC1EF")).toBe(false);
    expect(isValidOrderNumber("ME-ABCIEF")).toBe(false);
  });

  it("rejects lowercase bodies", () => {
    expect(isValidOrderNumber("me-ABCDEF")).toBe(false);
    expect(isValidOrderNumber("ME-abcdef")).toBe(false);
  });

  it("accepts a canonical number", () => {
    expect(isValidOrderNumber("ME-ABCDEF")).toBe(true);
    expect(isValidOrderNumber("ME-234567")).toBe(true);
  });
});