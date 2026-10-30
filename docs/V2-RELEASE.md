# QRtransfer 2.0.0

V2 adds an access-code field in Plans, removes the requested footer items and
translation notice, centers Send/Receive navigation, adds an ad placeholder,
ships four languages and points sharing to qrtransfer1.netlify.app.

Enter **88888888** in **Plans · remove ads → Unlock with a code**. It enables all
features on that installation. The code is reusable across installations and is
entered once on each. Clearing app/browser data resets it. Redeeming a code does
not cancel an existing Play subscription.

## Copy to the GitHub checkout

The editing session can write in QRBOAT but not Documents/GitHub/boat. Run:

```powershell
& 'C:\Users\liugu\Project1\QRBOAT\build\sync-checkout.ps1'
```

This copies the current source archive and available v2 packages to `boat`,
preserving `.git`, local SDK settings, installed dependencies and old installers.
It overwrites project source files with the QRBOAT version. Review the changes
in GitHub Desktop, commit them and **Push origin**.

Start a new **Desktop installers** run on `main` for the v2 Mac DMG. Download
`QRtransfer-mac-universal` from that run's Artifacts section. The file is named
`QRtransfer-2.0.0-mac-universal.dmg`.

The Windows installer is under `artifacts/desktop/`. Extract
`artifacts/QRtransfer-web.zip` and redeploy its contents to Netlify to update the
website. Source is available in `artifacts/QRtransfer-source.zip`.

For Android, run the **Android APK** workflow after the commit, or rebuild locally:

```powershell
npm.cmd run build:android
cd android
gradle :app:assembleDebug :app:lintDebug
```

The old debug APK is v1 until rebuilt. See [TECH-STACK-V2.md](TECH-STACK-V2.md)
for technical details, test results and limitations.
