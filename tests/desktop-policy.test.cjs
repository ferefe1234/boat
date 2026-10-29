const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { isAppUrl, isExternalUrl, assetPath, cameraRequest, safeFilename,
  contentSecurityPolicy } = require('../desktop/app/policy.cjs');

test('desktop accepts only its exact bundled origin', () => {
  assert.equal(isAppUrl('qrtransfer://app/receive/?x=1'), true);
  for (const value of ['https://app/', 'qrtransfer://app.evil/', 'qrtransfer://user@app/',
    'qrtransfer://app:123/', 'file:///C:/Windows/win.ini', 'javascript:alert(1)', 'nonsense']) {
    assert.equal(isAppUrl(value), false, value);
  }
});
test('external navigation cannot open executable or local-file protocols', () => {
  assert.equal(isExternalUrl('https://github.com/bashalarmistalt/decimen-optical-transfer'), true);
  for (const value of ['file:///tmp/test', 'javascript:alert(1)', 'data:text/html,test',
    'http://example.com', 'https://name:password@example.com', 'ms-settings:camera']) assert.equal(isExternalUrl(value), false);
});
test('bundled routes resolve and encoded traversal cannot escape the package', () => {
  const root = path.resolve('desktop/app/web');
  assert.equal(assetPath(root, 'qrtransfer://app/'), path.join(root, 'index.html'));
  assert.equal(assetPath(root, 'qrtransfer://app/receive/?lang=fr'), path.join(root, 'receive/index.html'));
  assert.equal(assetPath(root, 'qrtransfer://app/assets/codec.wasm'), path.join(root, 'assets/codec.wasm'));
  for (const suffix of ['%2e%2e%2fmain.cjs', '%2e%2e%5cmain.cjs', 'C%3a/Windows/win.ini',
    'file.txt%3asecret', '%00bad', 'trailing%20/', '%ZZ', 'NUL.txt', 'COM1', '%3fsecret']) assert.equal(assetPath(root, `qrtransfer://app/${suffix}`), null, suffix);
  assert.equal(assetPath(root, 'https://app/index.html'), null);
});
test('camera requests exclude microphone and mixed media capture', () => {
  assert.equal(cameraRequest('media', { mediaTypes: ['video'] }), true);
  for (const types of [[], ['audio'], ['video', 'audio'], ['unknown'], undefined]) {
    assert.equal(cameraRequest('media', { mediaTypes: types }), false);
  }
  assert.equal(cameraRequest('display-capture', { mediaTypes: ['video'] }), false);
});
test('save suggestions cannot contain paths, streams, or reserved Windows names', () => {
  assert.equal(safeFilename('photo.png'), 'photo.png');
  for (const value of ['../../secret.txt', 'C:\\temp\\test.txt', 'file.txt:secret']) assert.doesNotMatch(safeFilename(value), /[\\/:]/);
  for (const value of ['CON', 'NUL.txt', 'COM1.exe', '...', '']) assert.equal(safeFilename(value), 'received-file');
});
test('CSP hashes the packaged guard and permits WASM without arbitrary inline scripts', () => {
  const csp = contentSecurityPolicy('<script>console.log("guard");</script><script src="/assets/main.js"></script>');
  assert.match(csp, /script-src 'self' 'wasm-unsafe-eval' 'sha256-[^']+'/);
  assert.doesNotMatch(csp.split(';').map(rule => rule.trim()).find(rule => rule.startsWith('script-src')), /'unsafe-inline'|'unsafe-eval'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.equal(contentSecurityPolicy('<script>\r\nconsole.log("guard");\r\n</script>'), contentSecurityPolicy('<script>\nconsole.log("guard");\n</script>'));
});
