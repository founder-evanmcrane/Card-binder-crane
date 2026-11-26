# Card Binder

A personal baseball card tracker. The browser app stores cards and photos in IndexedDB on that browser/device; the Cloudflare Worker serves the app and provides the scan and price-check API.

## Source layout

```
public/index.html   Phone-friendly app page (HTML, CSS, JavaScript)
src/worker.js       API routes, Cloudflare Access JWT check, and page response
wrangler.jsonc      Canonical Worker configuration
```

The page is imported by the Worker as a text module. The `Text` rule in `wrangler.jsonc` is required for that import. Keep the app page at `public/index.html` and the Worker entry point at `src/worker.js`.

## API

- `GET /api/status`: reports whether scanning is available and why it is not.
- `POST /api/scan`: reads one or two card photos and returns card fields as JSON.
- `POST /api/price`: reads marketplace screenshots and returns visible listings. Requires `ANTHROPIC_API_KEY`.

All API routes require a valid Cloudflare Access JWT. The ordinary page is served without an API login check.

## Required Cloudflare configuration

Set these in the Worker settings; do not commit their values:

- `TEAM_DOMAIN`: Cloudflare Access team domain, including `https://` and with no trailing slash.
- `POLICY_AUD`: Access application's audience (AUD) tag.
- `ANTHROPIC_API_KEY`: secret used for Anthropic requests. Price checks require this key; scans can use Workers AI instead if an `AI` binding is configured.

Optional:

- `AI`: Workers AI binding. If configured, scans use Workers AI unless `SCAN_BACKEND=anthropic`.
- `USAGE`: KV namespace binding for shared daily usage counts. Without it, the count is per Worker isolate and is not globally consistent.
- `DAILY_LIMIT`: daily API call limit; defaults to 150.
- `SCAN_BACKEND`: set to `anthropic` to force Anthropic for scans when both backends are configured.
- `AI_MODEL_QUICK`, `AI_MODEL_DEEP`, `MODEL_QUICK`, `MODEL_DEEP`: optional model overrides.

The Wrangler config sets `keep_vars: true` so dashboard-managed plain-text variables are not cleared by a deploy. Resource bindings such as Workers AI and KV must still be represented in Wrangler configuration before deploying if they are used. Do not deploy until the configured bindings have been checked against the Worker settings.

## Local setup and validation

1. Install Node.js (22 or newer).
2. Install dependencies: `npm install`.
3. Run the local build check: `npm run check`. This executes `wrangler deploy --dry-run`; it bundles the Worker without deploying it.
4. Run locally with `npx wrangler dev`.

The local check does not require Cloudflare login or API credentials. Authenticated API calls will not work locally unless valid Access headers and backend configuration are supplied.

## Deploy

After verifying Cloudflare Access, variables, secrets, and any optional bindings:

```sh
npx wrangler deploy
```

Cloudflare Workers Builds should use the repository's `main` branch and `npx wrangler deploy` as the deploy command. Keep automatic builds disabled until the dry-run build passes and the Cloudflare configuration has been reconciled.

## Data and backups

The collection is stored in the browser's IndexedDB, not in Cloudflare D1 or R2. It does not automatically sync between browsers/devices. Use the app's backup/export and restore features to move or preserve the collection. Clearing browser data can remove the local collection, so keep an external backup.

## Safety

- Never commit `.dev.vars`, `.env`, API keys, Access values, or personal backup JSON files.
- Do not use the app's price-check output as a guaranteed market value; verify exact parallel, serial numbering, grade, and shipping.
- Do not deploy a changed Worker until the local dry-run build succeeds.
