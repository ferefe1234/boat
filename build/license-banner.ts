import type { Plugin } from "vite";

/**
 * Prepends the copyright banner to every built artifact. The repo's LICENSE
 * covers the source; this covers what people actually copy — the deployed
 * bundle and the standalone files — so every copy carries the license notice
 * and a pointer to its Corresponding Source, as the AGPL requires, plus the
 * notice for the MIT-licensed portions the bundles incorporate (Steve Dakh's
 * contributions, the Emscripten glue — see NOTICE).
 *
 * JS and CSS get a `/*!` legal comment (minifiers preserve those); HTML gets
 * a comment right after the doctype (before it would parse fine in HTML5,
 * but after costs nothing and can never risk quirks mode). Binary assets
 * (wasm, images) are left alone.
 */
export function licenseBanner(version: string): Plugin {
  const text =
    `Decimen Optical Transfer v${version} — https://decimen.app — ` +
    `(c) 2026 Evan Crawley (Bash Alarmist) — SPDX-License-Identifier: AGPL-3.0-or-later — ` +
    `portions MIT: (c) 2026 Steve Dakh; Emscripten (see NOTICE) — ` +
    `Source: https://github.com/bashalarmistalt/decimen-optical-transfer`;
  const comment = `/*! ${text} */\n`;
  const htmlComment = `<!-- ${text} -->`;
  return {
    name: "license-banner",
    enforce: "post",
    generateBundle(_options, bundle) {
      for (const [fileName, output] of Object.entries(bundle)) {
        if (output.type === "chunk") {
          if (!output.code.startsWith(comment)) output.code = comment + output.code;
          continue;
        }
        if (typeof output.source !== "string") continue;
        if (fileName.endsWith(".js") || fileName.endsWith(".css")) {
          if (!output.source.startsWith(comment)) output.source = comment + output.source;
        } else if (fileName.endsWith(".html")) {
          if (output.source.includes(htmlComment)) continue;
          if (!/^<!doctype html>/i.test(output.source)) {
            throw new Error(`${fileName}: no leading doctype to banner after`);
          }
          output.source = output.source.replace(/^<!doctype html>/i, (m) => `${m}\n${htmlComment}`);
        }
      }
    },
  };
}
