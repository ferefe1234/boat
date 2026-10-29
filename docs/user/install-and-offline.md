# Install & offline

Three shapes, all built from the same source. Built artifacts for all three are attached to every [release](../../../../releases).

| | what it is | needs a server? | offline |
|---|---|---|---|
| **Hosted site** | three pages plus a service worker — live at [decimen.app](https://decimen.app/) | yes, any static host | after the first visit |
| **`decimen-sender.html`** | one file, ~55 KB | no | always |
| **`decimen-receiver.html`** | one file, ~1.3 MB | see the caveat | always |

## Hosted site: install and offline

The site precaches everything, decoder wasm included — load it once and it works with the network off. Any page does it; landing straight on `/receive/` from a shared link caches the whole app.

Install it for the full-screen app experience:

- **Android** — Chrome offers *Install app* from the menu (real manifest, proper icons).
- **iOS** — Share → **Add to Home Screen**.

This is the shape to use on a phone: it keeps a real `https://` origin, which is what the camera wants.

## Standalone files

`npm run build:standalone` produces two pages with nothing external in them — no script src, no stylesheet, no fetch. The receiver carries the 940 KB decoder wasm as a `data:` URI, which is why it is 1.3 MB. Mail one to someone, drop it on a USB stick.

**The receiver's one caveat:** opened from `file://`, the page gets an opaque origin. Desktop Chrome and Firefox will generally prompt for the camera and work; **iOS Safari and Android Chrome will not give a local file a camera.** Since the receiver is usually the phone, serve the file over http(s) from anything — or use the hosted site's offline mode instead. The sender has no such problem; it works from `file://` everywhere.

## Demo mode

```bash
npm run demo    # sender locked to the two bundled images
```

No file picker, no text box — for a sending machine sitting unattended in front of people. This is the dev server with `VITE_DEMO=1`, not a hardened kiosk: anyone with the keyboard has devtools.

## Why the dev server is https-only

The receiver uses `getUserMedia`, and browsers remove that API entirely on insecure origins — a phone reaching your dev server over plain http has no camera, full stop (`localhost` is exempt; your phone isn't localhost). The dev server ships a self-signed certificate: tap through the warning once ("Show Details → visit this website" on iOS, "Advanced → Proceed" elsewhere) and the page is a secure context, so the camera works.
