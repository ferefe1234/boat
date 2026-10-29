# Golden vectors

Conformance data for the Decimen wire format. A non-TypeScript client — a
native iOS or Android receiver — is correct when it agrees with everything on
this page.

These vectors live in executable form in `tests/protocol.test.ts` and
`tests/transfer.test.ts`. **A diff to any byte here is a wire-format change and
gets reviewed as one** (see [versioning](versioning.md)).

## Canonical frame

Wire v3, 22-byte header, 6-byte block, all fields distinct so a swapped offset
cannot pass by accident:

| field | offset | value |
|---|---|---|
| magic0 | 0 | `0xD1` |
| magic1 | 1 | `0xC3` |
| version | 2 | `3` |
| flags | 3 | `0x00` |
| sessionId | 4 | `0xBEEF` |
| seq | 6 | `0x01020304` |
| k | 10 | `0x0111` |
| blockLen | 12 | `6` |
| totalLen | 14 | `0x00FEDCBA` |
| payloadFnv | 18 | `0x89ABCDEF` |
| block | 22 | `01 02 03 04 05 06` |

```
d1 c3 03 00 ef be 04 03 02 01 11 01 06 00 ba dc fe 00 ef cd ab 89 01 02 03 04 05 06
```

Every multi-byte field is **little-endian**. Total length is exactly
`HEADER_LEN + blockLen`; a frame whose length disagrees is `malformed`.

## Classification vectors

Only the first four bytes decide these, so they are shown alone. Each row is a
mutation of a well-formed frame. "speaks" means the receiver must show the
user a message; silent means it must not.

| case | bytes 0–3 | verdict | speaks |
|---|---|---|---|
| well-formed | `d1 c3 03 00` | `ok` | — |
| v1 sender | `d1 0c 03 00` | `older-sender` (v1) | yes |
| v2 sender | `d1 0d 03 00` | `older-sender` (v2) | yes |
| magic1 anything else | `d1 42 03 00` | `foreign` | silent |
| magic0 wrong | `d2 c3 03 00` | `foreign` | silent |
| newer version | `d1 c3 04 00` | `newer-sender` (v4) | yes |
| older version | `d1 c3 02 00` | `older-sender` (v2) | yes |
| version 0 | `d1 c3 00 00` | `malformed` | silent |
| unknown critical flag | `d1 c3 03 01` | `unsupported-flags` | yes |
| unknown ignorable flag | `d1 c3 03 10` | `ok` — parse it | silent |

Two properties a client must not "optimise" away:

1. **A lone `0xD1` never produces version advice.** Both magic bytes must match
   before any version is named. Gating on one byte gives ~1 binary QR payload
   in 256 a false "update your device", and that message latches on screen.
2. **Unknown ignorable flags (`0xF0`) decode normally** and ride through to the
   parsed header. Rejecting them makes the ignorable half of the byte a lie.

## Self-consistency

Beyond version and flags, a frame is `malformed` — and silent — when:

- total length ≠ `22 + blockLen`
- `k`, `blockLen`, or `totalLen` is zero (`k = 0` divides by zero downstream)
- fewer than 23 bytes (a header with no block)

## Stream identity

Frames belong to the same transfer when `sessionId`, `k`, `blockLen`,
`totalLen`, `payloadFnv`, and **the critical half of `flags`** all match. `seq`
is the one field that varies within a stream.

Ignorable flag bits (`0xF0`) are excluded: a mid-stream flip must not reset the
decoder and discard recovered blocks.

The identity must not be a naive concatenation — `{k: 1, blockLen: 23}` and
`{k: 12, blockLen: 3}` are different streams and must not collide.

## Round-trip conformance

`tests/transfer.test.ts` is the end-to-end harness, and the only test that
catches a header field read from the wrong offset — per-layer tests pass
happily when `packFrame` and `parseFrame` agree with each other but not with
the wire.

It drives 300 KB of incompressible data through container → fountain → framed
wire → back, over a deterministic ~15% frame loss, and asserts:

- every frame is exactly the frame budget (2953 bytes) in size
- the receiver learns everything from the frames alone — no handshake, no
  shared state with the encoder
- the recovered container matches `payloadFnv`
- SHA-256 verifies, and every byte of the original file survives
- overhead stays under 1.3× the source block count

A native decoder is correct when it recovers that file from those frames.
