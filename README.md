# usesybil.pro

The marketing website for **Use Sybil**, pre-accounting for Belgian business
owners. The app itself lives at `app.usesybil.pro` (separate repo,
`Use-Sybil`); this site only links to it ("Try it free" → `/register`,
"Sign in" → `/login`).

Static [Astro](https://astro.build) + Tailwind CSS v4, TypeScript, no client
JavaScript (the FAQ uses `<details>`). Fonts are self-hosted through
`@fontsource` (Newsreader, Geist, Geist Mono): no Google Fonts requests.

## Run it

Node 22.12 or newer (see `.nvmrc`).

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # static site in dist/
npm run preview   # serve dist/ locally
npm run check     # type-check .astro and .ts files
npm run assets    # rebuild og.png, favicons and manifest icons in public/
```

`npm run assets` is only needed after a brand change (logo, portrait, hero
line). Its PNG output is committed, so Vercel builds don't run it.

## Where things live

| What | Where |
| --- | --- |
| All visible copy (EN) | `src/i18n/en.ts` |
| Prices, limits, app URLs, placeholders | `src/lib/site.ts` |
| Languages (live / planned) | `src/i18n/config.ts`, `astro.config.mjs` (`i18n`) |
| Design tokens (colours light + dark, type, radii) | `src/styles/global.css` (mirrors `Use-Sybil/src/index.css`) |
| Brand files (mark, app icon, avatar, portrait) | `src/assets/brand/` |
| Page layouts | `src/views/*.astro` (one per page, take a `lang` prop) |
| Routes | `src/pages/` (thin wrappers around the views) |
| `<head>`: title, description, canonical, hreflang, OG, JSON-LD | `src/layouts/BaseLayout.astro`, `src/lib/schema.ts` |
| `robots.txt`, `llms.txt`, `llms-full.txt` | `src/pages/*.txt.ts`, `src/lib/llms.ts` |
| OG image + icons generator | `scripts/build-og.mjs` |
| Security headers, clean URLs | `vercel.json` |

Prices are written once in `src/lib/site.ts`. The pages, JSON-LD offers and
`llms.txt` all read from there.

## Pages

- `/`: landing page (built from the approved "Use Sybil · Website" board)
- `/security`: the Trust facts, expanded
- `/for-accountants`: what the accountant receives each quarter
- `/privacy`, `/terms`: **drafts**, `noindex`, left out of the sitemap
- `404`

## SEO and GEO

- Every page: unique `<title>` and meta description, canonical on
  `https://usesybil.pro`, Open Graph and Twitter card (`public/og.png`,
  1200×630), and one JSON-LD `@graph` (Organization, WebSite, WebPage).
  The home page adds SoftwareApplication (Pro € 39 and ManCo € 69 a month,
  excl. VAT, Belgium) and FAQPage. Sub-pages add BreadcrumbList.
- `hreflang` is only written for live languages, plus `x-default` → English.
- `@astrojs/sitemap` writes `sitemap-index.xml`. `robots.txt` allows every
  crawler, including the AI ones, and points to the sitemap.
- `/llms.txt` and `/llms-full.txt` give answer engines a plain, factual
  summary: what Use Sybil is, who it is for, plans and prices, what it does
  not do, and links.

## Adding NL or FR

1. Copy `src/i18n/en.ts` to `src/i18n/nl.ts`, translate it (type `Copy`),
   and register it in `src/i18n/index.ts`.
2. In `src/i18n/config.ts`, set the locale's `status` to `'live'`.
3. In `astro.config.mjs`, add `'nl'` to `i18n.locales`.
4. Add `src/pages/nl/` with the same thin files as `src/pages/`, passing
   `lang="nl"` (for example `<Home lang="nl" />`).
5. The language switch, `hreflang` alternates and `<html lang>` follow
   automatically. "Use Sybil" stays in English in every language.

## Deploy

Vercel project **`use-sybil-website`**, domain **`usesybil.pro`** (`www`
redirects in Vercel's domain settings). Pushing to `main` deploys
production. `vercel.json` sets clean URLs and the security headers (CSP
`'self'` only, HSTS, `nosniff`, Referrer-Policy, Permissions-Policy,
frame denial).

## Placeholders still open

These stay visibly marked until Arthur supplies the real values:
`[Company name]`, `BE [VAT number]`, `[contact e-mail]`,
`[security contact e-mail]`, the two quote placeholders, the privacy and
terms texts, and `legalName` / `vatID` in the Organization JSON-LD
(`src/lib/schema.ts`).
