# Calatrava Tourism Portal

Website for the Municipality of Calatrava, Romblon, Philippines.
Plain HTML / CSS / JS — no build step. Runs on any static host; when deployed
on **Netlify**, two serverless functions give the admin editor instant
publishing (saves go straight to Netlify Blobs and are live immediately).

## Pages

- `index.html` — homepage
- `destinations.html` — full destinations catalogue
- `accommodation.html` — places to stay
- `getting-here.html` — transport & travel info
- `admin.html` — staff content editor (see below)

Each public page renders from the matching JSON in `data/`, with a hardcoded fallback so the site still works if the fetch fails or the user is offline.

## Editing content

1. Open `admin.html` in a browser and sign in.
2. Edit any section and hit Save.

**On Netlify (with the backend):** every Save publishes instantly — the
functions store the JSON in Netlify Blobs and all pages read through
`/api/data/*`, so visitors see the change on their next page load. The
password is checked server-side against the `ADMIN_PASSWORD` env var.

**On a plain static host (or offline):** edits save to browser localStorage
only. Drafts survive reloads; a blue banner lists sections with unpublished
drafts and offers Export All / Discard. Export the JSON, replace the matching
files in `data/`, and commit + push to publish.

Note: once the backend is in use, Netlify Blobs is the source of truth and the
committed `data/*.json` files are only the initial seed / fallback.

**Automatic git backup:** if a `GITHUB_TOKEN` env var is set on the Netlify
site, every publish also commits the JSON to this repo (`Admin publish: update
data/<file>.json`), giving a full edit history in git. Create a fine-grained
personal access token (GitHub → Settings → Developer settings → Fine-grained
tokens) scoped to **only this repo** with **Contents: read & write**, add it as
`GITHUB_TOKEN` in Netlify → Environment variables, and redeploy. Optional:
`GITHUB_REPO` (default `rjfabella/calatrava-tourism-portal`) and
`GITHUB_BRANCH` (default `main`). Without the token, publishes still work —
use **Export All** periodically and commit the files manually instead.

## Deployment

### Netlify (recommended — enables instant publishing)

1. [app.netlify.com](https://app.netlify.com) → Add new site → Import from GitHub → pick this repo.
   Build command: none. Publish directory: `.` (already set in `netlify.toml`).
2. Site configuration → Environment variables → add `ADMIN_PASSWORD` (this is
   the real admin password; the constant in `admin.html` is only the offline fallback).
3. Deploy. Functions and the `/data/*` rewrite are picked up from `netlify.toml` automatically.

Local development: `npm install`, then `npx netlify-cli dev` (reads
`ADMIN_PASSWORD` from a local `.env` file, serves functions + a sandboxed
local blob store on http://localhost:8888).

### Any other static host

Serve the repo root as static files (GitHub Pages, Cloudflare Pages, etc.).
Everything works, but admin publishing falls back to the manual
export-and-commit flow described above.

## Security — required before going live

### Google Maps API key

The key in `data/contact.json` is **publicly visible** (it ships to every visitor's browser — this is unavoidable for client-side Maps). It MUST be restricted in Google Cloud Console or it can be abused and run up billing:

1. Go to **Google Cloud Console → APIs & Services → Credentials → [your key]**.
2. Under **Application restrictions**, choose **HTTP referrers** and add your production domain(s) — e.g. `https://calatrava.gov.ph/*`, `https://*.your-host.pages.dev/*`.
3. Under **API restrictions**, limit to **Maps JavaScript API** only.
4. Set a billing budget alert in **Billing → Budgets & alerts**.

If you ever commit a key without restrictions, **rotate it immediately** (delete + create new, update `data/contact.json`).

### Admin password

On Netlify, the password is verified **server-side** (`ADMIN_PASSWORD` env
var) for both login and every save — this is a real write barrier. Pick a
strong value that differs from the fallback constant in `admin.html`.

The `FALLBACK_PW` constant in `admin.html` is only used when no backend is
reachable (plain static host / offline), where saves can't go further than the
editor's own browser anyway. Still:

- Treat the admin URL as semi-private (don't link to it from indexable pages — the footer "Staff Portal" link is intentionally dim).
- Rotate `ADMIN_PASSWORD` if a staffer leaves (Netlify → Environment variables, then redeploy).
- For extra hardening, put `admin.html` behind Netlify's password protection or basic-auth.

## Files

```
.
├── index.html
├── destinations.html
├── accommodation.html
├── getting-here.html
├── admin.html
├── data/
│   ├── about.json
│   ├── accommodation.json
│   ├── activities.json
│   ├── contact.json          # contains the Maps API key
│   ├── destinations.json
│   └── getting-here.json
└── assets/
    ├── destinations/         # full-size destination photos
    ├── thumbnails/           # thumbnail versions
    ├── logos/                # municipal + provincial seals
    └── video/                # homepage hero video
```
