import type { APIRoute } from 'astro';
import { llmsFullTxt } from '../lib/llms';

export const GET: APIRoute = () => {
  const date = new Date().toISOString().slice(0, 10);
  return new Response(llmsFullTxt(date), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
