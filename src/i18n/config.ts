/**
 * Languages of usesybil.pro.
 *
 * English, Dutch and French are live. A language with status 'planned'
 * shows in the language switch as "soon" and gets no hreflang, no sitemap
 * entry and no route. To add one, see README.md ("Adding a language").
 */
export type LocaleCode = 'en' | 'nl' | 'fr';

export interface Locale {
  code: LocaleCode;
  /** BCP 47 tag for <html lang> and hreflang. */
  tag: string;
  /** Open Graph locale. */
  ogLocale: string;
  /** Label in the language switch. */
  label: string;
  /** Name of the language in that language (for screen readers). */
  name: string;
  status: 'live' | 'planned';
}

export const LOCALES: Locale[] = [
  { code: 'en', tag: 'en', ogLocale: 'en_BE', label: 'EN', name: 'English', status: 'live' },
  { code: 'nl', tag: 'nl-BE', ogLocale: 'nl_BE', label: 'NL', name: 'Nederlands', status: 'live' },
  { code: 'fr', tag: 'fr-BE', ogLocale: 'fr_BE', label: 'FR', name: 'Français', status: 'live' },
];

export const DEFAULT_LOCALE: LocaleCode = 'en';

export const LIVE_LOCALES = LOCALES.filter((l) => l.status === 'live');

export function getLocale(code: LocaleCode): Locale {
  const found = LOCALES.find((l) => l.code === code);
  if (!found) throw new Error(`Unknown locale ${code}`);
  return found;
}

/** Path of a page in a given locale. English has no prefix: /security, /nl/security. */
export function localePath(code: LocaleCode, path: string): string {
  const clean = path === '/' ? '' : path.replace(/\/$/, '');
  if (code === DEFAULT_LOCALE) return clean || '/';
  return `/${code}${clean}`;
}

/** Locale of a URL path and the path without its prefix: "/nl/security" → nl, "/security". */
export function splitLocalePath(pathname: string): { code: LocaleCode; path: string } {
  const clean = pathname.replace(/\.html$/, '').replace(/\/(index)?$/, '') || '/';
  const m = clean.match(/^\/([a-z]{2})(\/.*)?$/);
  const found = m && LOCALES.find((l) => l.code === m[1] && l.code !== DEFAULT_LOCALE);
  if (found) return { code: found.code, path: m[2] || '/' };
  return { code: DEFAULT_LOCALE, path: clean };
}
