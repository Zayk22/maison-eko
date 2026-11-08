import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  INK,
  BONE,
  SEED_FRAGRANCES,
  parseColor,
  composite,
  contrastRatio,
  tintWash,
  type Rgba,
} from "../src/lib/color";

type TokenMap = Record<string, string>;

function readThemeTokens(): TokenMap {
  const cssPath = resolve(process.cwd(), "src/app/globals.css");
  const css = readFileSync(cssPath, "utf8");
  const themeMatch = /@theme\s*\{([\s\S]*?)\}/.exec(css);
  if (!themeMatch) {
    throw new Error("Could not find @theme block in src/app/globals.css");
  }
  const body = themeMatch[1]!;
  const tokens: TokenMap = {};
  const lineRe = /--([a-zA-Z0-9-]+)\s*:\s*([^;]+);/g;
  let match: RegExpExecArray | null;
  while ((match = lineRe.exec(body)) !== null) {
    tokens[match[1]!] = match[2]!.trim();
  }
  return tokens;
}

function resolveToken(tokens: TokenMap, name: string): Rgba {
  const key = name.replace(/^--/, "");
  const raw = tokens[key];
  if (!raw) {
    throw new Error(`Token not found in @theme: --${key}`);
  }
  if (raw.startsWith("var(")) {
    const inner = raw.slice(4, -1).trim();
    return resolveToken(tokens, inner);
  }
  return parseColor(raw);
}

type Pair = { label: string; fg: string; bg: string; threshold: number };

function assertNoDrift(tokens: TokenMap): void {
  const cssInk = tokens["color-ink"]?.toLowerCase();
  const cssBone = tokens["color-bg"]?.toLowerCase();
  if (cssInk !== INK.toLowerCase()) {
    console.error(
      `Drift: src/lib/color.ts INK = ${INK}, @theme --color-ink = ${tokens["color-ink"] ?? "MISSING"}`,
    );
    process.exit(1);
  }
  if (cssBone !== BONE.toLowerCase()) {
    console.error(
      `Drift: src/lib/color.ts BONE = ${BONE}, @theme --color-bg = ${tokens["color-bg"] ?? "MISSING"}`,
    );
    process.exit(1);
  }
}

