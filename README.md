# Calatrava Tourism Portal

Website for the Municipality of Calatrava, Romblon, Philippines.
Plain HTML / CSS / JS — no build step. Hosted for free on **GitHub Pages**;
the admin editor publishes by committing straight to this repo via the GitHub
API, so the repo's `data/*.json` files are the single source of truth.
(A legacy Netlify Functions + Blobs backend is still in the repo and works if
the site is ever deployed there again — see Deployment.)

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

**On GitHub Pages (current hosting):** sign in once with a **fine-grained
GitHub personal access token** (GitHub → Settings → Developer settings →
Fine-grained tokens; scope it to **only this repo**, permission **Contents:
read & write**). The token is validated against the GitHub API, remembered in
that browser, and afterwards the regular admin password signs you in. Every
Save commits the JSON to `main` (`Admin publish: update data/<file>.json
[skip netlify]`) and GitHub Pages redeploys it — changes are live in about a
minute. The admin always loads the latest committed data through the API, so
staff never edit a stale CDN copy.

**On Netlify (legacy backend):** every Save publishes instantly — the
functions store the JSON in Netlify Blobs and all pages read through
`/api/data/*`. The password is checked server-side against the
`ADMIN_PASSWORD` env var, and if a `GITHUB_TOKEN` env var is set, every
publish is also mirrored as a commit to this repo.

**On a plain static host (or offline):** edits save to browser localStorage
only. Drafts survive reloads; a blue banner lists sections with unpublished
drafts and offers Export All / Discard. Export the JSON, replace the matching
files in `data/`, and commit + push to publish.

## Deployment

### GitHub Pages (current — free)

1. Repo → Settings → Pages → Source: **Deploy from a branch**, branch
   `main`, folder `/ (root)`. (Already enabled for this repo.)
2. The site serves at <https://rjfabella.github.io/calatrava-tourism-portal/>.
   No build step, no secrets — `data/*.json` is served as committed.
3. For admin publishing, each staff member needs the fine-grained PAT
   described above (one shared token also works; rotate it when staff change:
   GitHub → Settings → Developer settings → revoke + issue a new one).

Caveats: publishes take ~30–60 s to deploy plus up to ~10 min of CDN cache
for visitors, and the GitHub token is the real credential — the admin
password alone can't publish.

### Netlify (legacy — instant publishing, uses paid credits)

1. [app.netlify.com](https://app.netlify.com) → Add new site → Import from GitHub → pick this repo.
   Build command: none. Publish directory: `.` (already set in `netlify.toml`).
2. Site configuration → Environment variables → add `ADMIN_PASSWORD`, and
   optionally `GITHUB_TOKEN` / `GITHUB_REPO` / `GITHUB_BRANCH` for the git
   backup mirror.
3. Deploy. Functions and the `/data/*` rewrite are picked up from `netlify.toml` automatically.
   Note: on credit-based Netlify plans every production deploy costs credits;
   admin-publish backup commits carry `[skip netlify]` so they don't trigger
   redundant deploys (the data is served from Blobs there).

Local development: `npx http-server . -p 5173` for the static site, or
`npm install` + `npx netlify-cli dev` to exercise the legacy functions
backend.

## Security — required before going live

### Google Maps API key

The key in `data/contact.json` is **publicly visible** (it ships to every visitor's browser — this is unavoidable for client-side Maps). It MUST be restricted in Google Cloud Console or it can be abused and run up billing:

1. Go to **Google Cloud Console → APIs & Services → Credentials → [your key]**.
2. Under **Application restrictions**, choose **HTTP referrers** and add your production domain(s) — e.g. `https://calatrava.gov.ph/*`, `https://*.your-host.pages.dev/*`.
3. Under **API restrictions**, limit to **Maps JavaScript API** only.
4. Set a billing budget alert in **Billing → Budgets & alerts**.

If you ever commit a key without restrictions, **rotate it immediately** (delete + create new, update `data/contact.json`).

### Admin credentials

**On GitHub Pages, the GitHub token is the real write barrier** — publishing
is a commit, authorized by GitHub itself. The `FALLBACK_PW` constant in
`admin.html` is only a convenience gate: it unlocks a token already saved in
that browser, and on a machine without a saved token it can't publish
anything. Keep tokens fine-grained (this repo only, Contents read & write)
and revoke them on GitHub when a staffer leaves — that immediately cuts off
publishing from every device using that token.

**On Netlify (legacy)**, the password is verified server-side
(`ADMIN_PASSWORD` env var) for both login and every save.

- Treat the admin URL as semi-private (don't link to it from indexable pages — the footer "Staff Portal" link is intentionally dim).
- The saved token lives in the browser's localStorage on staff machines — use the Sign out button on shared computers.

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
