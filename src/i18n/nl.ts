/**
 * Dutch (Belgian) copy for usesybil.pro, from src/content/nl.json.
 * Same keys and {tokens} as en.json. Informal "je/jij"; "boekhouder", "btw".
 */
import raw from '../content/nl.json';
import { buildCopy } from './load';
import type { Copy } from './en';

export const nl: Copy = buildCopy(raw);
