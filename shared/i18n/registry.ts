// The locale control panel: every language Decimen ships, in one table.
//
// This file is deliberately tiny and dependency-free — it rides in every
// entry chunk (the language switcher needs each locale's native name without
// loading four catalogs), and the build imports it to know which page trees
// to emit. The catalogs themselves load on demand (see index.ts loaders).
//
// To add a language: add a row here, add shared/i18n/locales/<code>.ts
// (copy en.ts and translate it), and add its loader in index.ts. The build
// emits its /<code>/ page tree, sitemap entries, hreflang links, and PWA
// manifest from this table; nothing else needs touching.
//
// `reviewed` retains translation provenance for maintainers. The product does
// not display a review notice. English is the original source text.

export interface LocaleInfo {
  /** Registry key and URL path segment (lowercase): decimen.app/<code>/ */
  code: string;
  /** BCP 47 tag for <html lang> and every Intl formatter. */
  lang: string;
  /** The language's own name for itself — switcher entries never translate. */
  nativeName: string;
  dir: "ltr" | "rtl";
  /** Confirmed by a native speaker; metadata only. */
  reviewed: boolean;
}

export const DEFAULT_LOCALE = "en";

export const LOCALES: readonly LocaleInfo[] = [
  { code: "en", lang: "en", nativeName: "English", dir: "ltr", reviewed: true },
  { code: "fr", lang: "fr", nativeName: "Français", dir: "ltr", reviewed: false },
  { code: "zh-hans", lang: "zh-Hans", nativeName: "简体中文", dir: "ltr", reviewed: false },
  { code: "ja", lang: "ja", nativeName: "日本語", dir: "ltr", reviewed: false },
];

export function localeByCode(code: string): LocaleInfo | undefined {
  return LOCALES.find((l) => l.code === code);
}

/**
 * Best shipped locale for a browser's language list, or undefined.
 *
 * Exact tag first ("pt-BR" → pt-br), then the bare language ("pt" → pt-br
 * would be wrong, so bare matches only map to a locale whose own language
 * subtag equals it — "es-MX" → es, "zh" → zh-hans via the alias table).
 */
const BARE_LANGUAGE_ALIASES: Record<string, string> = {
  // Chinese needs script disambiguation the bare tag doesn't carry; Simplified
  // is what we ship, so bare "zh" (and the mainland/Singapore tags) land there.
  zh: "zh-hans",
  "zh-cn": "zh-hans",
  "zh-sg": "zh-hans",
};

export function matchLocale(preferred: readonly string[]): LocaleInfo | undefined {
  for (const raw of preferred) {
    const tag = raw.toLowerCase();
    const exact = localeByCode(tag) ?? localeByCode(BARE_LANGUAGE_ALIASES[tag] ?? "");
    if (exact) return exact;
    const bare = tag.split("-")[0]!;
    const byBare =
      localeByCode(bare) ?? localeByCode(BARE_LANGUAGE_ALIASES[bare] ?? "");
    if (byBare) return byBare;
  }
  return undefined;
}
