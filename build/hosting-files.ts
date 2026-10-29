import type { Plugin } from 'vite';
import { readFileSync, writeFileSync, readdirSync, unlinkSync, existsSync, copyFileSync } from 'node:fs';
import { resolve, join, relative, sep } from 'node:path';

/** Netlify Drop has no known hostname at build time. Don't publish false canonicals. */
export function hostingFiles(siteUrl: string): Plugin {
  let outDir: string;
  return {
    name: 'qrtransfer-hosting-files',
    enforce: 'post',
    configResolved(config) { outDir = resolve(config.root, config.build.outDir); },
    writeBundle: {
      sequential: true,
      handler() {
        const portable = new URL(siteUrl).hostname === 'qrtransfer.invalid';
        {
          const clean = (dir: string) => {
            for (const entry of readdirSync(dir, { withFileTypes: true })) {
              const path = join(dir, entry.name);
              if (entry.isDirectory()) clean(path);
              else if (path.endsWith('.html')) {
                let html = readFileSync(path, 'utf8');
                if (portable) html = html.replace(/<(?:link|meta)\b[^>]*https:\/\/qrtransfer\.invalid[^>]*>\s*/g, '');
                const prefix = '../'.repeat(relative(outDir, path).split(sep).length - 1);
                html = html.replace('</footer>', `<a href="${prefix}qrtransfer-source.zip" download>QRtransfer source</a></footer>`);
                writeFileSync(path, html);
              }
            }
          };
          clean(outDir);
          const sitemap = join(outDir, 'sitemap.xml');
          if (portable && existsSync(sitemap)) unlinkSync(sitemap);
        }
        writeFileSync(join(outDir, 'robots.txt'), 'User-agent: *\nAllow: /\n' + (portable ? '' : `Sitemap: ${new URL('sitemap.xml', siteUrl).href}\n`));
        copyFileSync('LICENSE', join(outDir, 'LICENSE.txt'));
        copyFileSync('NOTICE', join(outDir, 'NOTICE.txt'));
      },
    },
  };
}
