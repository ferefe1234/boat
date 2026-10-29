import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { assetPath, APP_URL } = require('../desktop/app/policy.cjs');
const root = resolve('desktop/app/web');
for (const page of ['index.html', 'send/index.html', 'receive/index.html']) {
  const html = readFileSync(join(root, page), 'utf8');
  for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    if (/^(?:https?:|data:|blob:)/.test(match[1])) continue;
    const file = assetPath(root, new URL(match[1], new URL(page, APP_URL)).href);
    if (!file || !existsSync(file)) throw new Error(`Missing desktop asset in ${page}: ${match[1]}`);
  }
  if (/registerSW|serviceWorker\.register/.test(html)) throw new Error('Desktop must not register a service worker.');
}
const assets = readdirSync(join(root, 'assets'));
if (!assets.some(file => file.endsWith('.wasm')) || !assets.some(file => file.startsWith('worker-'))) throw new Error('Missing offline decoder');
for (const icon of ['icon.icns', 'icon.ico']) if (!existsSync(resolve('desktop/resources', icon))) throw new Error(`Missing ${icon}`);
console.log('Desktop pages, source archive, icons, worker and WASM assets verified.');
