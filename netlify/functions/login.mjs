// POST /api/login — verify the admin password server-side.
// The real write protection is the same check in data.mjs PUT; this endpoint
// just lets the admin UI confirm the password (and detect that a backend exists).
export default async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }
  if (!process.env.ADMIN_PASSWORD) {
    return Response.json({ error: 'ADMIN_PASSWORD env var not set on the site' }, { status: 500 });
  }
  let body;
  try { body = await req.json(); } catch { body = {}; }
  if (body.password === process.env.ADMIN_PASSWORD) {
    return Response.json({ ok: true });
  }
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
};

export const config = { path: '/api/login' };
