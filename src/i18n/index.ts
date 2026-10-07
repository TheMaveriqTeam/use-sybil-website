import enRaw from '../content/en.json';
import nlRaw from '../content/nl.json';
import frRaw from '../content/fr.json';
import { en, type Copy } from './en';
import { nl } from './nl';
import { fr } from './fr';
import type { RawCopy } from './load';
import type { LocaleCode } from './config';

/** Copy per locale, built from src/content/<code>.json. */
const dictionaries: Record<LocaleCode, Copy> = { en, nl, fr };

/** The unfilled JSON per locale, for the editor on preview.usesybil.pro. */
export const RAW_COPY: Record<LocaleCode, RawCopy> = { en: enRaw, nl: nlRaw, fr: frRaw };

export function useCopy(code: LocaleCode = 'en'): Copy {
  return dictionaries[code] ?? en;
}

export type { Copy };
