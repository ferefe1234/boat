// Post-transfer support link — hosted builds only. The standalone build swaps
// this module for support.inline.ts (see build/use-inline-variants.ts), so a
// downloaded artifact never solicits; the code is not even parsed there.
// One quiet line, shown only after the app has actually delivered a file.
export function supportLink(): HTMLElement | null {
  return null;
}
