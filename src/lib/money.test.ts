import { describe, it, expect } from "vitest";
import { FLAT_SHIPPING_KOBO, formatMoney, parseMoneyToKobo } from "./money";

describe("money", () => {
  it("has a flat shipping constant", () => {
    expect(FLAT_SHIPPING_KOBO).toBe(350000);
  });

  describe("formatMoney", () => {
    it("formats 0 kobo", () => {
      expect(formatMoney(0)).toMatch(/₦0\.00/);
    });

    it("formats a standard amount", () => {
      expect(formatMoney(350000)).toMatch(/₦3[,\s]?500\.00/);
    });

    it("formats with decimals", () => {
      expect(formatMoney(350050)).toMatch(/₦3[,\s]?500\.50/);
    });

    it("throws on float input", () => {
      expect(() => formatMoney(350.5)).toThrow();
    });
  });

  describe("parseMoneyToKobo", () => {
    it("parses plain numbers", () => {
      expect(parseMoneyToKobo("3500")).toBe(350000);
    });

    it("parses with commas and spaces", () => {
      expect(parseMoneyToKobo("3,500.50")).toBe(350050);
    });

    it("parses currency symbols", () => {
      expect(parseMoneyToKobo("₦3,500.00")).toBe(350000);
    });

    it("parses shorthand decimals", () => {
      expect(parseMoneyToKobo(".5")).toBe(50);
    });

    it("parses empty string to 0", () => {
      expect(parseMoneyToKobo("")).toBe(0);
    });

    it("rejects too many decimals", () => {
      expect(() => parseMoneyToKobo("3.555")).toThrow();
    });

    it("rejects non-numeric", () => {
      expect(() => parseMoneyToKobo("abc")).toThrow();
    });
  });
});