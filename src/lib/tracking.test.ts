import { describe, it, expect } from "vitest";
import { verifyTrackingMatch } from "./tracking";

const STORED_PHONE = "+2348012345678";

describe("verifyTrackingMatch", () => {
  it("matches a canonical phone", () => {
    expect(
      verifyTrackingMatch(STORED_PHONE, "ME-ABCDEF", "+2348012345678"),
    ).toEqual({ ok: true });
  });

  it("matches a local-format phone", () => {
    expect(
      verifyTrackingMatch(STORED_PHONE, "ME-ABCDEF", "08012345678"),
    ).toEqual({ ok: true });
  });

  it("matches a phone with spaces", () => {
    expect(
      verifyTrackingMatch(STORED_PHONE, "ME-ABCDEF", "0801 234 5678"),
    ).toEqual({ ok: true });
  });

  it("matches an international phone without the plus", () => {
    expect(
      verifyTrackingMatch(STORED_PHONE, "ME-ABCDEF", "2348012345678"),
    ).toEqual({ ok: true });
  });

  it("rejects a different phone", () => {
    expect(
      verifyTrackingMatch(STORED_PHONE, "ME-ABCDEF", "08099999999"),
    ).toEqual({ ok: false });
  });

  it("rejects an invalid phone", () => {
    expect(
      verifyTrackingMatch(STORED_PHONE, "ME-ABCDEF", "12345"),
    ).toEqual({ ok: false });
  });

  it("rejects a malformed order number", () => {
    expect(
      verifyTrackingMatch(STORED_PHONE, "NOPE", "08012345678"),
    ).toEqual({ ok: false });
  });

  it("rejects a wrong-prefix order number", () => {
    expect(
      verifyTrackingMatch(STORED_PHONE, "XX-ABCDEF", "08012345678"),
    ).toEqual({ ok: false });
  });

  it("rejects an order number with a forbidden character", () => {
    expect(
      verifyTrackingMatch(STORED_PHONE, "ME-ABC0EF", "08012345678"),
    ).toEqual({ ok: false });
  });

  it("returns the same failure shape for every reason", () => {
    const a = verifyTrackingMatch(STORED_PHONE, "ME-ABCDEF", "08099999999");
    const b = verifyTrackingMatch(STORED_PHONE, "NOPE", "08012345678");
    const c = verifyTrackingMatch(STORED_PHONE, "ME-ABCDEF", "12345");
    expect(a).toEqual(b);
    expect(b).toEqual(c);
  });
});