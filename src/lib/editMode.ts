/**
 * Edit mode: the build behind preview.usesybil.pro (PUBLIC_SYBIL_EDIT=1).
 *
 * Each copy string is wrapped in zero-width characters that carry its key in
 * src/content/<locale>.json (keys are the same in en, nl and fr). The page
 * also embeds its own language's JSON (#sybil-copy, with a `locale` field).
 * public/sybil-edit.js finds the markers, strips them and makes that text
 * editable; Publish sends the changes and the locale to api/save.js, which
 * commits that language's JSON and so redeploys the live site.
 *
 * The live site is built without PUBLIC_SYBIL_EDIT and contains none of this.
 */
export const EDIT_MODE = import.meta.env.PUBLIC_SYBIL_EDIT === '1';

const START = '\u2063';
const SEP = '\u2064';
const END = '\u2062';
const DIGITS = ['\u200B', '\u200C', '\u200D', '\u2060'];

/** Key as zero-width base-4 digits, 4 per character (keys are ASCII). */
function encodeKey(key: string): string {
  let out = '';
  for (const ch of key) {
    const c = ch.charCodeAt(0) & 0xff;
    out += DIGITS[(c >> 6) & 3] + DIGITS[(c >> 4) & 3] + DIGITS[(c >> 2) & 3] + DIGITS[c & 3];
  }
  return out;
}

export function markCopy(key: string, text: string): string {
  if (!text) return text;
  return START + encodeKey(key) + SEP + text + END;
}
