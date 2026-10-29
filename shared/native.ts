export interface AndroidBridge {
  getPlan(): string;
  getProducts(): string;
  purchase(product: string): void;
  restore(): void;
  manageSubscriptions(): void;
  setTransferActive(active: boolean): void;
  beginSave(name: string, mime: string): string;
  appendSave(id: string, base64: string): boolean;
  finishSave(id: string): void;
  cancelSave(id: string): void;
}
export interface DesktopBridge { setTransferActive(active: boolean): void; }
declare global { interface Window { QRtransferAndroid?: AndroidBridge; QRtransferDesktop?: DesktopBridge; } }
export const android = window.QRtransferAndroid;
export const desktop = window.QRtransferDesktop;

/** Chunking keeps a 64 MB file from becoming one giant JavaScript/Java string. */
export async function saveNative(blob: Blob, name: string): Promise<boolean> {
  if (!android) return false;
  const id = android.beginSave(name, blob.type || 'application/octet-stream');
  if (!id) throw new Error('Another file is being saved. Finish or cancel it first.');
  try {
    for (let offset = 0; offset < blob.size; offset += 48 * 1024) {
      const bytes = new Uint8Array(await blob.slice(offset, offset + 48 * 1024).arrayBuffer());
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
      if (!android.appendSave(id, btoa(binary))) throw new Error('Unable to write file. Check available storage.');
    }
    android.finishSave(id);
    return true;
  } catch (error) { android.cancelSave(id); throw error; }
}
