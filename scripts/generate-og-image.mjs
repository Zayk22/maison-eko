// Generate public/og-image.png at 1200x630.
// Placeholder until the real logo exists.
// Run: node scripts/generate-og-image.mjs

import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const OUT = path.resolve("public/og-image.png");

// The muted text colour is ink at 62% opacity composited over bone.
// We do not hardcode a hex; we compute it here so it stays in sync with
// the design tokens in globals.css if those ever change.
function composite(ink, bone, alpha) {
  const parse = (hex) => {
    const v = hex.replace("#", "");
    return [
      parseInt(v.slice(0, 2), 16),
      parseInt(v.slice(2, 4), 16),
      parseInt(v.slice(4, 6), 16),
    ];
  };
  const i = parse(ink);
  const b = parse(bone);
  const c = i.map((ch, idx) => Math.round(ch * alpha + b[idx] * (1 - alpha)));
  return `#${c.map((n) => n.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

const BONE = "#F4EFE8";
const INK = "#1B1410";
const MUTED = composite(INK, BONE, 0.62);
const ACCENT = "#B4532A";

async function main() {
  await fs.mkdir(path.dirname(OUT), { recursive: true });

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <rect width="1200" height="630" fill="${BONE}"/>
      <circle cx="1200" cy="630" r="180" fill="${ACCENT}" opacity="0.3"/>
      <text x="600" y="290" text-anchor="middle"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="96" font-weight="500" fill="${INK}">Maison Eko</text>
      <text x="600" y="360" text-anchor="middle"
        font-family="'Helvetica Neue', Arial, sans-serif"
        font-size="32" fill="${MUTED}">A demo perfume house in Lagos.</text>
      <text x="600" y="404" text-anchor="middle"
        font-family="'Helvetica Neue', Arial, sans-serif"
        font-size="22" fill="${MUTED}">No real orders are fulfilled.</text>
    </svg>
  `;

  await sharp(Buffer.from(svg)).png().toFile(OUT);

  const stat = await fs.stat(OUT);
  console.log(`Wrote ${OUT} (${Math.round(stat.size / 1024)} KB).`);
  console.log(`Muted colour used: ${MUTED}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});