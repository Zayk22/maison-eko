import { describe, it, expect } from "vitest";
import { isAdminUser } from "./admin";

describe("isAdminUser", () => {
  it("returns true for matching ids", () => {
    expect(isAdminUser("user_123", "user_123")).toBe(true);
  });

  it("returns false for mismatched ids", () => {
    expect(isAdminUser("user_123", "user_456")).toBe(false);
  });

  it("returns false for null user id", () => {
    expect(isAdminUser(null, "user_123")).toBe(false);
  });

  it("returns false for undefined user id", () => {
    expect(isAdminUser(undefined, "user_123")).toBe(false);
  });

  it("returns false for empty admin id", () => {
    expect(isAdminUser("user_123", "")).toBe(false);
  });

  it("returns false for whitespace-only admin id", () => {
    expect(isAdminUser("user_123", "   ")).toBe(false);
  });

  it("returns false for empty user id", () => {
    expect(isAdminUser("", "user_123")).toBe(false);
  });

  it("returns false for whitespace-only user id", () => {
    expect(isAdminUser("   ", "user_123")).toBe(false);
  });

  it("trims whitespace before comparing (user side)", () => {
    expect(isAdminUser("  user_123  ", "user_123")).toBe(true);
  });

  it("trims whitespace before comparing (admin side)", () => {
    expect(isAdminUser("user_123", "  user_123  ")).toBe(true);
  });
});