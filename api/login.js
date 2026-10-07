/*
 * POST /api/login (form: password, next) — signs in to the website editor.
 * GET /api/login?logout=1 — signs out.
 * Only active where EDIT_PASSWORD is set (the editor project).
 */
import { makeSession, samePassword, sessionCookie } from './_session.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Only same-site paths: "/security", never "//evil.example" or "https://…".
const safePath = (p) => (typeof p === 'string' && p.startsWith('/') && !p.startsWith('//') && !p.includes('\\') ? p : '/');

async function readForm(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  let raw = typeof req.body === 'string' ? req.body : '';
  if (!raw) for await (const chunk of req) raw += chunk;
  return Object.fromEntries(new URLSearchParams(raw));
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  const secret = process.env.EDIT_PASSWORD;
  if (!secret) return res.status(404).send('Not found');

  if (req.method === 'GET' && req.query?.logout) {
    res.setHeader('Set-Cookie', sessionCookie('', 0));
    return res.redirect(303, '/');
  }
  if (req.method !== 'POST') return res.status(405).send('Use POST');

  const form = await readForm(req);
  const nextPath = safePath(form.next);
  if (!samePassword(form.password || '', secret)) {
    await sleep(1000);
    const back = new URL(nextPath, 'https://x');
    back.searchParams.set('login', 'failed');
    return res.redirect(303, back.pathname + back.search);
  }
  res.setHeader('Set-Cookie', sessionCookie(makeSession(secret)));
  return res.redirect(303, nextPath);
}
