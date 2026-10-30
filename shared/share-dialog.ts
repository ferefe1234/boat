// Home and sender share the public web URL, its QR, and the app download link.

import QRCode from "qrcode";
import { closeOnBackdropClick } from "./dialog";
import { msg } from "./i18n";

const APP_DOWNLOAD_LABELS: Record<string, string> = {
  en: 'Download apps on GitHub',
  fr: 'Télécharger les applications sur GitHub',
  'zh-hans': '在 GitHub 下载应用',
  ja: 'GitHub からアプリをダウンロード',
};

/** Wire the page's share dialog; returns the opener. */
export function wireShareDialog(): () => void {
  const dialog = document.getElementById("share-dialog") as HTMLDialogElement;
  const canvas = document.getElementById("share-qr") as HTMLCanvasElement;
  const urlInput = document.getElementById("share-url") as HTMLInputElement;
  const copyBtn = document.getElementById("share-copy") as HTMLButtonElement;
  const nativeBtn = document.getElementById("share-native") as HTMLButtonElement;
  // Injected by the hosted-web build only; native and standalone pages omit it.
  const appsLink = document.getElementById("share-apps") as HTMLAnchorElement | null;
  // One public destination for browser, Android and desktop shares.
  urlInput.value = document.body.classList.contains('home-page')
    ? 'https://qrtransfer1.netlify.app/' : 'https://qrtransfer1.netlify.app/receive/';

  document.getElementById("share-close")!.addEventListener("click", () => dialog.close());
  closeOnBackdropClick(dialog);

  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(urlInput.value);
      copyBtn.textContent = msg.common.copied;
    } catch {
      // Leave the text selected so a manual copy is one keystroke away.
      urlInput.select();
      copyBtn.textContent = msg.common.copyFailed;
    }
    setTimeout(() => {
      copyBtn.textContent = msg.common.copy;
    }, 1500);
  });

  nativeBtn.addEventListener("click", () => {
    void navigator
      .share({ title: dialog.dataset.shareTitle ?? document.title, url: urlInput.value })
      .catch(() => undefined); // cancelling the sheet is not an error
  });

  // The public URL stays the same while the dialog is open.
  let qrDrawn = false;
  return () => {
    if (!qrDrawn) {
      qrDrawn = true;
      void QRCode.toCanvas(canvas, urlInput.value, { margin: 2, width: 220 });
    }
    nativeBtn.hidden = typeof navigator.share !== "function";
    if (appsLink) appsLink.textContent = APP_DOWNLOAD_LABELS[msg.meta.code] ?? APP_DOWNLOAD_LABELS.en!;
    dialog.showModal();
  };
}
