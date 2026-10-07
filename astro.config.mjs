// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Pages that must stay out of the sitemap (drafts carry `noindex`), in every language.
const NOINDEX = ['/privacy', '/terms', '/404'];
const LOCALES = ['en', 'nl', 'fr'];
/** @param {string} pathname */
const withoutLocale = (pathname) => pathname.replace(/\/$/, '').replace(/^\/(nl|fr)(?=\/|$)/, '') || '/';

export default defineConfig({
  site: 'https://www.usesybil.pro',
  output: 'static',
  trailingSlash: 'never',
  build: {
    // /security.html is served as /security (vercel.json cleanUrls).
    format: 'file',
    // Every stylesheet is an external file, so the CSP needs no inline styles.
    inlineStylesheets: 'never',
  },
  // English (no prefix), Dutch (/nl) and French (/fr). A new language: add the
  // code here, set its status to 'live' in src/i18n/config.ts and add
  // src/pages/<code>/ (see README, "Adding a language").
  i18n: {
    locales: LOCALES,
    defaultLocale: 'en',
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({
      filter: (page) => !NOINDEX.includes(withoutLocale(new URL(page).pathname)),
      // xhtml:link alternates per page, matching the hreflang tags in <head>.
      i18n: { defaultLocale: 'en', locales: { en: 'en', nl: 'nl-BE', fr: 'fr-BE' } },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
