# usesybil.pro: rules for Claude

Marketing site for Use Sybil. Astro (static) + Tailwind v4. Read `README.md` first.

## Brand (from the Use Sybil brand book)

- Newsreader for titles and Sybil's voice. Italic is reserved for Sybil
  ("*Sybil noticed*") and the "Use Sybil." line. Geist for the interface and
  every figure (tabular numbers). Geist Mono for IBANs, references and file names.
- Saffron (`--highlight`) is a fill only, never text. Red (`--stop`) is used
  only for Stop (Sybil can't vouch for who you pay). Nothing else is red.
- Leaf is for the wordmark and type of 24px or larger only.
- Money is written the Belgian way: `€ 1.234,56`, prices "excl. VAT".
- Voice: supportive, clear, specific (dates, euros, counts). No exclamation
  marks, no "smart" or "powerful AI". Sybil gives facts, never advice. Never
  call her an advisor. "Ready for your accountant", never "replaces your accountant".
- Colours and fonts come from the tokens in `src/styles/global.css`. No
  one-off hex values in markup. Light and dark mode must both work.

## Independence

Use Sybil is independent of Maveriq: no Maveriq names, logos, colours,
fonts, taglines, keys, env vars or analytics in this repo.

## Content rules

- English first, then Dutch and French. Copy lives in `src/content/en.json`,
  `nl.json` and `fr.json`, all with the same keys (edited by Arthur on
  preview.usesybil.pro, see README); facts and prices in `src/lib/site.ts`
  reach the copy as `{tokens}`. Pull before editing copy: the editor
  commits straight to `main`. Never hard-code a price in a page.
- A copy change in English needs the same change in `nl.json` and `fr.json`
  (same key, same `{tokens}`). A new key goes into all three files.
- Dutch: "je/jij", boekhouder, btw, "excl. btw". French: "vous", comptable,
  TVA, "HTVA" / "hors TVA", French no-break spaces before `: ; ? ! %` and
  inside `« »`. Glossary in README ("Translations"). "Use Sybil", "Pro",
  "ManCo", "Peppol" and "Sybil Scan" are never translated. Translated
  placeholders stay in [brackets].
- Placeholders such as `[Company name]`, `BE [VAT number]`,
  `[contact e-mail]` and `[Pilot customer quote · Name, Company]` stay visibly
  marked until Arthur supplies the real values. Never invent company data,
  quotes, customer names, certifications or numbers.
- `/privacy` and `/terms` stay `noindex` drafts until the legal text exists.

## Every page needs

A unique title and meta description, a canonical URL, a JSON-LD graph
(through `BaseLayout`), exactly one `h1`, landmarks, alt text and 44px tap
targets. Run `npm run build` and `npm run check` before committing. When a
fact changes, check that `/llms.txt` and `/llms-full.txt` still say the same
thing as the pages.
