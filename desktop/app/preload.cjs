'use strict';
const { contextBridge, ipcRenderer } = require('electron');

// Only the transfer state crosses the sandbox. No filesystem or arbitrary IPC access.
contextBridge.exposeInMainWorld('QRtransferDesktop', Object.freeze({
  setTransferActive(active) {
    if (typeof active === 'boolean') ipcRenderer.send('qrtransfer:transfer-active', active);
  },
}));
