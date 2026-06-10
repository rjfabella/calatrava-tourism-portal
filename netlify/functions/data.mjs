// GET  /api/data/<key>.json  → current content (Netlify Blobs first, repo file as fallback)
// PUT  /api/data/<key>.json  → save new content to Netlify Blobs (requires ADMIN_PASSWORD)
//
// netlify.toml force-rewrites /data/*.json here, so the public pages and the
// admin read through this function without any change to their fetch URLs.
import { getStore } from '@netlify/blobs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

// Keep in sync with the `files` list in admin.html initApp().
const FILES = ['destinations', 'activities', 'accommodation', 'contact', 'about', 'getting-here'];
const ARRAY_FILES = ['destinations', 'activities', 'accommodation'];

async function repoFallback(key) {
  // data/*.json ship with the function via included_files in netlify.toml.
  const candidates = [
    path.join(process.cwd(), 'data', key + '.json'),
    new URL('../../data/' + key + '.json', import.meta.url),
  ];
  for (const p of candidates) {
    try { return await readFile(p, 'utf8'); } catch { /* try next */ }
  }
  return null;
}

export default async (req) => {
  // Don't use context.params: when invoked through the /data/* rewrite the
  // original URL is preserved and params are empty. The last path segment
  // works for both /api/data/<key>.json and /data/<key>.json.
  const segs = new URL(req.url).pathname.split('/').filter(Boolean);
  const key = decodeURIComponent(segs[segs.length - 1] || '').replace(/\.json$/, '');
  if (!FILES.includes(key)) {
    return Response.json({ error: 'Unknown data file: ' + key }, { status: 404 });
  }

  const store = getStore('site-data');

  if (req.method === 'GET') {
    const blob = await store.get(key, { type: 'json' });
    if (blob !== null) {
      return Response.json(blob, { headers: { 'cache-control': 'no-store' } });
    }
    const raw = await repoFallback(key);
    if (raw !== null) {
      return new Response(raw, {
        headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
      });
    }
    return Response.json({ error: 'No content for ' + key }, { status: 404 });
  }

  if (req.method === 'PUT') {
    const pw = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    if (!process.env.ADMIN_PASSWORD) {
      return Response.json({ error: 'ADMIN_PASSWORD env var not set on the site' }, { status: 500 });
    }
    if (pw !== process.env.ADMIN_PASSWORD) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    let body;
    try { body = await req.json(); } catch {
      return Response.json({ error: 'Body is not valid JSON' }, { status: 400 });
    }
    const wantArray = ARRAY_FILES.includes(key);
    const isArray = Array.isArray(body);
    if (wantArray !== isArray || body === null || typeof body !== 'object') {
      return Response.json({ error: key + ' must be a JSON ' + (wantArray ? 'array' : 'object') }, { status: 400 });
    }
    await store.setJSON(key, body);
    return Response.json({ ok: true });
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
};

export const config = { path: '/api/data/:file' };
