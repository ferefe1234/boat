# QRtransfer

**Version 2.0.0:** saved access-code unlock (`88888888`), centered header navigation,
cleaner footers, timed ad placeholders, four bundled languages, and sharing links
to qrtransfer1.netlify.app. The v2 web package and Windows x64 installer are built.
Android and Mac configuration is updated; their v2 native builds are pending.
See [v2 delivery and sync instructions](docs/V2-RELEASE.md) and the
[v2 tech-stack report](docs/TECH-STACK-V2.md). Older status notes below describe v1.

Android, web and desktop adaptation of [Decimen Optical Transfer](https://github.com/bashalarmistalt/decimen-optical-transfer), retaining its QR sender, WASM scanner, fountain coding and integrity checks.

- Android 7.0+ package project; requires an updated WebView (119+).
- White interface with light-green highlights and no decorative animation.
- Visible camera picker and switch button; native file selection and saving.
- Plus: **CA$2.99/month**, ad-free 2/4-code sending, up to 60 fps.
- Pro: **CA$4.99/month**, ad-free sending up to 6 codes at 60 fps.
- Dismissible ad spaces between transfers. No live ad network is connected.

**Debug APK built successfully on 2026-10-30.** The user's local Gradle run
passed `:app:assembleDebug :app:lintDebug` (0 lint errors, 8 warnings).
The APK is at `android/app/build/outputs/apk/debug/app-debug.apk` (about 6.7 MB).
The logo image is now present. Physical-device transfer and purchase testing
remain outstanding; live advertising and Play products still need configuration.

The **web upload package is ready** at `artifacts/QRtransfer-web.zip`. Extract it
and upload the folder to Netlify Drop or an HTTPS static host. See
[web deployment](docs/WEB-DEPLOY.md); `npm run build:web` rebuilds it.

**Mac universal DMG and Windows x64 EXE build projects are prepared.** Installer
generation still needs downloaded Electron tools and, for DMG, a Mac. No DMG/EXE
has been generated in this restricted session. See
[desktop build instructions](docs/DESKTOP-RELEASE.md) or use the **Desktop installers**
GitHub Actions workflow, which runs Mac before Windows. Web/desktop billing is
not connected; the free tier is functional.

See [Android build and release instructions](docs/ANDROID-RELEASE.md) and
[validation results](VALIDATION.md). Original documentation is in
[README.upstream.md](README.upstream.md); license and notices are retained.
The optional 1 MB/2 MB demo samples can be restored with
`python build/restore-samples.py`; normal file transfers do not need them.

JAILBREAK CODE: '88888888'
