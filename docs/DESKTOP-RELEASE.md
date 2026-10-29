# QRtransfer for Mac and Windows

The desktop app bundles the same sender, scanner worker, WASM codec and interface
as the web app. It works offline from its first launch. No local server, browser
installation or Android SDK is needed by the person installing it.

## Current status

The desktop web bundle, icons and packaging configuration are prepared. The
bundle passed TypeScript checks, asset checks and a Chromium smoke test with the
desktop content security policy. Native Electron startup and installer generation
have **not** run in this workspace: the session denies npm downloads with EACCES,
and a Mac is required to produce the DMG. No DMG or EXE is included yet.

## Build the Mac DMG first

On a Mac, install Node.js 24 or newer. Copy this whole project to it, or extract
`artifacts/QRtransfer-source.zip`. Open Terminal in that folder and run:

```sh
npm ci
npm run desktop:setup
npm run desktop:mac
```

The expected output is:

```text
artifacts/desktop/QRtransfer-1.0.0-mac-universal.dmg
```

The universal app supports Intel and Apple Silicon on macOS 13 or later.
Open the DMG and drag QRtransfer into Applications. The first scanner start
requests camera access. A denied permission can be changed in macOS System
Settings > Privacy & Security > Camera.

The checked-in `.icns` and `.ico` icons were generated from the supplied logo;
Python is not required for a normal desktop build. To regenerate them after
changing the logo, install Pillow and run `python build/prepare-desktop-icons.py`.

## Then build the Windows x64 installer

In PowerShell, from `C:\Users\liugu\Project1\QRBOAT`, run:

```powershell
npm.cmd run desktop:setup
npm.cmd run desktop:win
```

For a fresh checkout, run `npm.cmd ci` first. The expected output is:

```text
artifacts\desktop\QRtransfer-1.0.0-windows-x64-setup.exe
```

This is an installer for 64-bit Windows 10/11. It installs for the current user,
offers a destination folder, and creates Start menu/desktop shortcuts. It bundles
the runtime and does not need WebView or Node.js on the destination PC. Windows
camera privacy settings must permit desktop apps to use the camera.

To run the development app after setup, use `npm run desktop:start`.
Use `npm.cmd` instead of `npm` in PowerShell if script execution policy blocks npm.

## Build both using GitHub Actions

The workflow is `.github/workflows/desktop.yml`. Add the project files to a GitHub
repository, then open **Actions > Desktop installers > Run workflow**. Leave
**Build the Windows x64 installer after the Mac DMG** checked for both packages.
The Mac job runs first; the Windows job runs after it finishes, even if the Mac
job fails. The Windows option can be unchecked to conserve build minutes.

Download the `QRtransfer-mac-universal` and `QRtransfer-windows-x64` artifacts from
the run. Nothing is automatically published as a release. GitHub runner usage
has its own limits; this workflow does not use the coding assistant's chat quota.

Electron and electron-builder are pinned in `desktop/package.json`. The first
successful `desktop:setup` creates `desktop/package-lock.json`; commit that file
to also pin the transitive dependencies. The workflow uses it with `npm ci` when
present and includes the generated lockfile with each artifact otherwise.

## Signing for distribution

Without certificates, these commands produce test installers, not trusted,
signed public releases. Windows may show an unknown-publisher warning and macOS
may block a downloaded app that has not been notarized.

For a signed Mac build, configure a Developer ID Application certificate using
`CSC_LINK` and `CSC_KEY_PASSWORD`. Set `APPLE_ID`,
`APPLE_APP_SPECIFIC_PASSWORD`, and `APPLE_TEAM_ID` for notarization. The workflow
uses secrets named `MAC_CSC_LINK`, `MAC_CSC_KEY_PASSWORD` and those three Apple
names. The camera entitlement and description are already configured.

Windows signing uses `CSC_LINK` and `CSC_KEY_PASSWORD`, or the workflow secrets
`WIN_CSC_LINK` and `WIN_CSC_KEY_PASSWORD`. Keep private keys and passwords outside
the source tree. No signing credentials have been configured here.

## Behavior and release checks

- The native camera permission is limited to video. The app does not request a microphone.
- Received files and generated exports use the normal Save dialog; they are not automatically opened.
- QRtransfer keeps the screen awake while a transfer is active. Closing the window during a transfer asks before stopping it.
- The app exposes no Node.js or filesystem APIs to the pages. It uses a secure custom origin with a sandboxed renderer.
- The built-in sharing link uses the compatible upstream web receiver unless `VITE_SITE_URL` is set to your own public HTTPS site before building.
- Plus/Pro pricing and ad spaces remain in the interface. Desktop subscriptions and live advertising are not connected. Free sending and receiving work; unavailable purchases cannot be made.
- Help > Save QRtransfer source saves the matching source archive. License notices are included.

Before distributing an installer, test launch on each supported architecture,
camera allow/deny and switching, a physical screen-to-camera transfer in both
directions, saving/cancelling a received file, sleeping/waking, and reopening
offline. Actual optical speed and native installer behavior are not validated
by the browser smoke test.

Packaging references: [Electron security](https://www.electronjs.org/docs/latest/tutorial/security),
[custom protocols](https://www.electronjs.org/docs/latest/api/protocol),
[Mac packaging](https://www.electron.build/v26/docs/mac/),
[NSIS Windows installers](https://www.electron.build/v26/docs/nsis/), and
[Electron platform requirements](https://www.electronjs.org/docs/latest/breaking-changes).
