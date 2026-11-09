import { describe, it, expect } from "vitest";
import { FLAT_SHIPPING_KOBO, formatMoney, parseMoneyToKobo } from "./money";

describe("money", () => {
  it("has a flat shipping constant", () => {
    expect(FLAT_SHIPPING_KOBO).toBe(350000);
  });

  describe("formatMoney", () => {
    it("formats 0 kobo without decimals", () => {
      const out = formatMoney(0);
      expect(out).toMatch(/₦0/);
      expect(out).not.toMatch(/\.\d/);
    });

    it("formats whole naira without decimals", () => {
      const out = formatMoney(3200000);
      expect(out).toMatch(/₦32[,\s]?000/);
      expect(out).not.toMatch(/\.\d/);
    });

    it("formats 350,000 kobo (3,500 naira) without decimals", () => {
      const out = formatMoney(350000);
      expect(out).toMatch(/₦3[,\s]?500/);
      expect(out).not.toMatch(/\.\d/);
    });

    it("formats a fractional naira amount with 2 decimals", () => {
      expect(formatMoney(350050)).toMatch(/₦3[,\s]?500\.50/);
    });

    it("formats 50 kobo with 2 decimals", () => {
      expect(formatMoney(50)).toMatch(/₦0\.50/);
    });

    it("formats 32,000.50 naira with 2 decimals", () => {
      expect(formatMoney(3200050)).toMatch(/₦32[,\s]?000\.50/);
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