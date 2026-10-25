# DC Propertys

Property listing site for plots and land in Braj (Mathura · Vrindavan · Govardhan).
Each listing shows the **khasra number, the khasra map, photos, and the exact location on satellite view**, with
one-tap WhatsApp/Call and links to verify the record on UP Bhulekh / Bhu-Naksha.

## Run locally

```bash
npm install
cp .env.example .env.local     # then edit: password, phone, WhatsApp number
npm run dev                    # http://localhost:3000
```

- Public site: `/`
- Admin: `/admin` (password = `ADMIN_PASSWORD` in `.env.local`)

## Adding a property (admin)

1. **Land record**: khasra no., village, tehsil.
2. **Price & size**: total price or rate per gaj/bigha. The site shows it as ₹45 Lakh / ₹1.2 Cr.
3. **Photos**: pick from your phone. They are compressed before upload, so it stays fast on mobile data.
4. **Khasra map**: download the plot map from [upbhunaksha.gov.in](https://upbhunaksha.gov.in/) (PDF or screenshot) and upload it.
5. **Location**: paste the Google Maps share link, tap **I'm here** while standing on the plot, or tap the
   satellite map. Switch to **Boundary** and tap the plot corners to outline it.
6. **Publish**: the listing appears on the site immediately. Mark it *Booked* / *Sold* from the dashboard later.

## How it works

| Piece | Choice | Why |
|---|---|---|
| App | Next.js 16 (App Router, server components) | Pages render on the server, so they load fast and are indexed by Google |
| Database | SQLite (`data/dc.sqlite`) | Zero setup and very fast for thousands of listings. Back up by copying one file |
| Images | Resized in the browser, then converted to WebP by `sharp` | ~6 MB phone photo → ~150 KB, cached forever |
| Maps | Leaflet + Esri satellite + OpenStreetMap | No Google API key or billing. "Google Maps" / "Directions" buttons open the Google Maps app |
| Auth | One admin password, signed HTTP-only cookie | Simple for a single owner |

### Why the khasra map is uploaded, not fetched live

UP Bhulekh and Bhu-Naksha have **no public API**. They sit behind captchas and session flows, so automatic
fetching would break often and may breach the portals' terms of use. The site instead:
- stores the khasra map the dealer downloads from Bhu-Naksha (one-time, ~30 seconds per plot), and
- shows buyers the exact khasra / village / tehsil with **Verify on UP Bhulekh / Bhu-Naksha** links.

## Deploy

The app needs a server with a persistent disk (for SQLite + photos). That rules out Vercel's serverless platform.
A small VPS (Hostinger / DigitalOcean / AWS Lightsail, ~₹500/month) works well:

```bash
npm ci && npm run build
DATA_DIR=/var/lib/dc-propertys PORT=3000 npm start   # run under pm2 or systemd, behind Nginx/Caddy with HTTPS
```

Set `NEXT_PUBLIC_SITE_URL` to the real domain. **Back up** `DATA_DIR` (the database and uploads) daily.

> HTTPS is required in production. The "I'm here" GPS button only works on HTTPS (or localhost).

## Notes

- On the external T7 (exFAT) drive, macOS creates `._*` files. Turbopack's disk cache is disabled automatically there
  (see `next.config.ts`). For daily development, an internal disk is faster.
- Map tiles: Esri imagery and OpenStreetMap are fine for normal traffic. At high traffic, switch to a paid tile
  provider or a Google Maps API key.
