/*
 * Editor session cookie, shared by api/login.js and api/save.js. The same
 * format is checked at the edge by middleware.js:
 *   sybil_edit = "<expiry>.<base64url HMAC-SHA256(EDIT_PASSWORD, 'sybil-edit:<expiry>')>"
 * (Files starting with "_" in api/ are not routes.)
 */
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export const COOKIE = 'sybil_edit';
export const SESSION_DAYS = 14;

const sign = (secret, exp) => createHmac('sha256', secret).update(`sybil-edit:${exp}`).digest('base64url');

export function makeSession(secret) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_DAYS * 86400;
  return `${exp}.${sign(secret, exp)}`;
}

export function validSession(cookieHeader, secret) {
  const match = (cookieHeader || '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  if (!match) return false;
  const [exp, sig] = decodeURIComponent(match[1]).split('.');
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  const expected = Buffer.from(sign(secret, exp));
  const given = Buffer.from(sig);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function samePassword(given, expected) {
  const d = (s) => createHash('sha256').update(String(s)).digest();
  return timingSafeEqual(d(given), d(expected));
}

export function sessionCookie(value, maxAge = SESSION_DAYS * 86400) {
  return `${COOKIE}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`;
}
