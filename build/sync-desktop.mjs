import { cpSync, mkdirSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = resolve(root, 'dist-desktop');
const destination = resolve(root, 'desktop/app/web');
if (!existsSync(resolve(source, 'receive/index.html'))) throw new Error('Run the desktop Vite build first.');
// Only clear the exact generated directory inside this checkout.
const rel = relative(root, destination);
if (rel.startsWith('..') || isAbsolute(rel) || destination !== resolve(root, 'desktop/app/web')) throw new Error('Unsafe destination');
if (existsSync(destination)) rmSync(destination, { recursive: true });
mkdirSync(destination, { recursive: true });
for (const item of readdirSync(source)) cpSync(resolve(source, item), resolve(destination, item), { recursive: true });
console.log('Bundled pages and decoder copied to desktop/app/web.');
