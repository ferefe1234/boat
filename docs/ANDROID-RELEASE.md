# Android build and release

The Android project bundles the original Vite sender/receiver into a local HTTPS
WebView using WebViewAssetLoader. Transfers do not need a hosted site or network.
Minimum Android: 7.0 (API 24). Target/compile SDK: 36. The active WebView provider
must be 119 or newer; an unupdated Android 7 factory WebView cannot run the
upstream decoder and browser APIs. Update Chrome/System WebView first.

## Build a test APK

Install Node 24+, Java 17, Gradle 8.13, Android SDK platform 36/build-tools 36.0.0,
Python 3.12 and Pillow (`python -m pip install Pillow==12.3.0`). Point
`ANDROID_HOME` at your SDK, or put `sdk.dir=...` in `android/local.properties`.
For Windows, escape the drive-letter colon: `sdk.dir=C\:/Users/liugu/AppData/Local/Android/Sdk`.

From the repository root:

```sh
python build/prepare-assets.py
npm ci
npm test
npm run build:android
cd android
gradle :app:assembleDebug :app:lintDebug
```

On Windows, `powershell -File build/build-android.ps1` runs those steps.
Result: `android/app/build/outputs/apk/debug/app-debug.apk`.
The first build needs network access for dependencies and the specified logo.
The logo script keeps the exact original JPEG, generates square launcher crops,
and pads the adaptive icon. To work offline, place the requested JPEG at
`public/qrtransfer-logo.jpg` first. No substitute image is silently generated.

Alternatively, push this source to your own GitHub repository and run the
**Android APK** workflow. It produces a debug APK, lint report and source archive.
The workflow is provided locally; it has not been pushed or run in this session.

The package ID is `app.qrtransfer.android`. Choose your permanent ID before
creating its Play Console listing. Debug APKs are for testing. Create and retain
your own release signing key for distribution; no production key is included.
Use Android Studio's **Generate Signed Bundle / APK** after building web assets.

## Play subscriptions

| Product ID | Base plan | Canadian price | Entitlement |
| --- | --- | --- | --- |
| `qrtransfer_plus_monthly` | `monthly` (auto-renewing P1M) | CA$2.99/month | No ads; 1, 2 or 4 codes, up to 60 fps |
| `qrtransfer_pro_monthly` | `monthly` (auto-renewing P1M) | CA$4.99/month | No ads; 1, 2, 4 or 6 codes, up to 60 fps |

Free sending is one code at up to 30 fps. Receiving is unrestricted for protocol
compatibility. All frame rates are settings, not hardware throughput guarantees.
Prices must actually be configured in Play Console; setting text in the app does
not create products or set prices. Checkout uses Play's localized prices.

Set `PLAY_PUBLIC_KEY=<base64 licensing RSA key>` in your user Gradle properties,
or pass `-PPLAY_PUBLIC_KEY=...`. Without the key/products the app disables checkout
and clearly reports unavailability. Upload a signed build to a Play internal
testing track and use license testers. A sideloaded debug APK cannot validate a
production subscription integration.

The native integration checks signed Play purchase data, ignores pending and
suspended purchases, acknowledges purchases, restores through queryPurchases,
and replaces an existing plan during a change to avoid parallel subscriptions.
Entitlements are queried on foregrounding. They stay in memory for the current
Activity when a query fails; after a cold offline start the app defaults to Free
until Play can verify access. No localStorage unlock switch is shipped.
For stronger purchase/revocation enforcement, add a server using the Play
Developer API and real-time developer notifications before commercial launch.
Client signature verification alone is not a tamper-proof billing backend.

## Advertisement spaces

Only labeled, dismissible spaces are included, not a live ad network. Free users
see one after at least three qualifying transfers and five minutes since the
last display, for up to 20 seconds. A send qualifies after 15 seconds or a
receive completes. No space appears while a transfer is active. Paid plans hide
the space immediately. No ad identifiers, tracking SDK or consent collection is
bundled. Connect your chosen provider and its consent flow to this placement if
you want paid advertising.

## Device acceptance checks still required

- API 24 with WebView 119 and a current Android device: install and launch offline.
- Allow/deny camera permission; retry; switch front/rear lenses during reception.
- Background during acquisition and transfer; resume with Start camera.
- Send and receive empty files, text, binary files and near-limit files; compare
  original/downloaded SHA-256. Save with the document picker, including cancel.
- Confirm 1/2/4/6-code interoperability with upstream and no camera on send-only
  devices. Record actual capture/decode fps; no speed improvement is claimed yet.
- Play license tests: purchase, pending payment, cancellation, restore, renewal,
  expiry, suspended subscription and Plus/Pro changes; verify localized totals.
- Confirm ad spacing, no ads during transfer, and immediate removal for subscribers.

The user completed the debug APK build and Android lint on 2026-10-30 after
installing the build tools. Lint reports 0 errors and 8 warnings. The requested
logo file and generated launcher resources are present. Device behavior and
Play billing still require testing. See `VALIDATION.md` for the recorded results.

## Source and attribution

Upstream commit and import details are in `UPSTREAM.json`; original documentation
is retained in `README.upstream.md`. The codec, fountain coding, QR generation,
CRC/hash verification and wire protocol are retained. `LICENSE` and `NOTICE`
remain included, with copies packaged in the app. Distribute this modified
source and build scripts alongside the APK under the upstream AGPL terms. The
workflow includes a corresponding-source ZIP. The supplied logo's provenance is
recorded separately; it is not asserted to be covered by the upstream license.

References: [in-app WebView assets](https://developer.android.com/develop/ui/views/layout/webapps/load-local-content),
[Google Play Billing integration](https://developer.android.com/google/play/billing/integrate),
[Billing 8.3 release notes](https://developer.android.com/google/play/billing/release-notes).
