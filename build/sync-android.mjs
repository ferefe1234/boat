import { cpSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const assets = resolve(root, 'android/app/src/main/assets/web');
if (!existsSync('public/qrtransfer-logo.jpg')) throw new Error('Run python build/prepare-assets.py first to fetch the requested logo.');
if (!existsSync(resolve(root, 'dist-android/receive/index.html'))) throw new Error('Build Android web assets first.');
const rel = relative(root, assets);
if (rel.startsWith('..') || isAbsolute(rel) || assets !== resolve(root, 'android/app/src/main/assets/web')) throw new Error('Unsafe asset destination');
// Clear generated assets so removed language chunks don't remain in the APK.
if (existsSync(assets)) rmSync(assets, { recursive: true });
mkdirSync(assets, { recursive: true });
cpSync('dist-android', assets, { recursive: true });
cpSync('LICENSE', `${assets}/LICENSE.txt`);
cpSync('NOTICE', `${assets}/NOTICE.txt`);
// The two multi-megabyte upstream benchmark images are not needed in the APK.
// Keep the public 512 KB sample for compatibility with the web demo.
console.log(`Android web assets copied to ${assets}`);
