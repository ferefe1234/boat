import { cpSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
const assets = resolve('android/app/src/main/assets/web');
if (!existsSync('public/qrtransfer-logo.jpg')) throw new Error('Run python build/prepare-assets.py first to fetch the requested logo.');
mkdirSync(assets, { recursive: true });
cpSync('dist-android', assets, { recursive: true });
cpSync('LICENSE', `${assets}/LICENSE.txt`);
cpSync('NOTICE', `${assets}/NOTICE.txt`);
// The two multi-megabyte upstream benchmark images are not needed in the APK.
// Keep the public 512 KB sample for compatibility with the web demo.
console.log(`Android web assets copied to ${assets}`);
