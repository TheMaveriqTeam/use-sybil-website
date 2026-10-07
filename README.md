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
| All visible copy | `src/content/en.json`, `nl.json`, `fr.json` (same keys; loaded and filled in by `src/i18n/load.ts`) |
| Prices, limits, app URLs, placeholders | `src/lib/site.ts` |
| Languages (EN, NL, FR; live / planned) | `src/i18n/config.ts`, `astro.config.mjs` (`i18n`) |
| Design tokens (colours light + dark, type, radii) | `src/styles/global.css` (mirrors `Use-Sybil/src/index.css`) |
| Brand files (mark, app icon, avatar, portrait) | `src/assets/brand/` |
| Page layouts | `src/views/*.astro` (one per page, take a `lang` prop) |
| Routes | `src/pages/` (English), `src/pages/nl/`, `src/pages/fr/` (thin wrappers around the views) |
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
descriptions, screen-reader labels). The whole preview sits behind a
login screen (`middleware.js`, `api/login.js`, a 14-day session cookie).
**Publish** calls `api/save.js`, which commits that page's language file to
`main`: `src/content/en.json` from `/`, `nl.json` from `/nl/…`, `fr.json`
from `/fr/…`. The live site rebuilds in about a minute.

- Each language is edited on its own pages: to change Dutch text, open
  `preview.usesybil.pro/nl`. The bar shows which language you are editing.
- Unpublished edits are kept per language, so English and Dutch edits
  never mix and each Publish commits one file.
- French typography uses no-break spaces (`Pourquoi ?`, `« Stop »`,
  `Contact : …`) and prices use a narrow one (`€ 86,40`); the editor keeps
  them.

- `{pro}`, `{manco}`, `{extra}`, `{trialDocuments}` and the other `{tokens}`
  are filled in from `src/lib/site.ts`; keep them when editing a sentence.
- Unpublished edits stay in that browser, across pages of the same
  language, until published or discarded.
- Preview project env: `PUBLIC_SYBIL_EDIT=1`, `EDIT_PASSWORD`, `GITHUB_TOKEN`
  (fine-grained, this repo only, Contents: read and write). The live
  project has none of these: its `/api/save` answers 404 and its pages
  carry no editor.
- Code: `src/lib/editMode.ts`, `public/sybil-edit.js`, `public/sybil-edit.css`,
  `middleware.js`, `api/login.js`, `api/_session.js`, `api/save.js`.
- Illustrations: cut from the storyboards in `incoming/` into
  `src/assets/illustrations/` (shown with the `.illo` soft fade).

## Pages

Each page exists in English (no prefix), Dutch (`/nl`, nl-BE) and French
(`/fr`, fr-BE), with the same slugs: `/security`, `/nl/security`,
`/fr/security`.

- `/`: landing page (built from the approved "Use Sybil · Website" board)
- `/security`: the Trust facts, expanded
- `/for-accountants`: what the accountant receives each quarter
- `/privacy`, `/terms`: **drafts**, `noindex`, left out of the sitemap
- `404`: English only (the language switch there leads to `/nl` and `/fr`)

### Translations

- Dutch uses "je/jij" (the brand's direct tone), French uses "vous".
- Glossary: accountant = boekhouder / comptable; VAT = btw / TVA; excl. VAT
  = excl. btw / HTVA (hors TVA in sentences); management company =
  managementvennootschap / société de management; receipt = kasticket /
  ticket de caisse; proof = bewijsstuk / justificatif; vault = kluis /
  coffre-fort; notice date = opzegdatum / date de préavis; Professional /
  Personal = Professioneel / Privé, Professionnel / Privé.
- "Use Sybil", "Sybil", "Pro", "ManCo", "Peppol" and "Sybil Scan" are never
  translated. Money stays `€ 39`, `€ 86,40` in every language.
- `{tokens}` from `src/lib/site.ts` (including the English placeholders
  `[Company name]`, `BE [VAT number]`) are the same in every file.

## SEO and GEO

- Every page: unique `<title>` and meta description, canonical on
  `https://www.usesybil.pro`, Open Graph and Twitter card (`public/og.png`,
  1200×630), and one JSON-LD `@graph` (Organization, WebSite, WebPage).
  The home page adds SoftwareApplication (Pro € 39 and ManCo € 69 a month,
  excl. VAT, Belgium) and FAQPage. Sub-pages add BreadcrumbList.
- `hreflang` is only written for live languages (en, nl-BE, fr-BE), plus
  `x-default` → English; `og:locale` and `og:locale:alternate` follow.
- `@astrojs/sitemap` writes `sitemap-index.xml`, with the same language
  alternates per URL. `robots.txt` allows every
  crawler, including the AI ones, and points to the sitemap.
- `/llms.txt` and `/llms-full.txt` give answer engines a plain, factual
  summary: what Use Sybil is, who it is for, plans and prices, what it does
  not do, and links.

## Adding a language

English, Dutch and French are live. For another one (say `de`):

1. Copy `src/content/en.json` to `src/content/de.json` and translate the
   values. Keep every key, every `{token}` and the non-text values (`tone`,
   `id`, `mark`, `manco`, `stop`, `featured`) exactly as they are.
2. Add `src/i18n/de.ts` like `nl.ts` (`buildCopy(raw)`, typed `Copy`: a
   missing key is a type error), and register it in `src/i18n/index.ts`
   (`dictionaries` and `RAW_COPY`).
3. In `src/i18n/config.ts`, add `'de'` to `LocaleCode` and a `LOCALES` entry
   with `status: 'live'`.
4. In `astro.config.mjs`, add `'de'` to `LOCALES`, to the prefix in
   `withoutLocale` and to the sitemap `i18n.locales`.
5. Add `src/pages/de/` with the same thin files as `src/pages/nl/`, passing
   `lang="de"`.
6. In `api/save.js`, add `'de'` to `LOCALES`; in `public/sybil-edit.js`, to
   the locale check. The editor then works on `/de/…` too.
7. The language switch, `hreflang`, sitemap alternates, `<html lang>`,
   `og:locale` and JSON-LD `inLanguage` follow automatically. "Use Sybil"
   stays in English in every language.

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
