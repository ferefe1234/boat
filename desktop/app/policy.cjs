'use strict';
const path = require('node:path');
const { createHash } = require('node:crypto');
const APP_URL = 'qrtransfer://app/';

function isAppUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'qrtransfer:' && url.hostname === 'app' &&
      !url.port && !url.username && !url.password;
  } catch { return false; }
}

function isExternalUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch { return false; }
}

/** Map only ordinary bundled paths. Never expose arbitrary files or Windows streams. */
function assetPath(root, value) {
  if (!isAppUrl(value)) return null;
  let pathname;
  try { pathname = decodeURIComponent(new URL(value).pathname); } catch { return null; }
  if (/[\\:<>"|?*\x00-\x1f]/.test(pathname)) return null;
  const segments = pathname.split('/').filter(Boolean);
  if (segments.some(part => part === '.' || part === '..' || /[. ]$/.test(part) || /^(con|prn|aux|nul|com\d|lpt\d)(\.|$)/i.test(part))) return null;
  if (pathname.endsWith('/') || !segments.length) segments.push('index.html');
  const file = path.resolve(root, ...segments);
  const rel = path.relative(path.resolve(root), file);
  if (rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return file;
}

function cameraRequest(permission, details = {}) {
  return permission === 'media' && Array.isArray(details.mediaTypes) &&
    details.mediaTypes.length > 0 && details.mediaTypes.every(type => type === 'video');
}

function safeFilename(value) {
  const name = String(value).replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/[. ]+$/g, '').slice(0, 180);
  return !name || /^(con|prn|aux|nul|com\d|lpt\d)(\.|$)/i.test(name) ? 'received-file' : name;
}

function contentSecurityPolicy(html = '') {
  const hashes = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(match => !/\bsrc\s*=/i.test(match[1]))
    // HTML parsing normalizes CRLF/CR before CSP hashes script text.
    .map(match => `'sha256-${createHash('sha256').update(match[2].replace(/\r\n?/g, '\n')).digest('base64')}'`);
  return [
    "default-src 'self'", `script-src 'self' 'wasm-unsafe-eval' ${hashes.join(' ')}`,
    "worker-src 'self' blob:", "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:", "media-src 'self' blob:",
    "connect-src 'self' blob:", "object-src 'none'", "base-uri 'self'",
    "frame-src 'none'", "frame-ancestors 'none'", "form-action 'none'",
  ].join('; ');
}

module.exports = { APP_URL, isAppUrl, isExternalUrl, assetPath, cameraRequest, safeFilename, contentSecurityPolicy };
