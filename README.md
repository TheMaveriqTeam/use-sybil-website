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
| All visible copy (EN) | `src/content/en.json` (loaded and filled in by `src/i18n/en.ts`) |
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

## Editing the text on preview.usesybil.pro

A second Vercel project builds this same repo with `PUBLIC_SYBIL_EDIT=1` and
serves it at `preview.usesybil.pro` (noindex). There, every text can be
clicked and edited in place, and **All texts** lists the rest (page titles,
descriptions, screen-reader labels). **Publish** asks for the editor
password and calls `api/save.js`, which commits `src/content/en.json` to
`main`: the live site rebuilds in about a minute.

- `{pro}`, `{manco}`, `{extra}`, `{trialDocuments}` and the other `{tokens}`
  are filled in from `src/lib/site.ts`; keep them when editing a sentence.
- Unpublished edits stay in that browser, across pages, until published or
  discarded.
- Preview project env: `PUBLIC_SYBIL_EDIT=1`, `EDIT_PASSWORD`, `GITHUB_TOKEN`
  (fine-grained, this repo only, Contents: read and write). The live
  project has none of these: its `/api/save` answers 404 and its pages
  carry no editor.
- Code: `src/lib/editMode.ts`, `public/sybil-edit.js`, `public/sybil-edit.css`,
  `api/save.js`.

## Pages

- `/`: landing page (built from the approved "Use Sybil · Website" board)
- `/security`: the Trust facts, expanded
- `/for-accountants`: what the accountant receives each quarter
- `/privacy`, `/terms`: **drafts**, `noindex`, left out of the sitemap
- `404`

## SEO and GEO

- Every page: unique `<title>` and meta description, canonical on
  `https://www.usesybil.pro`, Open Graph and Twitter card (`public/og.png`,
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

Vercel project **`use-sybil-website`**, domain **`www.usesybil.pro`** (the bare `usesybil.pro`
redirects to `www` in Vercel's domain settings, so canonicals use `www`). Pushing to `main` deploys
production. `vercel.json` sets clean URLs and the security headers (CSP
`'self'` only, HSTS, `nosniff`, Referrer-Policy, Permissions-Policy,
frame denial).

## Placeholders still open

These stay visibly marked until Arthur supplies the real values:
`[Company name]`, `BE [VAT number]`, `[contact e-mail]`,
`[security contact e-mail]`, the two quote placeholders, the privacy and
terms texts, and `legalName` / `vatID` in the Organization JSON-LD
(`src/lib/schema.ts`).
