// Regenerates the PWA icon set in public/ from public/decimen_logo.svg:
//
//   npm run icons        (needs rsvg-convert on PATH — librsvg)
//
// Three variants come out of the one logo:
//  - icon-192 / icon-512: the logo tile as-is (rounded corners, purpose "any")
//  - icon-maskable-512: full-bleed square with the mark at 0.62, inside the
//    safe zone no launcher mask (circle, squircle, …) will clip
//  - apple-touch-icon (180): full-bleed square at 0.82 — iOS rounds the
//    corners itself, and transparent corners would come back black
//
// The logo's header comment says "--bg", and a double hyphen inside a comment
// is invalid XML: browsers shrug, librsvg refuses the whole file. Comments are
// stripped before rasterizing. The square variants are exact-match string
// surgery on the logo markup that throws when it misses — same contract as the
// build plugins, so a reshaped logo breaks this script rather than shipping a
// half-transformed icon.

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const publicDir = fileURLToPath(new URL("../public", import.meta.url));
const logo = readFileSync(join(publicDir, "decimen_logo.svg"), "utf8");
const cleaned = logo.replace(/<!--[\s\S]*?-->/g, "");

const ROUNDED_RECT = '<rect width="640" height="640" rx="112" fill="#070a11"/>';
const MARK_OPEN = '<g fill="#58c8ff" transform="translate(48.5,43)">';

function squareVariant(markScale: number): string {
  for (const needle of [ROUNDED_RECT, MARK_OPEN]) {
    if (!cleaned.includes(needle)) {
      throw new Error(`decimen_logo.svg changed shape — expected to find: ${needle}`);
    }
  }
  return cleaned
    .replace(ROUNDED_RECT, '<rect width="640" height="640" fill="#070a11"/>')
    .replace(
      MARK_OPEN,
      `<g transform="translate(320,320) scale(${markScale}) translate(-320,-320)">${MARK_OPEN}`,
    )
    .replace("</svg>", "</g></svg>");
}

try {
  execFileSync("rsvg-convert", ["--version"], { stdio: "ignore" });
} catch {
  throw new Error("rsvg-convert not found — install librsvg");
}

const work = mkdtempSync(join(tmpdir(), "decimen-icons-"));

function render(svg: string, size: number, out: string) {
  const src = join(work, `${out}.svg`);
  writeFileSync(src, svg);
  execFileSync("rsvg-convert", ["-w", String(size), "-h", String(size), src, "-o", join(publicDir, out)]);
  console.log(`public/${out} ${size}×${size}`);
}

try {
  render(cleaned, 192, "icon-192.png");
  render(cleaned, 512, "icon-512.png");
  render(squareVariant(0.62), 512, "icon-maskable-512.png");
  render(squareVariant(0.82), 180, "apple-touch-icon.png");
} finally {
  rmSync(work, { recursive: true, force: true });
}
