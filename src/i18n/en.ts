/**
 * English copy for usesybil.pro, from src/content/en.json. English is the
 * reference: its shape is the `Copy` type every other language must match.
 * See ./load.ts for tokens and voice.
 */
import raw from '../content/en.json';
import { buildCopy } from './load';

export { TOKENS, fillTokens } from './load';

export const en = buildCopy(raw);

export type Copy = typeof en;
