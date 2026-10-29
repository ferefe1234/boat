import { writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { collect, archive, packageSource } from './package-source';

const output = resolve('artifacts');
mkdirSync(output, { recursive: true });
for (const required of ['index.html', 'send/index.html', 'receive/index.html', 'sw.js', 'manifest.webmanifest', '_headers', 'qrtransfer-logo.jpg']) {
  if (!existsSync(join('dist', required))) throw new Error(`Missing web build file: ${required}`);
}
packageSource(join('dist', 'qrtransfer-source.zip'));
copyFileSync(join('dist', 'qrtransfer-source.zip'), join(output, 'QRtransfer-source.zip'));
writeFileSync(join(output, 'WEB-INSTALL.txt'), 'Unzip QRtransfer-web.zip and upload the extracted folder to Netlify Drop, or upload its CONTENTS to an HTTPS host. index.html must be at the site root. No server runtime is required.\n\nDo not open index.html using file://: the camera and workers need HTTPS (localhost also works).\n\nFree transfers are enabled. Billing and advertising accounts are not connected.\n');
archive(join(output, 'QRtransfer-web.zip'), collect(resolve('dist'), resolve('dist')));
console.log('Created artifacts/QRtransfer-web.zip and QRtransfer-source.zip.');
