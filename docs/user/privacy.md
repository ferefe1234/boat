# Privacy

**Nothing is transmitted anywhere except as light.** There is no account, no pairing, no analytics, and no network path between the devices — the site works with the network off after the first visit.

**The channel is not confidential.** Whatever is on the sending screen is readable by *any* camera pointed at it. The property Decimen gives you is *no network*, not encryption. Don't stream secrets in a room you don't trust.

**Integrity is checked.** Every received file is verified against its SHA-256 before being offered; a corrupted stream fails loudly rather than handing over damaged bytes.

## Auto-show

A transfer lands on a screen someone may be holding up in a room. **Show received files automatically** — in *Receive settings*, on by default — controls whether it puts itself there.

Turn it off and a landed file waits behind a **Show** button instead: images, video, audio, and text alike. Saving is unaffected either way, and so is the SHA-256 check. Nothing is hidden from you, only from the room.

Off also means **nothing is written to the media cache below** unless you tap Show, because the cache write is what the player needs, and a file you never opened never needed it.

This is the one preference Decimen stores between sessions (a single `localStorage` key). A privacy choice that forgets itself on reload is no choice at all — the point is that the *next* thing to arrive stays covered.

## What persists on the receiving device

- **Text snippets: nothing.** Shown with a Copy button, gone when the tab closes.
- **Files you save** go wherever your browser puts downloads.
- **Received media** (video/audio, so the in-page player can seek) is staged in the browser's Cache API and would otherwise linger until the next transfer overwrites it. The **Clear Decimen cache** button next to *Receive another file* deletes it on the spot — use it before handing the phone to someone. It only appears when something is actually cached, so an empty offer never implies Decimen kept a file it didn't.
- **The auto-show preference**, as above — a single on/off flag, no transfer content.
- The service worker's offline cache holds the **app itself**, never transferred content.
