# Protocol

## The one-way channel problem

A screen-to-camera link has no back-channel: the receiver can't ask for retransmission, and it will inevitably miss frames (blur, refresh straddling, autofocus). Looping the frames and hoping is miserable — miss one frame and you wait a full cycle for it to come around.

## Fountain coding

The sender never sends the file's blocks directly. Each frame is the XOR of a pseudorandom *subset* of blocks; the subset is derived deterministically from the frame's sequence number, with subset sizes drawn from a robust-soliton distribution ([Luby transform coding](https://en.wikipedia.org/wiki/Luby_transform_code)). The receiver collects **any** ~K·1.15 distinct frames, in any order, and peels the file out. Dropped frames cost a little time, never correctness; sender and receiver frame rates need not match.

Sender and receiver must build **bit-identical** soliton distributions, and JS engines disagree about `Math.log` (implementation-approximated). `fountain.ts` therefore includes a deterministic log built from exactly-specified IEEE-754 ops — V8 vs JavaScriptCore desync is a silent, total failure mode.

## Frames are self-describing

A 22-byte header carries a wire-format version, feature flags, session id, sequence number, block count/size, total length, and a payload hash. No handshake: the receiver locks onto a stream mid-flight, and restarting the sender (new session id) resets the receiver automatically. Stream identity covers *every* header field that must hold constant, not just the session id.

### Version and flags

```
0  u8   magic 0xD1   ┐ together: "this is a Decimen frame at all"
1  u8   magic 0xC3   ┘ fixed for every version from v3 on
2  u8   version      gates parsing wholesale — 3
3  u8   flags        0x0F must-understand · 0xF0 safe to ignore
4  u16  sessionId    6  u32 seq      10 u16 k        12 u16 blockLen
14 u32  totalLen     18 u32 payloadFnv
```

Two magic bytes answer "is this ours" *before* any version is named — a receiver that guesses wrong tells the user to update a device that has never run Decimen, and that message latches on screen. `version` then gates parsing wholesale, and a receiver that meets one it does not know **says so** rather than showing nothing. `flags` splits into a must-understand half and a safe-to-ignore half, so a later feature costs a bit rather than another break.

The rules, the reasoning, and the release compatibility table live in **[versioning](versioning.md)**; the bytes a second implementation is held to live in **[golden vectors](golden-vectors.md)**. Those two are the contract — this page is the overview.

## Container

Inside the fountain payload, a container preserves filename, media type, optional gzip (applied only when it shrinks the payload), and the SHA-256 of the original bytes. The receiver distinguishes files from text snippets by the container's media type, and verifies SHA-256 before offering anything.

## QR layer

Error correction stays at L: in-frame ECC and the fountain solve different problems (corruption vs erasure), and at these frame sizes "decode whole or discard" plus fountain redundancy is the better trade. The mask pattern is pinned (any declared mask is valid to a decoder), skipping the spec's 8-way mask evaluation for ~4× faster generation.

Golden wire-format vectors live in `tests/` — the encoder and decoder are held to fixed bytes, not just to each other.
