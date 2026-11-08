import { describe, it, expect } from "vitest";
import { normalizePhone } from "./phone";

describe("normalizePhone", () => {
  it("normalizes local format with 0", () => {
    expect(normalizePhone("08012345678")).toBe("+2348012345678");
  });

  it("normalizes international format with +", () => {
    expect(normalizePhone("+2348012345678")).toBe("+2348012345678");
  });

  it("normalizes international format without +", () => {
    expect(normalizePhone("2348012345678")).toBe("+2348012345678");
  });

  it("normalizes format with spaces", () => {
    expect(normalizePhone("0801 234 5678")).toBe("+2348012345678");
  });

  it("normalizes bare 10 digit number", () => {
    expect(normalizePhone("8012345678")).toBe("+2348012345678");
  });

  it("rejects too short", () => {
    expect(() => normalizePhone("12345")).toThrow();
  });

  it("rejects too long", () => {
    expect(() => normalizePhone("080123456789")).toThrow();
  });

  it("rejects invalid prefix", () => {
    expect(() => normalizePhone("06012345678")).toThrow();
  });
});