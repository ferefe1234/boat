// The share dialog the home page and the sender both carry: a QR of the URL
// baked into the page's #share-url input, the link itself copyable, and the
// OS share sheet where one exists. The markup lives in each page's HTML (the
// URL is a build-time token, so every deploy shares itself); this module only
// wires behaviour to it.

import QRCode from "qrcode";
import { closeOnBackdropClick } from "./dialog";
import { msg } from "./i18n";

/** Wire the page's share dialog; returns the opener. */
export function wireShareDialog(): () => void {
  const dialog = document.getElementById("share-dialog") as HTMLDialogElement;
  const canvas = document.getElementById("share-qr") as HTMLCanvasElement;
  const urlInput = document.getElementById("share-url") as HTMLInputElement;
  const copyBtn = document.getElementById("share-copy") as HTMLButtonElement;
  const nativeBtn = document.getElementById("share-native") as HTMLButtonElement;
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

  // Drawn on first open — the URL is baked in at build time, so it never
  // changes after that.
  let qrDrawn = false;
  return () => {
    if (!qrDrawn) {
      qrDrawn = true;
      void QRCode.toCanvas(canvas, urlInput.value, { margin: 2, width: 220 });
    }
    nativeBtn.hidden = typeof navigator.share !== "function";
    dialog.showModal();
  };
}
