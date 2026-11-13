// Compress images from public/products/ to WebP.
// Run: node scripts/compress-images.mjs

import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SOURCE_DIR = path.resolve("public/products");
const ORIGINALS_DIR = path.resolve("public/products/_originals");

const MAX_WIDTH = 1000;
const FIRST_QUALITY = 80;
const SECOND_QUALITY = 70;
const THIRD_MAX_WIDTH = 800;
const TARGET_BYTES = 150 * 1024;

const VALID_EXT = new Set([".jpg", ".jpeg", ".png"]);

function bytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

async function ensureDirs() {
  await fs.mkdir(SOURCE_DIR, { recursive: true });
  await fs.mkdir(ORIGINALS_DIR, { recursive: true });
}

async function listSources() {
  const entries = await fs.readdir(SOURCE_DIR, { withFileTypes: true });
  const sources = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (!VALID_EXT.has(ext)) continue;
    sources.push(entry.name);
  }
  return sources;
}

async function tryEncode(input, maxWidth, quality) {
  return sharp(input)
    .rotate()
    .resize({ width: maxWidth, withoutEnlargement: true, fit: "inside" })
    .webp({ quality })
    .toBuffer({ resolveWithObject: true });
}

async function processOne(fileName) {
  const srcPath = path.join(SOURCE_DIR, fileName);
  const base = path.parse(fileName).name;
  const webpPath = path.join(SOURCE_DIR, `${base}.webp`);
  const backupPath = path.join(ORIGINALS_DIR, fileName);

  const stat = await fs.stat(srcPath);
  const originalBytes = stat.size;

  let result = await tryEncode(srcPath, MAX_WIDTH, FIRST_QUALITY);
  if (result.data.length > TARGET_BYTES) {
    result = await tryEncode(srcPath, MAX_WIDTH, SECOND_QUALITY);
  }
  if (result.data.length > TARGET_BYTES) {
    result = await tryEncode(srcPath, THIRD_MAX_WIDTH, SECOND_QUALITY);
  }

  await fs.writeFile(webpPath, result.data);
  await fs.rename(srcPath, backupPath);

  return {
    file: fileName,
    originalBytes,
    outputBytes: result.data.length,
    width: result.info.width,
    height: result.info.height,
    overTarget: result.data.length > TARGET_BYTES,
  };
}

async function main() {
  await ensureDirs();
  const sources = await listSources();
  if (sources.length === 0) {
    console.log("No source images found.");
    process.exit(0);
  }

  const rows = [];
  let failures = 0;
  for (const name of sources) {
    try {
      const r = await processOne(name);
      rows.push(r);
    } catch (err) {
      failures += 1;
      console.error(`Failed: ${name}`);
      console.error(err);
    }
  }

  const pad = (s, n) => String(s).padEnd(n);
  console.log("");
  console.log(
    pad("File", 32) +
      pad("Original", 12) +
      pad("WebP", 12) +
      pad("Dimensions", 14) +
      "Status",
  );
  console.log("-".repeat(80));
  for (const r of rows) {
    console.log(
      pad(r.file, 32) +
        pad(bytes(r.originalBytes), 12) +
        pad(bytes(r.outputBytes), 12) +
        pad(`${r.width}x${r.height}`, 14) +
        (r.overTarget ? "OVER 150 KB" : "ok"),
    );
  }
  console.log("");
  console.log(`Processed ${rows.length} file(s), failures: ${failures}.`);
  if (failures > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});