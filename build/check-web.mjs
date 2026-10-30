import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
const root = resolve('dist');
let pages = 0;
function check(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) { check(path); continue; }
    if (!path.endsWith('.html')) continue;
    pages++;
    const html = readFileSync(path, 'utf8');
    assert(!/<(?:meta|link)\b[^>]*qrtransfer\.invalid/.test(html), `Placeholder metadata in ${path}`);
    for (const [, raw] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      if (/^(?:[a-z]+:|#|\/\/)/i.test(raw)) continue;
      const clean = decodeURIComponent(raw.split(/[?#]/)[0]);
      if (!clean) continue;
      const target = resolve(raw.startsWith('/') ? root : dirname(path), clean.replace(/^\//, ''));
      assert(target.startsWith(root), `Path leaves site: ${raw}`);
      assert(existsSync(target), `Missing ${raw} referenced by ${path}`);
    }
  }
}
check(root);
const sw = readFileSync(join(root, 'sw.js'), 'utf8');
for (const asset of ['qrtransfer-logo.jpg', 'receive/index.html', 'send/index.html']) assert(sw.includes(asset), `Offline cache missing ${asset}`);
assert(sw.includes('.wasm'), 'Decoder is missing from offline cache');
assert(pages === 12, 'Expected exactly four languages with three pages each');
console.log(`Verified ${pages} web pages, local asset links, and offline precache.`);
