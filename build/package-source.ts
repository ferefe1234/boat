import { readdirSync, readFileSync, mkdirSync, openSync, writeSync, closeSync } from 'node:fs';
import { join, resolve, relative, sep, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { zipStore, type ZipEntry } from '../shared/zip';

const skip = new Set(['node_modules', '.git', '.gradle', '.tools', '.import', 'dist', 'dist-desktop', 'dist-android', 'dist-standalone', 'artifacts']);
const sourceDirs = new Set(['.github', 'android', 'benchmarks', 'build', 'desktop', 'docs', 'home', 'public', 'receive', 'send', 'shared', 'tests', 'vendor']);
export function collect(dir: string, base: string, source = false): ZipEntry[] {
  const entries: ZipEntry[] = [];
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    if (item.isSymbolicLink()) continue;
    if (source && dir === base && (item.isDirectory() ? !sourceDirs.has(item.name) :
      !(/\.(?:json|ts|mjs|cjs|md|html|toml)$/.test(item.name) || ['LICENSE', 'NOTICE', '.gitignore', '.nvmrc'].includes(item.name)))) continue;
    const path = join(dir, item.name);
    const name = relative(base, path).split(sep).join('/');
    if (source && (skip.has(item.name) || name === 'android/app/src/main/assets' ||
      (name.startsWith('android/') && item.name === 'build') || name === 'desktop/app/web' ||
      name === 'desktop/release' || /(?:\.jks|\.keystore|\.p8|\.p12|\.pfx|\.pem|\.log|\.pyc)$/.test(name) ||
      item.name === 'local.properties' || item.name === '__pycache__' || item.name.startsWith('.env'))) continue;
    if (item.isDirectory()) entries.push(...collect(path, base, source));
    else if (item.isFile()) entries.push({ name, data: readFileSync(path) });
  }
  return entries.sort((a, b) => a.name.localeCompare(b.name));
}
export function archive(path: string, entries: ZipEntry[]) {
  mkdirSync(dirname(path), { recursive: true });
  const file = openSync(path, 'w');
  try { for (const part of zipStore(entries, new Date('2026-10-30T00:00:00Z'))) writeSync(file, part); }
  finally { closeSync(file); }
}
export function packageSource(destination: string) {
  const root = resolve('.');
  archive(destination, collect(root, root, true));
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const destination = process.argv[2] || 'artifacts/QRtransfer-source.zip';
  packageSource(destination);
  console.log(`Created source archive: ${destination}`);
}
