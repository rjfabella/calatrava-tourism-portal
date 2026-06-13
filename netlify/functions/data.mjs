// GET  /api/data/<key>.json  → current content (Netlify Blobs first, repo file as fallback)
// PUT  /api/data/<key>.json  → save new content to Netlify Blobs (requires ADMIN_PASSWORD)
//
// netlify.toml force-rewrites /data/*.json here, so the public pages and the
// admin read through this function without any change to their fetch URLs.
import { getStore } from '@netlify/blobs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

// Keep in sync with the `files` list in admin.html initApp().
// 'gallery' is read-only from the public site (no admin UI yet) but must be
// whitelisted here because the /data/* rewrite routes all reads through us.
const FILES = ['destinations', 'activities', 'accommodation', 'contact', 'about', 'getting-here', 'gallery', 'videos'];
const ARRAY_FILES = ['destinations', 'activities', 'accommodation', 'gallery', 'videos'];

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
    // Mirror the publish into git so GitHub stays the durable, versioned
    // backup. Blobs remain the live source of truth; a commit failure must
    // never fail the save.
    let github;
    try { github = await commitToGitHub(key, body); }
    catch (e) { github = 'failed: ' + (e.message || e); }
    return Response.json({ ok: true, github });
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
};

// Commit the published JSON to GitHub via the Contents API. Requires a
// fine-grained PAT (Contents: read/write on this repo) in the GITHUB_TOKEN
// env var; without it the backup is skipped and saves work as before.
async function commitToGitHub(key, body) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return 'skipped: GITHUB_TOKEN not set';
  const repo   = process.env.GITHUB_REPO   || 'rjfabella/calatrava-tourism-portal';
  const branch = process.env.GITHUB_BRANCH || 'main';
  const path   = 'data/' + key + '.json';
  const api    = `https://api.github.com/repos/${repo}/contents/${path}`;
  const headers = {
    'authorization': 'Bearer ' + token,
    'accept': 'application/vnd.github+json',
    'user-agent': 'calatrava-admin-publish',
  };
  const content = Buffer.from(JSON.stringify(body, null, 2) + '\n').toString('base64');

  // Need the current blob sha to update an existing file (404 = new file).
  let sha;
  const cur = await fetch(`${api}?ref=${branch}`, { headers });
  if (cur.ok) {
    const j = await cur.json();
    if ((j.content || '').replace(/\n/g, '') === content) return 'unchanged';
    sha = j.sha;
  } else if (cur.status !== 404) {
    return 'failed: read ' + cur.status;
  }

  const res = await fetch(api, {
    method: 'PUT',
    headers,
    // [skip netlify] stops these commits from triggering a production deploy —
    // the live site reads this data from Blobs, so the deploy would be
    // redundant and burns 15 credits per publish on credit-based plans.
    body: JSON.stringify({ message: `Admin publish: update ${path} [skip netlify]`, content, sha, branch }),
  });
  return res.ok ? 'committed' : 'failed: write ' + res.status;
}

export const config = { path: '/api/data/:file' };
