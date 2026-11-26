# Card Binder

A personal baseball card tracker. Cards and photos are stored in each browser (IndexedDB), not on the server. The Cloudflare Worker serves the page and provides the scan and price-check API, behind Cloudflare Access.

## Layout

```
public/index.html   The app page (HTML, CSS, JavaScript)
src/worker.js       API routes and Access token check; serves the page
wrangler.toml       Worker config
```

## API

- `GET /api/status`: whether scanning is available, and why not.
- `POST /api/scan`: reads one or two card photos, returns the card fields as JSON.
- `POST /api/price`: reads marketplace screenshots, returns matching listings. Requires `ANTHROPIC_API_KEY`.

Every route except `/api/status` requires a valid Cloudflare Access login.

## Setup

1. Install Wrangler and sign in: `npm install -g wrangler` then `wrangler login`.
2. In the Cloudflare dashboard, create a Zero Trust Access application for the Worker's hostname and note the team domain and the application audience (AUD) tag.
3. Set the non-secret values in `wrangler.toml` under `[vars]` (or in the dashboard): `TEAM_DOMAIN`, `POLICY_AUD`, optionally `DAILY_LIMIT`.
4. Choose a scan backend:
   - Workers AI: uncomment `[ai]` in `wrangler.toml`.
   - Anthropic: `wrangler secret put ANTHROPIC_API_KEY`. Price check needs this.
5. Optional: create a KV namespace for the daily limit and uncomment `[[kv_namespaces]]`.
6. Deploy: `wrangler deploy`.

## Local checks

```
wrangler dev
```

Access checks do not run locally without a valid token, so `/api/scan` will return 401 in local dev. Use the deployed Worker to test scanning.

## Safety

- Never commit `.dev.vars`, API keys, or any file containing the team domain or policy values if they are private to your account.
- Backups are the only copy of your collection outside the browser. The app's Save backup and Share buttons export everything, including photos.
- Restore only accepts files with `app: "card-binder"` and a supported version, and previews changes before writing.

## Version

The page footer shows the version string from `public/index.html` (`APP`). Keep that in sync with the Git tag when you release.
