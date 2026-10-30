// Standalone variant of loaders.ts — every catalog statically imported, so a
// single downloaded file speaks all four languages and the bindings are
// initialized before the entry's top-level await runs (the dynamic variant,
// inlined, landed after it — a TDZ crash on open). Swapped in at resolve time
// by build/use-inline-variants.ts; the hosted build never parses this file.

import type { Messages } from "./messages";
import * as en from "./locales/en";
import * as fr from "./locales/fr";
import * as zhHans from "./locales/zh-hans";
import * as ja from "./locales/ja";

export const loaders: Record<string, () => Promise<{ messages: Messages }>> = {
  en: () => Promise.resolve(en),
  fr: () => Promise.resolve(fr),
  "zh-hans": () => Promise.resolve(zhHans),
  ja: () => Promise.resolve(ja),
};
