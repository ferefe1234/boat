// The sender's transmit tuning, in one place. The dropdowns in send/index.html
// are rendered from these lists via the %TX_FPS_OPTIONS% / %FRAME_BYTES_OPTIONS%
// tokens (see htmlTokens() in vite.config.ts), and the receiver's no-signal
// hint names its fallback values from here too — so the advice can never point
// at a setting the sender doesn't offer.

/** What the no-signal hint tells the user to turn the sender down to. */
export const NO_SIGNAL_HINT_FRAME_BYTES = 1465;
export const NO_SIGNAL_HINT_TX_FPS = 24;

// Default 60: full rate for high-refresh senders and the benchmark rig.
// The 60 Hz-display caveat is real and stays documented: a frame needs ≥2
// refresh cycles on screen or captures catch the transition, and on a 60 Hz
// display every 60 fps frame gets exactly one — early field runs there
// measured 0.2–0.4 catch rates. The no-signal hint still walks struggling
// pairs down to 24, and 30/55 remain in the list.
export const DEFAULT_TX_FPS = 60;
export const DEFAULT_FRAME_BYTES = 2953;

// The hint values appear in these lists by construction, not by coincidence.
// 55 sits just under the 60 Hz ceiling: on 120 Hz displays it gets a clean
// ≥2 refresh cycles per frame, and on 60 Hz screens the deliberate 5 fps slip
// against the refresh clock means frame boundaries drift through the scanout
// instead of riding it, so the same frames don't get torn twice in a row.
export const TX_FPS_OPTIONS: readonly number[] = [
  10,
  15,
  20,
  NO_SIGNAL_HINT_TX_FPS,
  30,
  55,
  DEFAULT_TX_FPS,
];
export const FRAME_BYTES_OPTIONS: readonly number[] = [
  500,
  1000,
  NO_SIGNAL_HINT_FRAME_BYTES,
  1850,
  2331,
  DEFAULT_FRAME_BYTES,
];
