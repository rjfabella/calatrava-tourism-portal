# Calatrava Tourism Portal

Static website for the Municipality of Calatrava, Romblon, Philippines.
Plain HTML / CSS / JS — no build step, no backend, no dependencies.

## Pages

- `index.html` — homepage
- `destinations.html` — full destinations catalogue
- `accommodation.html` — places to stay
- `getting-here.html` — transport & travel info
- `admin.html` — staff content editor (see below)

Each public page renders from the matching JSON in `data/`, with a hardcoded fallback so the site still works if the fetch fails or the user is offline.

## Editing content

1. Open `admin.html` in a browser.
2. Sign in (password is in `admin.html` — share with staff out-of-band).
3. Edit any section. Changes save to **browser localStorage only** — they are not yet live.
4. Click **Export All** in the topbar (or per-section "Download" buttons) to download the updated JSON files.
5. Replace the matching files in `data/` and commit + push to publish.

The Export step is the publish step. Until you commit the downloaded JSON, edits exist only in your browser.

## Deployment

Serve the repo root as static files. Works on GitHub Pages, Netlify, Cloudflare Pages, or any static host. No server-side runtime needed.

## Security — required before going live

### Google Maps API key

The key in `data/contact.json` is **publicly visible** (it ships to every visitor's browser — this is unavoidable for client-side Maps). It MUST be restricted in Google Cloud Console or it can be abused and run up billing:

1. Go to **Google Cloud Console → APIs & Services → Credentials → [your key]**.
2. Under **Application restrictions**, choose **HTTP referrers** and add your production domain(s) — e.g. `https://calatrava.gov.ph/*`, `https://*.your-host.pages.dev/*`.
3. Under **API restrictions**, limit to **Maps JavaScript API** only.
4. Set a billing budget alert in **Billing → Budgets & alerts**.

If you ever commit a key without restrictions, **rotate it immediately** (delete + create new, update `data/contact.json`).

### Admin password

`admin.html` uses a client-side password check (`ADMIN_PW` constant). Anyone who views the page source can read it. This is fine for casual gating of the staff editor on a public host, **but**:

- Treat the admin URL as semi-private (don't link to it from indexable pages — the footer "Staff Portal" link is intentionally dim).
- Rotate the password if a staffer leaves.
- For a real auth boundary, put `admin.html` behind your host's basic-auth or a private route.

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
