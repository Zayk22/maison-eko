import { describe, it, expect } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("lowercases and joins words with dashes", () => {
    expect(slugify("Eko Nights")).toBe("eko-nights");
  });

  it("trims leading and trailing whitespace", () => {
    expect(slugify("  Eko Nights  ")).toBe("eko-nights");
  });

  it("collapses runs of spaces into a single dash", () => {
    expect(slugify("Eko   Nights")).toBe("eko-nights");
  });

  it("converts ampersand to 'and'", () => {
    expect(slugify("Palm & Wine")).toBe("palm-and-wine");
  });

  it("strips diacritics", () => {
    expect(slugify("Café Crème")).toBe("cafe-creme");
    expect(slugify("Ékphrasis")).toBe("ekphrasis");
  });

  it("converts punctuation to dashes and trims the edges", () => {
    expect(slugify("-Eko-")).toBe("eko");
    expect(slugify("!!Eko!!")).toBe("eko");
    expect(slugify("Eko's Nights!")).toBe("eko-s-nights");
  });

  it("preserves digits", () => {
    expect(slugify("N° 5")).toBe("n-5");
  });

  it("returns empty string for empty or whitespace-only input", () => {
    expect(slugify("")).toBe("");
    expect(slugify("   ")).toBe("");
  });

  it("returns empty string for input with no alphanumerics", () => {
    expect(slugify("!!!")).toBe("");
  });

  it("leaves an already-slug string unchanged", () => {
    expect(slugify("eko-nights")).toBe("eko-nights");
  });
});