/**
 * Languages of usesybil.pro.
 *
 * English is live. Dutch and French are planned: they show in the language
 * switch as "soon" and get no hreflang, no sitemap entry and no route until
 * their status is 'live'. To launch one, see README.md ("Adding NL or FR").
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
  { code: 'nl', tag: 'nl-BE', ogLocale: 'nl_BE', label: 'NL', name: 'Nederlands', status: 'planned' },
  { code: 'fr', tag: 'fr-BE', ogLocale: 'fr_BE', label: 'FR', name: 'Français', status: 'planned' },
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
