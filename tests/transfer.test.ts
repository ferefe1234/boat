// Cross-layer transfer test: container → fountain → framed wire → back.
//
// The per-layer tests each hold their own layer honest, and none of them would
// notice a header field read from the wrong offset — packFrame and parseFrame
// agreeing with each other is not the same as either agreeing with the wire.
// This drives a real file through all three layers over a lossy channel, which
// is the shape of the only bug a wire-format change can hide.
//
// It is also the conformance harness a non-TypeScript client is held to: a
// native decoder is correct when it recovers this file from these frames
// (docs/technical/golden-vectors.md).

import assert from "node:assert/strict";
import test from "node:test";
import { LTDecoder, LTEncoder } from "../shared/fountain.ts";
import { blockLength } from "../shared/frame-capacity.ts";
import {
  fnv1a,
  packFile,
  packFrame,
  parseFrame,
  splitmix32,
  unpackFile,
  verifyFile,
} from "../shared/protocol.ts";

const FRAME_BYTES = 2953;

/** Incompressible, so packFile cannot gzip the test down to a single block. */
function noise(length: number, seed: number): Uint8Array {
  const out = new Uint8Array(length);
  const rnd = splitmix32(seed);
  for (let i = 0; i < length; i++) out[i] = rnd() & 0xff;
  return out;
}

test("a real file survives container, fountain and wire over a lossy channel", async () => {
  const blockLen = blockLength(FRAME_BYTES);
  const source = noise(300_000, 0x5eed);
  const packed = await packFile("payload.bin", "application/octet-stream", source);
  const encoder = new LTEncoder(packed.container, blockLen, 0xbeef);
  const payloadFnv = fnv1a(packed.container);
  assert.ok(encoder.k > 100, "the payload must be genuinely multi-block to prove anything");

  // Deterministic ~15% loss: a failure here reproduces instead of flaking.
  const dropped = (seq: number) => ((seq * 2654435761) >>> 0) % 100 < 15;

  let decoder: LTDecoder | null = null;
  let fed = 0;
  for (let seq = 0; !decoder?.isComplete; seq++) {
    assert.ok(seq < 10_000, "the decoder never completed");
    const frame = packFrame(
      {
        sessionId: 0xbeef,
        seq,
        k: encoder.k,
        blockLen,
        totalLen: packed.container.length,
        payloadFnv,
        flags: 0,
      },
      encoder.encode(seq),
    );
    assert.equal(frame.length, FRAME_BYTES, "a frame must fill its budget exactly");
    if (dropped(seq)) continue;

    // The receiver learns everything from the frame itself — no handshake, and
    // in particular no shared state with the encoder above.
    const parsed = parseFrame(frame);
    assert.ok(parsed, `the sender emitted a frame its own receiver rejects (seq ${seq})`);
    decoder ??= new LTDecoder(
      parsed.header.k,
      parsed.header.blockLen,
      parsed.header.sessionId,
      parsed.header.totalLen,
    );
    decoder.addFrame(parsed.header.seq, parsed.block);
    fed++;
  }

  const container = decoder!.assemble();
  assert.ok(container, "a complete decoder must assemble");
  assert.equal(fnv1a(container), payloadFnv, "the header's payload hash must match");

  const file = await unpackFile(container);
  assert.ok(await verifyFile(file), "SHA-256 must verify");
  assert.equal(file.name, "payload.bin");
  assert.deepEqual(file.bytes, source, "every byte must survive the round trip");

  // Loss costs frames, not correctness — and the carousel keeps the bill small.
  assert.ok(fed / encoder.k < 1.3, `overhead ${(fed / encoder.k).toFixed(3)}× is too high`);
});