function main(): void {
  const tokens = readThemeTokens();
  assertNoDrift(tokens);

  const pairs: Pair[] = [
    { label: "ink on bg", fg: "--color-ink", bg: "--color-bg", threshold: 4.5 },
    { label: "ink on surface", fg: "--color-ink", bg: "--color-surface", threshold: 4.5 },
    { label: "ink on raised", fg: "--color-ink", bg: "--color-raised", threshold: 4.5 },
    { label: "muted on bg", fg: "--color-muted", bg: "--color-bg", threshold: 4.5 },
    { label: "muted on surface", fg: "--color-muted", bg: "--color-surface", threshold: 4.5 },
    { label: "muted on raised", fg: "--color-muted", bg: "--color-raised", threshold: 4.5 },
    { label: "accent (underline/icon/ring) on bg", fg: "--color-accent", bg: "--color-bg", threshold: 3.0 },
    { label: "accent (underline/icon/ring) on surface", fg: "--color-accent", bg: "--color-surface", threshold: 3.0 },
    { label: "accent (underline/icon/ring) on raised", fg: "--color-accent", bg: "--color-raised", threshold: 3.0 },
    { label: "bg on ink (primary button)", fg: "--color-bg", bg: "--color-ink", threshold: 4.5 },
    { label: "danger on bg", fg: "--color-danger", bg: "--color-bg", threshold: 4.5 },
    { label: "danger on surface", fg: "--color-danger", bg: "--color-surface", threshold: 4.5 },
    { label: "danger on raised", fg: "--color-danger", bg: "--color-raised", threshold: 4.5 },
    { label: "success on bg", fg: "--color-success", bg: "--color-bg", threshold: 4.5 },
    { label: "success on surface", fg: "--color-success", bg: "--color-surface", threshold: 4.5 },
    { label: "success on raised", fg: "--color-success", bg: "--color-raised", threshold: 4.5 },
    { label: "focus ring (accent) on bg", fg: "--color-accent", bg: "--color-bg", threshold: 3.0 },
  ];

  let failures = 0;

  console.log("Maison Eko contrast check");
  console.log("Source: src/app/globals.css @theme block");
  console.log("Formula: WCAG 2.1 relative luminance, (L1 + 0.05) / (L2 + 0.05)");
  console.log("");
  console.log(pad("Pair", 44) + pad("Ratio", 8) + pad("Req", 6) + "Result");
  console.log("-".repeat(74));

  for (const pair of pairs) {
    const fgRaw = resolveToken(tokens, pair.fg);
    const bgRaw = resolveToken(tokens, pair.bg);
    const fg = composite(fgRaw, bgRaw);
    const ratio = contrastRatio(fg, bgRaw);
    const passed = ratio >= pair.threshold;
    if (!passed) failures += 1;
    console.log(
      pad(pair.label, 44) +
        pad(ratio.toFixed(2), 8) +
        pad(`${pair.threshold.toFixed(1)}`, 6) +
        (passed ? "PASS" : "FAIL"),
    );
  }

  console.log("");
  console.log("Note: accent is never used for text.");
  console.log("Informational (borders, 3:1 target, does not affect exit code):");
  console.log(
    pad("border on bg", 34) +
      pad(
        contrastRatio(
          composite(
            resolveToken(tokens, "--color-border"),
            resolveToken(tokens, "--color-bg"),
          ),
          resolveToken(tokens, "--color-bg"),
        ).toFixed(2),
        8,
      ) +
      "3.0",
  );

  const mutedRaw = resolveToken(tokens, "--color-muted");

  // Largest multiple of 5 at which, for all eight fragrances, ink on the
  // tinted wash is >= 5.0 AND composited muted is >= 4.5.
  let chosenPercent: number | null = null;
  for (let p = 100; p >= 5; p -= 5) {
    let allInkPass = true;
    let allMutedPass = true;
    for (const f of SEED_FRAGRANCES) {
      const washRgba = parseColor(tintWash(f.hex, BONE, p));
      if (contrastRatio(parseColor(INK), washRgba) < 5.0) allInkPass = false;
      if (contrastRatio(composite(mutedRaw, washRgba), washRgba) < 4.5) {
        allMutedPass = false;
      }
    }
    if (allInkPass && allMutedPass) {
      chosenPercent = p;
      break;
    }
  }

  const basePercents = [100, 80, 60, 40, 20];
  const extra =
    chosenPercent !== null && !basePercents.includes(chosenPercent)
      ? [chosenPercent]
      : [];
  const uniquePercents = [...basePercents, ...extra].sort((a, b) => b - a);

  console.log("");
  console.log("Tinted wash table (ink and muted on tinted background)");
  console.log(
    pad("Fragrance", 14) +
      pad("Pct", 6) +
      pad("Wash", 10) +
      pad("Ink", 8) +
      pad("Muted", 8) +
      pad("Ink>=5.0", 10) +
      "Muted>=4.5",
  );
  console.log("-".repeat(74));

  for (const f of SEED_FRAGRANCES) {
    for (const p of uniquePercents) {
      const wash = tintWash(f.hex, BONE, p);
      const washRgba = parseColor(wash);
      const inkRatio = contrastRatio(parseColor(INK), washRgba);
      const mutedRatio = contrastRatio(composite(mutedRaw, washRgba), washRgba);
      console.log(
        pad(f.name, 14) +
          pad(String(p), 6) +
          pad(wash, 10) +
          pad(inkRatio.toFixed(2), 8) +
          pad(mutedRatio.toFixed(2), 8) +
          pad(inkRatio >= 5.0 ? "PASS" : "FAIL", 10) +
          (mutedRatio >= 4.5 ? "PASS" : "FAIL"),
      );
    }
  }

  console.log("");
  if (chosenPercent === null) {
    console.log(
      "Chosen percent: none. No multiple of 5 above 0 satisfies both conditions for all eight fragrances.",
    );
    console.log("Ink condition is ink >= 5.0, muted condition is muted >= 4.5.");
  } else if (chosenPercent === 100) {
    console.log(
      `Chosen percent: ${chosenPercent}%. Binding condition at next step up: neither, 100% already passes both.`,
    );
  } else {
    const next = chosenPercent + 5;
    let inkFailsAtNext = false;
    let mutedFailsAtNext = false;
    for (const f of SEED_FRAGRANCES) {
      const washRgba = parseColor(tintWash(f.hex, BONE, next));
      if (contrastRatio(parseColor(INK), washRgba) < 5.0) inkFailsAtNext = true;
      if (contrastRatio(composite(mutedRaw, washRgba), washRgba) < 4.5) {
        mutedFailsAtNext = true;
      }
    }
    let binding: string;
    if (inkFailsAtNext && mutedFailsAtNext) binding = "both";
    else if (inkFailsAtNext) binding = "ink >= 5.0";
    else if (mutedFailsAtNext) binding = "muted >= 4.5";
    else binding = "neither (unexpected)";
    console.log(
      `Chosen percent: ${chosenPercent}%. Binding condition at ${next}%: ${binding}.`,
    );
  }

  if (failures > 0) {
    console.error(`\n${failures} pair(s) failed.`);
    process.exit(1);
  }
}

function pad(s: string, n: number): string {
  return s.length >= n ? s : s + " ".repeat(n - s.length);
}

main();