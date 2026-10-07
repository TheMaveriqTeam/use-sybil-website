/*
 * Login gate for the website editor (preview.usesybil.pro).
 *
 * Runs only where EDIT_PASSWORD is set, i.e. the editor project. Without a
 * valid session cookie every page answers with the login screen, so the
 * preview is neither visible nor editable before signing in. The live
 * project has no EDIT_PASSWORD and passes every request straight through.
 *
 * The cookie is set by api/login.js: "<expiry>.<HMAC-SHA256(EDIT_PASSWORD, 'sybil-edit:<expiry>')>".
 */
import { next } from '@vercel/functions';

export const config = { matcher: '/:path*' };

const COOKIE = 'sybil_edit';
const OPEN = new Set(['/api/login', '/sybil-login.css', '/favicon.svg', '/favicon-32.png']);

const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function validSession(cookieHeader, secret) {
  const match = (cookieHeader || '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  if (!match) return false;
  const [exp, sig] = decodeURIComponent(match[1]).split('.');
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const expected = b64url(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`sybil-edit:${exp}`)));
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}

const escape = (s) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function loginPage(nextPath, failed) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Website editor · Use Sybil</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/sybil-login.css">
</head>
<body>
<main class="box">
  <p class="eyebrow">Use Sybil</p>
  <h1>Website editor</h1>
  <p class="lead">Sign in to edit the text of usesybil.pro.</p>
  ${failed ? '<p class="error" role="alert">That password is not right.</p>' : ''}
  <form method="post" action="/api/login">
    <input type="hidden" name="next" value="${escape(nextPath)}">
    <label for="pw">Password</label>
    <input id="pw" name="password" type="password" autocomplete="current-password" required autofocus>
    <button type="submit">Sign in</button>
  </form>
</main>
</body>
</html>`;
}

export default async function middleware(request) {
  const secret = process.env.EDIT_PASSWORD;
  if (!secret) return next();

  const url = new URL(request.url);
  if (OPEN.has(url.pathname)) return next();
  if (await validSession(request.headers.get('cookie'), secret)) return next();

  if (url.pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({ error: 'Signed out' }), {
      status: 401,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    });
  }
  const failed = url.searchParams.get('login') === 'failed';
  url.searchParams.delete('login');
  return new Response(loginPage(url.pathname + url.search, failed), {
    status: 401,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow',
    },
  });
}
