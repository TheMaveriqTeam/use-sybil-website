/**
 * French (Belgian) copy for usesybil.pro, from src/content/fr.json.
 * Same keys and {tokens} as en.json. "Vous"; "comptable", "TVA", "HTVA".
 */
import raw from '../content/fr.json';
import { buildCopy } from './load';
import type { Copy } from './en';

export const fr: Copy = buildCopy(raw);
