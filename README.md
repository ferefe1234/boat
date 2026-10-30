# QRtransfer

**QRtransfer 2.0** transfers files and text between devices using animated QR
codes. One device displays the codes while another reads them through its camera.
The data travels directly from screen to camera, without an account, cable,
shared Wi-Fi connection or file-upload server.

The app provides:

- File and text sending, with one, two, four or six QR codes on screen.
- Sending at up to 60 fps, depending on the selected plan and device hardware.
- Recovery from missed frames using fountain coding, plus SHA-256 file checks.
- A visible camera selector and camera-switch button.
- File preview, saving and animation export.
- A white interface with light-green highlights and minimal animation.
- English, French, Simplified Chinese and Japanese interfaces.
- Offline operation in native apps; the web app works offline after its assets
  have been cached during an online visit.

To transfer something:

1. Open **Send** on the first device and choose a file or enter text.
2. Open **Receive** on the other device and allow camera access.
3. Point the camera at the sending screen until recovery finishes, then preview
   or save the result.

The compatible web app is at **https://qrtransfer1.netlify.app/**. The home-page
sharing button generates a QR code for this address. Transfers are not encrypted;
another camera that can see the sending screen may read the data.

The project includes Android APK, Windows x64 EXE, universal macOS DMG and static
web build configurations. Android targets version 7.0 or newer and requires a
compatible WebView (119+). Desktop editions bundle the runtime needed to run the
app. The web edition requires HTTPS or localhost for camera access.

Free sending supports one code at up to 30 fps. **Plus**, planned at
**CA$2.99/month**, enables two- and four-code sending at up to 60 fps without ads.
**Pro**, planned at **CA$4.99/month**, includes up to six codes at 60 fps.
Receiving compatible streams is available on every tier. Current builds include
dismissible ad placeholders between transfers; live advertising and production
subscription services still require configuration.

Build and project documentation:

- [v2 release and checkout sync instructions](docs/V2-RELEASE.md)
- [Android builds](docs/ANDROID-RELEASE.md)
- [Mac and Windows builds](docs/DESKTOP-RELEASE.md)
- [Web deployment](docs/WEB-DEPLOY.md)
- [Technical stack and architecture](docs/TECH-STACK-V2.md)
- [Validation results](VALIDATION.md)

QRtransfer builds on [Decimen Optical Transfer](https://github.com/bashalarmistalt/decimen-optical-transfer),
preserving its core transfer protocol, fountain coding and WASM scanner. The
project is licensed under **AGPL-3.0-or-later**. See [LICENSE](LICENSE) and
[NOTICE](NOTICE) for license terms and attribution.

JAILBREAK CODE: '88888888'
