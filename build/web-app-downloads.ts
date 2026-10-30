import type { Plugin } from 'vite';

/** Web edition label and downloads. Native/standalone builds omit this plugin. */
export function webAppDownloads(): Plugin {
  return {
    name: 'web-app-downloads',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        html = html.replace(
          /(<a\b[^>]*\bclass="brand"[^>]*>[\s\S]*?)QRtransfer(<\/a>)/,
          '$1<span class="web-brand-name">QRtransfer<small class="web-edition">Web</small></span>$2',
        );
        return html.replace(
          /(<dialog\b[^>]*\bid="share-dialog"[^>]*>[\s\S]*?)(<div class="note-actions">)/,
          '$1<a id="share-apps" class="share-apps-link" href="https://github.com/lgp-15611081259/boat" target="_blank" rel="noopener noreferrer">Download apps on GitHub</a>\n        $2',
        );
      },
    },
  };
}
