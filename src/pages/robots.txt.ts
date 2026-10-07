import type { APIRoute } from 'astro';
import { EDIT_MODE } from '../lib/editMode';

/**
 * Everyone may crawl everything, including AI and answer-engine crawlers:
 * being quoted correctly by them is part of the plan (see /llms.txt).
 */
const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot',
  'Applebot-Extended',
  'Bingbot',
  'CCBot',
];

export const GET: APIRoute = ({ site }) => {
  // The editing copy (preview.usesybil.pro) stays out of every index.
  if (EDIT_MODE) return new Response('User-agent: *\nDisallow: /\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  const base = site ?? new URL('https://www.usesybil.pro');
  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    ...AI_CRAWLERS.flatMap((bot) => [`User-agent: ${bot}`, 'Allow: /', '']),
    `Sitemap: ${new URL('/sitemap-index.xml', base).href}`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
