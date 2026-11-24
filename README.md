# Card Binder on Cloudflare

Serves the app from `public/index.html` and adds a small API (`src/worker.js`) so photo scanning and screenshot price checks work without claude.ai. Same Worker name (`crane-founder`), so your URL stays the same.

## Deploy (from your computer, Node 20+)
1. `npm install`, then `npx wrangler login`.
2. **Turn on Access first.** Dashboard: Workers & Pages > crane-founder > Settings > Domains & Routes > Enable Cloudflare Access (workers.dev), then Manage and allow only your email.
3. In Zero Trust, open the Access application for crane-founder and copy its Audience (AUD) tag. Your team domain looks like `https://yourteam.cloudflareaccess.com`. Put both in `wrangler.jsonc` under `vars` (`POLICY_AUD`, `TEAM_DOMAIN`). Until both are set, the API refuses every call.
4. `npx wrangler secret put ANTHROPIC_API_KEY` and paste the key at the prompt (never into chat or a file). Set a monthly spending limit in the Anthropic console.
5. `npm test`, then `npm run deploy`.

## Check on your phone
Open the workers.dev link and sign in. The "Add many cards from photos" box appears when the API is ready. If it does not, the API is locked: re-check steps 2 to 4. If scans fail later, reload the page (your Access sign-in may have expired).

## Move your cards
On the old claude.ai link: Back up and restore > Save backup. On the new link: Restore. Keep the old copy as a fallback.

## Notes
- Models default to claude-haiku-5-5 (first read) and claude-sonnet-5-5 (careful read). Override with `MODEL_QUICK` / `MODEL_DEEP` in `vars`.
- `vars` in `wrangler.jsonc` overwrite dashboard-set variables on each deploy. The API key stays a secret and is not affected.
- Not tested live: the real Anthropic call and the real Access login. Tests fake both.
