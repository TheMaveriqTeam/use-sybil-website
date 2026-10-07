/**
 * One loader for every language. The words live in src/content/<code>.json
 * (en, nl, fr), all of the same shape, so they can be edited on the preview
 * site (preview.usesybil.pro) without touching code.
 *
 * {tokens} in the JSON are facts filled in from src/lib/site.ts, so a price
 * or a placeholder is still written once: {pro}, {manco}, {extra},
 * {trialDocuments}, {vaultYears}, {proAccounts}, {mancoAccounts}, {proName},
 * {mancoName}, {companyName}, {vatNumber}, {contactEmail}, {securityEmail}.
 *
 * Voice (brand book): supportive, clear, structured, not chatty. Specific
 * over vague: dates, euros, counts. No exclamation marks. Sybil gives facts,
 * never advice, and is never called an advisor. Placeholders in [brackets]
 * stay until real values exist.
 */
import type enRaw from '../content/en.json';
import { PLACEHOLDER, PLANS, PRICING, euro } from '../lib/site';
import { EDIT_MODE, markCopy } from '../lib/editMode';

/** Shape of a copy file: every language has exactly the keys of en.json. */
export type RawCopy = typeof enRaw;

export const TOKENS: Record<string, string> = {
  pro: euro(PLANS.pro.price),
  manco: euro(PLANS.manco.price),
  extra: euro(PRICING.extraAccountPrice),
  trialDocuments: String(PRICING.trialDocuments),
  vaultYears: String(PRICING.vaultYears),
  proAccounts: String(PLANS.pro.connectedAccounts),
  mancoAccounts: String(PLANS.manco.connectedAccounts),
  proName: PLANS.pro.name,
  mancoName: PLANS.manco.name,
  companyName: PLACEHOLDER.companyName,
  vatNumber: PLACEHOLDER.vatNumber,
  contactEmail: PLACEHOLDER.contactEmail,
  securityEmail: PLACEHOLDER.securityEmail,
};

export function fillTokens(text: string, extra: Record<string, string> = {}): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => extra[k] ?? TOKENS[k] ?? m);
}

type Tone = 'due' | 'attention' | 'stop';

/** Every string filled in; on the preview site, also marked for the editor. */
function fill<T>(value: T, path: string): T {
  if (typeof value === 'string') {
    const text = fillTokens(value);
    return (EDIT_MODE ? markCopy(path, text) : text) as T;
  }
  if (Array.isArray(value)) return value.map((v, i) => fill(v, `${path}.${i}`)) as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      // Values the pages use as class names or ids, never shown as text.
      out[k] = k === 'tone' || k === 'id' ? v : fill(v, path ? `${path}.${k}` : k);
    }
    return out as T;
  }
  return value;
}

/** Turns one language's JSON into the copy the pages read. */
export function buildCopy(raw: RawCopy) {
  const filled = fill(raw, '');
  const soon = raw.ui.languageSoon;
  return {
    ...filled,
    ui: {
      ...filled.ui,
      languageSoon: (name: string) => {
        const text = fillTokens(soon, { name });
        return EDIT_MODE ? markCopy('ui.languageSoon', text) : text;
      },
    },
    home: {
      ...filled.home,
      pains: {
        ...filled.home.pains,
        items: filled.home.pains.items as (RawCopy['home']['pains']['items'][number] & { tone: Tone })[],
      },
      pricing: {
        ...filled.home.pricing,
        // A quote still in [brackets] is a placeholder and is shown as one.
        quotes: filled.home.pricing.quotes.map((q, i) => ({
          ...q,
          placeholder: /^\[.*\]$/.test(raw.home.pricing.quotes[i].text.trim()),
        })),
      },
    },
  };
}
