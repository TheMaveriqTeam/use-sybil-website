// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Pages that must stay out of the sitemap (drafts carry `noindex`).
const NOINDEX = ['/privacy', '/terms', '/404'];

export default defineConfig({
  site: 'https://usesybil.pro',
  output: 'static',
  trailingSlash: 'never',
  build: {
    // /security.html is served as /security (vercel.json cleanUrls).
    format: 'file',
    // Every stylesheet is an external file, so the CSP needs no inline styles.
    inlineStylesheets: 'never',
  },
  // English is live. NL and FR are prepared: add the code here, set its status
  // to 'live' in src/i18n/config.ts and add src/pages/<code>/ (see README).
  i18n: {
    locales: ['en'],
    defaultLocale: 'en',
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({
      filter: (page) => !NOINDEX.some((p) => new URL(page).pathname.replace(/\/$/, '') === p),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
