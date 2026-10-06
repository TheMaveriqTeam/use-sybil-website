import { en, type Copy } from './en';
import type { LocaleCode } from './config';

/**
 * Copy per locale. NL and FR fall back to English until their files exist;
 * they are not routed or announced (hreflang, sitemap) until their status
 * in ./config.ts is 'live'.
 */
const dictionaries: Partial<Record<LocaleCode, Copy>> = { en };

export function useCopy(code: LocaleCode = 'en'): Copy {
  return dictionaries[code] ?? en;
}

export type { Copy };
