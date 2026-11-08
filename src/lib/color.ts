// WCAG 2.1 relative luminance and contrast ratio.
// sRGB gamma correction per https://www.w3.org/TR/WCAG21/#dfn-relative-luminance

export type Rgba = { r: number; g: number; b: number; a: number };

// Canonical ink and bone. Must match --color-ink and --color-bg in
// src/app/globals.css. scripts/check-contrast.ts asserts the match and
// exits non-zero if either has drifted.
export const INK = "#1B1410";
export const BONE = "#F4EFE8";

/**
 * Architect-approved tinted-wash percentage for page backgrounds.
 *
 * Approved 2026-11-08 at 10%: for all eight fragrances, ink on the tinted
 * wash clears 5.0:1 and composited muted clears 4.5:1. The binding
 * condition measured at the next step up (15%) was muted >= 4.5.
 *
 * Page-background washes use this percent. Raw fragrance colour is reserved
 * for bottle fills, swatches and large display type.
 *
 * Open decision for Batch 8: a stronger wash (up to 60%) using ink-only text
 * with no muted on the wash is possible for the scent story scroll. Not
 * built and not approved. Revisit in Batch 8 if the story needs it.
 */
export const CHOSEN_TINT_PERCENT = 10;

// Seed fragrance accents, in the order they appear in the brief.
// scripts/check-contrast.ts and src/lib/color.test.ts both read from this.
// Batch 2.5 will replace this array with src/data/seed-data.ts as the source.
export const SEED_FRAGRANCES = [
  { name: "Eko Nights", hex: "#B8691F" },
  { name: "Harmattan", hex: "#A8745A" },
  { name: "Lagoon", hex: "#3F8FA6" },
  { name: "Adire", hex: "#3B4A8F" },
  { name: "Palm Wine", hex: "#D9B15B" },
  { name: "Iroko", hex: "#6B6A3A" },
  { name: "Night Bloom", hex: "#8A4F7D" },
  { name: "First Rain", hex: "#7E9BA3" },
] as const;

export function parseColor(input: string): Rgba {
  const hex = input.trim();
  const hexMatch = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (hexMatch) {
    const value = hexMatch[1]!;
    return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16),
      a: 1,
    };
  }
  const rgbaMatch =
    /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/.exec(
      hex,
    );
  if (rgbaMatch) {
    return {
      r: Number(rgbaMatch[1]),
      g: Number(rgbaMatch[2]),
      b: Number(rgbaMatch[3]),
      a: rgbaMatch[4] !== undefined ? Number(rgbaMatch[4]) : 1,
    };
  }
  throw new Error(`Unsupported colour format: ${input}`);
}

export function composite(fg: Rgba, bg: Rgba): Rgba {
  if (fg.a >= 1) return fg;
  if (bg.a < 1) {
    throw new Error("Background must be opaque before compositing");
  }
  return {
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  };
}

function channelLuminance(channel: number): number {
  const s = channel / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(color: Rgba): number {
  return (
    0.2126 * channelLuminance(color.r) +
    0.7152 * channelLuminance(color.g) +
    0.0722 * channelLuminance(color.b)
  );
}

export function contrastRatio(fg: Rgba, bg: Rgba): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Mix a fragrance colour into bone in sRGB. percent = 0 returns bone,
 * percent = 100 returns the fragrance colour.
 */
export function tintWash(
  fragranceHex: string,
  boneHex: string,
  percent: number,
): string {
  const f = parseColor(fragranceHex);
  const b = parseColor(boneHex);
  const p = Math.max(0, Math.min(100, percent)) / 100;
  const r = Math.round(f.r * p + b.r * (1 - p));
  const g = Math.round(f.g * p + b.g * (1 - p));
  const bl = Math.round(f.b * p + b.b * (1 - p));
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(bl)}`.toUpperCase();
}

export type ReadableResult = {
  color: string;
  ratio: number;
  inkRatio: number;
  boneRatio: number;
  passesNormal: boolean;
  passesLarge: boolean;
};

export function readableOn(
  wash: string,
  ink: string,
  bone: string,
): ReadableResult {
  const washRgba = parseColor(wash);
  const inkRgba = parseColor(ink);
  const boneRgba = parseColor(bone);
  const inkRatio = contrastRatio(inkRgba, washRgba);
  const boneRatio = contrastRatio(boneRgba, washRgba);
  const useInk = inkRatio >= boneRatio;
  const ratio = useInk ? inkRatio : boneRatio;
  return {
    color: useInk ? "var(--color-ink)" : "var(--color-bg)",
    ratio,
    inkRatio,
    boneRatio,
    passesNormal: ratio >= 4.5,
    passesLarge: ratio >= 3.0,
  };
}