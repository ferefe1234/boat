# Quick start

1. Open [decimen.app](https://decimen.app/) on both devices.
2. On the sending device (a laptop is ideal): **Send**, pick a file. The QR stream starts immediately. Turn the screen brightness all the way up.
3. On the receiving device (a phone): **Receive**, tap **Start camera**, point it at the code. Fill the camera view with it and prop the phone against something.
4. When the bar completes, the file appears with a preview and a **Save** link — after its SHA-256 check passes.

To send text instead of a file, flip the sender to **Text snippet** and paste. The receiver is the same page either way.

Nothing decoding? See [Troubleshooting](troubleshooting.md).

## Running it yourself

```bash
npm install
npm run dev     # https dev server — accept the self-signed cert warning once
```

Open `https://localhost:5173/send/` on the sender and the printed `Network` URL (`https://<lan-ip>:5173/receive/`) on the phone. The dev server is https-only because browsers remove the camera API on insecure origins — see [Install & offline](install-and-offline.md) for the details and all the other ways to run it.
