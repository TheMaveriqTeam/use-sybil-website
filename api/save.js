/*
 * POST /api/save: publishes text edits made on preview.usesybil.pro.
 *
 * Body: { locale, changes: [{ key, from, to }] } where locale is en, nl or
 * fr (default en) and key is a dotted path in src/content/<locale>.json.
 * The caller must be signed in (api/login.js sets the session cookie;
 * middleware.js keeps the whole preview behind it). The function commits
 * that one JSON file to GitHub; Vercel then rebuilds the live site (and the
 * preview) from that commit.
 *
 * Only runs where EDIT_PASSWORD and GITHUB_TOKEN are set (the preview
 * project). On the live project it answers 404.
 *   GITHUB_TOKEN   fine-grained token, use-sybil-website only, Contents: read and write
 *   GITHUB_REPO    default TheMaveriqTeam/use-sybil-website
 *   GITHUB_BRANCH  default main
 */
import { validSession } from './_session.js';

const LOCALES = new Set(['en', 'nl', 'fr']);
const fileFor = (locale) => `src/content/${locale}.json`;
const MAX_CHANGES = 200;
const MAX_LENGTH = 4000;
// Facts filled in from src/lib/site.ts (see src/i18n/load.ts) and {name} in ui.languageSoon.
const TOKENS = new Set([
  'pro', 'manco', 'extra', 'trialDocuments', 'vaultYears', 'proAccounts', 'mancoAccounts',
  'proName', 'mancoName', 'companyName', 'vatNumber', 'contactEmail', 'securityEmail', 'name',
]);

// One line; typographic no-break spaces stay (see tidy() in public/sybil-edit.js).
const tidy = (text) => text
  .replace(/\u00A0(?![:;?!»%])/g, (m, i, s) => (s[i - 1] === '«' ? m : ' '))
  .replace(/[ \t\n\r\f\v]+/g, ' ')
  .trim();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function gh(path, init = {}) {
  const repo = process.env.GITHUB_REPO || 'TheMaveriqTeam/use-sybil-website';
  return fetch(`https://api.github.com/repos/${repo}/${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'use-sybil-website-editor',
      ...(init.headers || {}),
    },
  });
}

function locate(root, key) {
  const parts = key.split('.');
  let parent = root;
  for (const p of parts.slice(0, -1)) {
    if (parent == null || typeof parent !== 'object' || !Object.hasOwn(parent, p)) return null;
    parent = parent[p];
  }
  const last = parts[parts.length - 1];
  if (parent == null || typeof parent !== 'object' || !Object.hasOwn(parent, last)) return null;
  return { parent, last };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  const password = process.env.EDIT_PASSWORD;
  if (!password || !process.env.GITHUB_TOKEN) return res.status(404).json({ error: 'Not found' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  if (!validSession(req.headers.cookie, password)) {
    await sleep(500);
    return res.status(401).json({ error: 'Signed out' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const locale = body.locale ?? 'en';
  if (typeof locale !== 'string' || !LOCALES.has(locale)) return res.status(400).json({ error: 'Unknown language' });
  const FILE = fileFor(locale);
  const changes = Array.isArray(body.changes) ? body.changes : [];
  if (!changes.length) return res.status(200).json({ ok: true, published: 0 });
  if (changes.length > MAX_CHANGES) return res.status(400).json({ error: `At most ${MAX_CHANGES} changes at once` });

  for (const c of changes) {
    if (typeof c?.key !== 'string' || !/^[A-Za-z0-9_.]+$/.test(c.key) || /\.(tone|id)$/.test(c.key)) {
      return res.status(400).json({ error: `Not an editable text: ${String(c?.key)}` });
    }
    if (typeof c.to !== 'string' || !tidy(c.to) || c.to.length > MAX_LENGTH) {
      return res.status(400).json({ error: `Text for ${c.key} is empty or too long` });
    }
    const unknown = [...c.to.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).filter((t) => !TOKENS.has(t));
    if (unknown.length) return res.status(400).json({ error: `Unknown placeholder {${unknown[0]}} in ${c.key}` });
  }

  const branch = process.env.GITHUB_BRANCH || 'main';
  const current = await gh(`contents/${FILE}?ref=${encodeURIComponent(branch)}`);
  if (!current.ok) {
    console.error(`read ${FILE}`, current.status, await current.text());
    return res.status(502).json({ error: 'Could not read the website text from GitHub' });
  }
  const file = await current.json();
  const copy = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));

  const conflicts = [];
  let applied = 0;
  for (const c of changes) {
    const spot = locate(copy, c.key);
    if (!spot || typeof spot.parent[spot.last] !== 'string') {
      return res.status(400).json({ error: `Not an editable text: ${c.key}` });
    }
    const live = spot.parent[spot.last];
    if (live === c.to) continue; // already published
    if (typeof c.from === 'string' && live !== c.from) { conflicts.push(c.key); continue; }
    spot.parent[spot.last] = tidy(c.to);
    applied++;
  }
  if (conflicts.length) return res.status(409).json({ error: 'Changed in the meantime', conflicts });
  if (!applied) return res.status(200).json({ ok: true, published: 0 });

  const keys = changes.map((c) => c.key);
  const message = `Website text (${locale.toUpperCase()}): ${applied} ${applied === 1 ? 'edit' : 'edits'} from the editor\n\n${keys.map((k) => `- ${k}`).join('\n')}`;
  const put = await gh(`contents/${FILE}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      branch,
      sha: file.sha,
      content: Buffer.from(`${JSON.stringify(copy, null, 2)}\n`, 'utf8').toString('base64'),
    }),
  });
  if (put.status === 409 || put.status === 422) {
    return res.status(409).json({ error: 'The text changed while publishing. Try again.', conflicts: [] });
  }
  if (!put.ok) {
    console.error(`write ${FILE}`, put.status, await put.text());
    return res.status(502).json({ error: 'GitHub refused the change. Nothing was published.' });
  }
  const out = await put.json();
  return res.status(200).json({ ok: true, published: applied, commit: out.commit?.sha, url: out.commit?.html_url });
}
