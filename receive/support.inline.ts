// Standalone variant of support.ts: a downloaded single-file artifact should
// not solicit — and its whole point is zero external references.
export function supportLink(): HTMLElement | null {
  return null;
}
