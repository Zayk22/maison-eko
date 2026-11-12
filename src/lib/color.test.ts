import { describe, it, expect } from "vitest";
import {
  INK,
  BONE,
  CHOSEN_TINT_PERCENT,
  WASH_PERCENT_STORY,
  parseColor,
  composite,
  contrastRatio,
  readableOn,
  relativeLuminance,
  tintWash,
} from "./color";
import { SEED_FRAGRANCES as SEED_DATA } from "@/data/seed-data";

const SEED_FRAGRANCES = SEED_DATA.map((f) => ({
  name: f.name,
  hex: f.accentHex,
}));

describe("parseColor", () => {
  it("parses six-digit hex", () => {
    expect(parseColor("#000000")).toEqual({ r: 0, g: 0, b: 0, a: 1 });
    expect(parseColor("#FFFFFF")).toEqual({ r: 255, g: 255, b: 255, a: 1 });
  });

  it("parses rgba with alpha", () => {
    expect(parseColor("rgba(27, 20, 16, 0.62)")).toEqual({
      r: 27,
      g: 20,
      b: 16,
      a: 0.62,
    });
  });

  it("rejects unsupported formats", () => {
    expect(() => parseColor("#abc")).toThrow(/Unsupported colour/);
    expect(() => parseColor("red")).toThrow(/Unsupported colour/);
  });
});

describe("composite", () => {
  it("leaves opaque foreground unchanged", () => {
    const fg = parseColor("#1B1410");
    const bg = parseColor("#FFFFFF");
    expect(composite(fg, bg)).toEqual(fg);
  });

  it("blends a translucent foreground toward the background", () => {
    const fg = parseColor("rgba(0, 0, 0, 0.5)");
    const bg = parseColor("#FFFFFF");
    const out = composite(fg, bg);
    expect(out.r).toBeCloseTo(127.5, 5);
    expect(out.g).toBeCloseTo(127.5, 5);
    expect(out.b).toBeCloseTo(127.5, 5);
    expect(out.a).toBe(1);
  });
});

describe("relativeLuminance", () => {
  it("returns 0 for black", () => {
    expect(relativeLuminance(parseColor("#000000"))).toBe(0);
  });

  it("returns 1 for white", () => {
    expect(relativeLuminance(parseColor("#FFFFFF"))).toBe(1);
  });
});

describe("contrastRatio", () => {
  it("returns 21 for black on white", () => {
    expect(
      contrastRatio(parseColor("#000000"), parseColor("#FFFFFF")),
    ).toBeCloseTo(21, 5);
  });

  it("returns 1 for identical colours", () => {
    expect(
      contrastRatio(parseColor("#777777"), parseColor("#777777")),
    ).toBeCloseTo(1, 5);
  });

  it("is symmetric in argument order", () => {
    const a = parseColor("#1B1410");
    const b = parseColor("#F4EFE8");
    expect(contrastRatio(a, b)).toBeCloseTo(contrastRatio(b, a), 5);
  });

  it("uses the WCAG gamma curve, not a linear shortcut", () => {
    const ratio = contrastRatio(parseColor("#777777"), parseColor("#FFFFFF"));
    expect(ratio).toBeGreaterThan(4.47);
    expect(ratio).toBeLessThan(4.49);
  });
});

describe("readableOn regressions against measured fragrance values", () => {
  it("Eko Nights passesLarge but not passesNormal on its raw colour", () => {
    const r = readableOn("#B8691F", INK, BONE);
    expect(r.passesNormal).toBe(false);
    expect(r.passesLarge).toBe(true);
  });

  it("Adire chooses bone and passes normal text", () => {
    const r = readableOn("#3B4A8F", INK, BONE);
    expect(r.color).toBe("var(--color-bg)");
    expect(r.passesNormal).toBe(true);
  });

  it("Palm Wine chooses ink and passes normal text", () => {
    const r = readableOn("#D9B15B", INK, BONE);
    expect(r.color).toBe("var(--color-ink)");
    expect(r.passesNormal).toBe(true);
  });

  it("exposes both candidate ratios so callers can audit the choice", () => {
    const r = readableOn("#777777", INK, BONE);
    expect(r.ratio).toBeCloseTo(Math.max(r.inkRatio, r.boneRatio), 10);
  });
});

describe("tintWash", () => {
  it("returns bone at 0 percent", () => {
    expect(tintWash("#B8691F", BONE, 0)).toBe(BONE.toUpperCase());
  });

  it("returns the fragrance colour at 100 percent", () => {
    expect(tintWash("#B8691F", BONE, 100)).toBe("#B8691F");
  });

  it.skipIf(CHOSEN_TINT_PERCENT === null)(
    "every fragrance at CHOSEN_TINT_PERCENT passes ink >= 5.0 and muted >= 4.5",
    () => {
      const p = CHOSEN_TINT_PERCENT!;
      const mutedRaw = parseColor("rgba(27, 20, 16, 0.62)");
      for (const f of SEED_FRAGRANCES) {
        const wash = tintWash(f.hex, BONE, p);
        const washRgba = parseColor(wash);
        const inkRatio = contrastRatio(parseColor(INK), washRgba);
        const mutedRatio = contrastRatio(
          composite(mutedRaw, washRgba),
          washRgba,
        );
        expect(inkRatio).toBeGreaterThanOrEqual(5.0);
        expect(mutedRatio).toBeGreaterThanOrEqual(4.5);
      }
    },
  );
});

describe("WASH_PERCENT_STORY contrast", () => {
  it("ink on story wash is at least 5.0 for all seed fragrances", () => {
    for (const f of SEED_FRAGRANCES) {
      const wash = tintWash(f.hex, BONE, WASH_PERCENT_STORY);
      const ratio = contrastRatio(parseColor(INK), parseColor(wash));
      expect(ratio).toBeGreaterThanOrEqual(5.0);
    }
  });
});

describe("readableOn over every seed fragrance accent", () => {
  it("prints the ratio table for all eight fragrances", () => {
    console.log("");
    console.log("Fragrance wash contrast (ink vs bone)");
    console.log(
      "Fragrance".padEnd(14) +
        "Hex".padEnd(10) +
        "Chosen".padEnd(8) +
        "Ratio".padEnd(8) +
        "Ink".padEnd(8) +
        "Bone".padEnd(8) +
        "4.5".padEnd(6) +
        "3.0",
    );
    console.log("-".repeat(78));
    for (const f of SEED_FRAGRANCES) {
      const r = readableOn(f.hex, INK, BONE);
      const chosen = r.color === "var(--color-ink)" ? "ink" : "bone";
      console.log(
        f.name.padEnd(14) +
          f.hex.padEnd(10) +
          chosen.padEnd(8) +
          r.ratio.toFixed(2).padEnd(8) +
          r.inkRatio.toFixed(2).padEnd(8) +
          r.boneRatio.toFixed(2).padEnd(8) +
          (r.passesNormal ? "PASS" : "FAIL").padEnd(6) +
          (r.passesLarge ? "PASS" : "FAIL"),
      );
      expect(r.color === "var(--color-ink)" || r.color === "var(--color-bg)").toBe(true);
    }
  });
});