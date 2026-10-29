# QRtransfer web deployment

The upload bundle is `artifacts/QRtransfer-web.zip`. Extract it and drag the
extracted folder into Netlify's manual deploy page (Netlify Drop). `index.html`
must be at the root of the folder you upload. Netlify serves it over HTTPS,
which is required for camera access. No server, database or API key is needed
for free file transfers. Do not open the HTML directly from the filesystem.

For another static host, upload the contents of the ZIP to the site's document
root and enable HTTPS. The main URLs are `/`, `/send/` and `/receive/`.
Preserve the assets, locale directories, WASM decoder, manifest and service worker.
Serve `.wasm` as `application/wasm` and `.js` as JavaScript. Netlify handles these
automatically. `_headers` contains Netlify's camera and cache settings.

## Rebuild or deploy from Git

Use Node 24 or later. The existing logo and icon files are included in the source.

```sh
npm ci
npm run build:web
```

The tracked `netlify.toml` selects `npm run build:web` and the `dist` publish
directory. Connect your own Git repository in Netlify to build there. For a
custom production domain, set `VITE_SITE_URL=https://your-domain.example/` in
Netlify before building. Otherwise Netlify's deployment URL supplies canonical
metadata. A local portable build omits unknown canonical URLs. The share dialog
always uses the URL of the site the visitor actually opened.

The bundle includes 12 languages, local QR processing, offline caching of app
assets and a downloadable corresponding-source archive (`qrtransfer-source.zip`).
Offline use requires visiting the relevant app once while online so its service
worker can install. Files move optically between devices, not through Netlify.

Free sending is one QR code at up to 30 fps; receiving compatible streams is
unrestricted. The existing CAD plan descriptions and between-transfer ad spaces
remain. Purchases on web are explicitly unavailable until a web payment service
and verified entitlement backend are configured. Android Play purchases do not
automatically unlock this separate web installation. No live ad network is
connected. No site was published to your account by these build scripts.
