# Validation status

Completed on this workspace:

- **Android debug build succeeded on 2026-10-30:** the user ran
  `gradle :app:assembleDebug :app:lintDebug` successfully. The resulting APK
  was confirmed at `android/app/build/outputs/apk/debug/app-debug.apk`
  (6,727,461 bytes), version 1.0.0, package `app.qrtransfer.android`, minimum
  SDK 24. The generated lint report records **0 errors and 8 warnings**.
  Back navigation uses AndroidX's dispatcher, the SDK property is escaped,
  and Kotlin runtime dependencies are aligned through the 1.8.22 BOM.
  Verification of this build result uses the user's terminal output and the
  resulting local artifacts; the agent's own Gradle runs remained restricted.
- **144 core tests passed** across 17 test files on 2026-10-30: fountain reconstruction, wire-format
  and file integrity checks, transfer round trips, QR raster layouts, worker pool,
  progress, localization, PNG/APNG/ZIP, snippets, format/display, no-signal hints,
  subscription boundaries, advertisement cadence, and animation export.
  Executed using `node --import ./build/register-typescript.mjs --test tests/*.test.ts`
  against the installed npm dependencies. The loader avoids the restricted
  account lookup used by tsx in this session.
- **6 desktop policy tests passed**: trusted origins, external links, path traversal,
  camera-only permissions, safe save names, and CSP including Windows line endings.
- **Web build passed**: browser and build-side TypeScript checks, Vite production
  build, PWA generation, all 36 localized pages and their local asset links.
  `artifacts/QRtransfer-web.zip` contains a ready-to-upload static site and a
  matching source download. `artifacts/QRtransfer-source.zip` contains the source.
- **Web Chromium smoke test passed**: plans, share URL, rendering an animated QR
  snippet, simulated-camera receiver and WASM startup, offline navigation and logo.
- **Desktop asset build passed**: TypeScript, Vite, bundled worker/WASM, three page
  routes, source archive and real ICNS/ICO files derived from the supplied logo.
- **Desktop renderer smoke test passed in Chromium** with the actual desktop CSP:
  sender, simulated-camera receiver/WASM, bridge notifications, source download
  and compatible receiver link. Electron native APIs and the custom scheme were
  not exercised by this HTTP-based renderer test.
- Git blob hashes confirm the imported protocol, fountain, QR raster, worker
  pool, QR generator, decode worker and vendored JS/WASM codec are byte-identical
  to upstream commit `5301fc2020716b5a97d4edf6e1793c3dedbf6e17`.

The initial 137-test result is superseded by the full 144-test result above.
No changes were made to the core encoder, decoder, protocol or fountain algorithms
for the web/desktop packaging. The existing Android APK predates the later shared
UI adjustments; it has not been rebuilt during this packaging task.

**No Mac DMG or Windows EXE has been built here.** Electron installation was
attempted using a workspace-local npm cache and failed with EACCES while fetching
`https://registry.npmjs.org/electron`. The session cannot download those tools.
DMG creation also needs macOS. The local commands and manual GitHub Actions
workflow are provided, but neither installer has passed native runtime, signing,
notarization, installation or physical-camera testing.

The web assets, logo JPEG and generated launcher resources are now present and
the APK build completed. Physical-device camera/transfer tests, performance
benchmarks, visual inspection on a device and Play subscription tests remain
outstanding. No measured scanning speed improvement is claimed.

The local network refused GitHub archive and image downloads. Source was
retrieved through the GitHub connector; two optional large demo images exceeded
that connector's size limit. Their restoration script uses the pinned commit.
