# Card Binder: Project Log and Plan

Last updated: Nov 24, 2026
Live app: https://card-binder.evanmcrane.workers.dev/
GitHub: https://github.com/founder-evanmcrane/Card-binder-crane
Historical source plan: "gameplan for baseball card app" (Gmail PDF, Nov 20, 2026)

---

## 1. Goal and premise

A personal app on my phone for my own baseball card collection. I take a picture of a card and the app records what it can on its own, keeps track of everything I own, lets me find a specific card quickly, and gives me a sense of what it is worth.

**Intentions**
- Type as little as possible. The photo should do the work.
- Personal use only. No selling, no listings, no public product.
- No fancy search or analytics. A visual collection I can scroll and search is enough.
- Runs on my phone and keeps my data on my device.

**Guiding principles (carried over from the gameplan)**
- Don't scrape websites. Use licensed data or official APIs when automating prices.
- Never claim to grade a raw card from a photo. Describe condition loosely if at all.
- Show a range and where it came from, not one unexplained number.
- Never silently mix a different parallel or grade into a valuation.
- Keep value history as snapshots. Don't overwrite old values.
- A person confirms identification when the app is unsure.

**Scope for now:** baseball cards, single cards, front and back photos, raw and graded.

---

## 2. Decisions made

| Decision | Choice | Why |
|---|---|---|
| App format | Phone-friendly web app, currently deployed as a Cloudflare Worker | Current live deployment is the Cloudflare app, not the earlier Claude Artifact |
| Git source of truth | GitHub repository `founder-evanmcrane/Card-binder-crane` | Intended home for recovered and maintained app source |
| Deployment target | Existing Cloudflare Worker named `card-binder` | Confirmed in Cloudflare dashboard on Nov 24, 2026 |
| Git deployment | Cloudflare Workers Builds connected to GitHub; production branch `main` | Connection established; builds deliberately disabled until source is recovered |
| Data handling | Current live app shows backup and restore; actual persistence/storage implementation still needs source inspection | Do not assume the older IndexedDB design is still used |

---

## 3. What has been done

### Historical standalone/Claude Artifact version (Nov 20–21, 2026)
The Gmail export `Gmail - Card Binder HTML.txt` contains a complete single-file HTML app from the earlier Claude Artifact stage. It uses IndexedDB and Claude Artifact-specific calls such as `claude.use('sample')` and `claude.use('downloads')`. This is useful historical reference material, but it is **not verified as the source of the current Cloudflare Worker v7 app** and should not be deployed as a replacement.

The historical version included:
- Add/edit cards with front and back photos.
- Collection search and grid/list views.
- Claude photo scanning and screenshot-based price checks.
- Value history, eBay search links, and backup/restore features.

### Current Cloudflare deployment (observed Nov 24, 2026)
The live URL is `https://card-binder.evanmcrane.workers.dev/`. The app displayed **Card Binder v7 · Nov 23, 2026 · Worker · data format v1** and included:
- Add card.
- Add many cards from photos.
- Two photos per card (front then back).
- One photo per card (front only).
- Uncertain reads marked for review.
- Daily scan usage indicator.
- Collection summary (card count, Paid, Value).
- Backup and restore.

This is a UI observation only. The underlying source, API implementation, storage bindings, and data persistence mechanism have not yet been recovered or verified.

### GitHub repository and Cloudflare Builds setup (Nov 24, 2026)
- GitHub repository: `founder-evanmcrane/Card-binder-crane`.
- The repository initially contained documentation/configuration but not the deployed application source.
- Confirmed missing from the repository tree: `src/worker.js`, `public/index.html`, and `test/worker.test.mjs`.
- Cloudflare dashboard confirmed the deployed Worker name is `card-binder`.
- GitHub repository is connected in Cloudflare Workers Builds, with production branch `main`.
- **Disable builds is ON**. Automatic builds/deployments have not been enabled because the application source is not yet in the repository.
- Updated `wrangler.jsonc` from Worker name `crane-founder` to `card-binder` in commit `00f5c754eeb53be8295282d1888583010f91669b`. This resolves the name mismatch shown by Cloudflare's dashboard warning.
- ChatGPT's current connected tools can read/write the GitHub repository but do not expose Cloudflare account/API access. Therefore the deployed Worker bundle/source cannot be fetched directly from Cloudflare in this session yet. No claim is made that source recovery is complete.

### Current recovery blocker
The old Gmail HTML is not the deployed v7 source. Reconstructing the current app from that file would be a rewrite/downgrade, not source recovery. The actual deployed Worker source must be retrieved from the Cloudflare account (for example, through an authenticated Cloudflare dashboard/API/MCP connection or the original development environment that deployed it). Once retrieved, commit the recovered source to this repository, inspect its bindings/secrets and storage model, add tests, and only then enable production builds.

---

## 4. Historical product requirements and principles

The original project was intended to be a personal phone-friendly baseball card collection:
- Type as little as possible; photos should do most of the work.
- Personal use only.
- Keep collection browsing simple.
- Do not scrape websites; use licensed data or official APIs for automated prices.
- Never claim to grade a raw card from a photo.
- Show valuation ranges and sources.
- Never silently mix parallels or grades.
- Preserve value history as snapshots.
- Ask the user to confirm uncertain identification.

Earlier decisions included local browser storage (IndexedDB), Claude image reading, screenshot-based sold-price estimation, and a visual card grid. These describe the historical standalone version and are not confirmed architectural decisions for the current Cloudflare app.

---

## 5. Known issues and limits

- The deployed Cloudflare v7 source is not yet present in GitHub.
- The current app's storage location, database/object-storage bindings, API routes, authentication, and secret configuration are not yet verified.
- The earlier standalone HTML is a historical version and depends on Claude Artifact APIs; it is not a drop-in Worker app.
- The project plan and Python/Streamlit build spec are planning/reference documents, not proof of the current implementation.
- Do not enable production builds until the recovered source and Wrangler configuration are checked.
- Do not overwrite the live Worker with the old HTML or a speculative reconstruction.

---

## 6. Next steps

1. Obtain authenticated read access to the Cloudflare account or the original development environment that deployed Worker `card-binder`.
2. Export/retrieve the actual deployed Worker source and any static assets. Preserve the current deployment as a rollback point.
3. Identify all bindings, secrets, routes, and data stores. Determine whether user collection data is stored in browser storage, D1, R2, KV, Durable Objects, or another service; do not guess.
4. Add the recovered source to this GitHub repository and verify it matches the live app's behavior.
5. Add tests and validate the build without promoting a new production deployment.
6. Enable Cloudflare preview builds, verify preview behavior, then enable production builds from `main`.
7. Keep this log, README, and project plan aligned with verified implementation details.

---

## 7. Resuming this project

Current priority is **recovering the actual source of the Cloudflare Worker v7 app**, not rebuilding the older Claude Artifact app. Keep Cloudflare builds disabled until the recovered source has been checked into GitHub and successfully validated.
