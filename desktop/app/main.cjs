'use strict';
const { app, BrowserWindow, Menu, dialog, ipcMain, nativeTheme, powerSaveBlocker,
  protocol, session, shell, systemPreferences } = require('electron');
const { readFile, copyFile } = require('node:fs/promises');
const path = require('node:path');
const { APP_URL, isAppUrl, isExternalUrl, assetPath, cameraRequest,
  safeFilename, contentSecurityPolicy } = require('./policy.cjs');

protocol.registerSchemesAsPrivileged([{ scheme: 'qrtransfer', privileges: {
  standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true,
} }]);
app.setName('QRtransfer');
let mainWindow;
let wakeLock;
let transferRunning = false;
let cameraAllowed = false;
let cameraPrompt;
const webRoot = path.join(__dirname, 'web');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.wasm': 'application/wasm',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.zip': 'application/zip', '.txt': 'text/plain; charset=utf-8' };

function setTransfer(active) {
  transferRunning = active;
  if (active && wakeLock === undefined) wakeLock = powerSaveBlocker.start('prevent-display-sleep');
  if (!active && wakeLock !== undefined) { powerSaveBlocker.stop(wakeLock); wakeLock = undefined; }
}
function trusted(contents) {
  return contents && contents === mainWindow?.webContents && !contents.isDestroyed() && isAppUrl(contents.getURL());
}
function openExternal(url) {
  if (isExternalUrl(url)) void shell.openExternal(url).catch(() => dialog.showErrorBox('Unable to open link', 'Open the link in your browser.'));
}
async function saveSource() {
  if (!mainWindow) return;
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Save QRtransfer source', defaultPath: 'QRtransfer-source.zip',
  });
  if (!result.canceled && result.filePath) await copyFile(path.join(webRoot, 'qrtransfer-source.zip'), result.filePath);
}
async function requestCamera() {
  if (cameraAllowed) return true;
  if (!cameraPrompt) cameraPrompt = (async () => {
    if (process.platform === 'darwin') return systemPreferences.askForMediaAccess('camera');
    const result = await dialog.showMessageBox(mainWindow, {
      type: 'question', title: 'Camera access',
      message: 'Allow QRtransfer to use your camera?',
      detail: 'The camera reads QR codes locally. Images are not uploaded.',
      buttons: ['Allow', 'Cancel'], defaultId: 0, cancelId: 1,
    });
    return result.response === 0;
  })().then(allowed => { cameraAllowed = allowed; return allowed; }).finally(() => { cameraPrompt = undefined; });
  return cameraPrompt;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'QRtransfer', width: 1100, height: 800, minWidth: 620, minHeight: 540,
    backgroundColor: '#ffffff', show: false,
    icon: path.join(webRoot, 'icon-512.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true,
      nodeIntegration: false, sandbox: true, webSecurity: true, webviewTag: false,
      // Chromium can throttle hidden pages; a transfer needs a visible screen anyway.
      backgroundThrottling: true,
    },
  });
  const contents = mainWindow.webContents;
  contents.setWindowOpenHandler(({ url }) => { openExternal(url); return { action: 'deny' }; });
  contents.on('will-navigate', (event, url) => {
    if (!isAppUrl(url)) { event.preventDefault(); openExternal(url); }
  });
  contents.on('will-attach-webview', event => event.preventDefault());
  contents.on('did-start-navigation', (_event, _url, inPlace, isMainFrame) => {
    if (isMainFrame && !inPlace) setTransfer(false);
  });
  contents.on('render-process-gone', () => setTransfer(false));
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('close', event => {
    if (transferRunning && dialog.showMessageBoxSync(mainWindow, {
      type: 'question', title: 'Transfer in progress', message: 'Stop the transfer and close QRtransfer?',
      buttons: ['Keep transferring', 'Stop and close'], defaultId: 0, cancelId: 0,
    }) === 0) event.preventDefault();
  });
  mainWindow.on('closed', () => { setTransfer(false); mainWindow = undefined; });
  void mainWindow.loadURL(APP_URL).catch(error => dialog.showErrorBox('Unable to open QRtransfer', error.message));
}

app.whenReady().then(() => {
  nativeTheme.themeSource = 'light';
  if (process.platform === 'win32') app.setAppUserModelId('app.qrtransfer.desktop');
  protocol.handle('qrtransfer', async request => {
    if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', { status: 405 });
    const file = assetPath(webRoot, request.url);
    if (!file) return new Response('Forbidden', { status: 403 });
    try {
      const bytes = await readFile(file);
      const extension = path.extname(file);
      return new Response(request.method === 'HEAD' ? null : bytes, { headers: {
        'Content-Type': mime[extension] || 'application/octet-stream',
        'Content-Security-Policy': contentSecurityPolicy(extension === '.html' ? bytes.toString('utf8') : ''),
        'X-Content-Type-Options': 'nosniff',
        'Permissions-Policy': 'camera=(self), microphone=(), geolocation=()',
      } });
    } catch { return new Response('Not found', { status: 404 }); }
  });
  const ses = session.defaultSession;
  ses.setPermissionCheckHandler((contents, permission, origin, details) => {
    if (!trusted(contents) || !isAppUrl(origin) || details.isMainFrame === false) return false;
    if (permission === 'media') return cameraAllowed && ['video', 'unknown'].includes(details.mediaType);
    return permission === 'clipboard-sanitized-write' || permission === 'fullscreen';
  });
  ses.setPermissionRequestHandler((contents, permission, callback, details) => {
    if (!trusted(contents) || !isAppUrl(details.requestingUrl) || details.isMainFrame === false) return callback(false);
    if (cameraRequest(permission, details)) {
      void requestCamera().then(allowed => callback(allowed && trusted(contents))).catch(() => callback(false));
    } else callback(permission === 'clipboard-sanitized-write' || permission === 'fullscreen');
  });
  ses.setDisplayMediaRequestHandler((_request, callback) => callback(null));
  ses.on('will-download', (event, item, contents) => {
    const url = item.getURL();
    if (!trusted(contents) || !isAppUrl(item.getInitiatorOrigin()) ||
      !(isAppUrl(url) || url.startsWith('blob:qrtransfer://app/'))) { event.preventDefault(); return; }
    item.setSaveDialogOptions({ title: 'Save from QRtransfer',
      defaultPath: path.join(app.getPath('downloads'), safeFilename(item.getFilename())) });
    item.once('done', (_event, state) => {
      if (state === 'interrupted') dialog.showErrorBox('File was not saved', 'Choose Save again and check the destination has enough space.');
    });
  });
  ipcMain.on('qrtransfer:transfer-active', (event, active) => {
    if (trusted(event.sender) && event.senderFrame === event.sender.mainFrame &&
      isAppUrl(event.senderFrame.url) && typeof active === 'boolean') setTransfer(active);
  });
  const menu = [
    ...(process.platform === 'darwin' ? [{ role: 'appMenu' }] : []),
    { role: 'fileMenu' }, { role: 'editMenu' },
    { label: 'View', submenu: [{ role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { type: 'separator' }, { role: 'togglefullscreen' }] },
    { role: 'windowMenu' },
    { label: 'Help', submenu: [
      { label: 'Save QRtransfer source', click: () => { void saveSource().catch(error => dialog.showErrorBox('Unable to save source', error.message)); } },
      { label: 'Upstream project', click: () => openExternal('https://github.com/bashalarmistalt/decimen-optical-transfer') },
    ] },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(menu));
  createWindow();
}).catch(error => { dialog.showErrorBox('QRtransfer could not start', error.message); app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('will-quit', () => setTransfer(false));
