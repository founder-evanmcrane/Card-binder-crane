# Card Binder

**Live app:** https://card-binder.evanmcrane.workers.dev/  
**GitHub repository:** https://github.com/founder-evanmcrane/Card-binder-crane  
**Default branch:** `main`

## What this project is

Card Binder is a personal, phone-friendly baseball card collection app. Its purpose is to make it easy to add cards, keep front and back photos, identify and organize the collection, and track recorded values over time.

The project is for one collector's personal use. It is not intended to become a marketplace or public multi-user product.

### Guiding principles

- Keep card entry quick and minimize typing; photos should do as much of the work as possible.
- Preserve the collection and its images. Data safety takes priority over new features.
- Make uncertainty visible and let the owner confirm card identity or correct scanned fields.
- Never claim to numerically grade a raw card from a photograph.
- Show where a value came from and avoid presenting an unsupported number as definitive market value.
- Do not silently mix different parallels, variations, grades, or conditions in a valuation.
- Keep valuation history as dated snapshots rather than overwriting prior records.
- Do not scrape marketplaces or use unauthorized data sources. Any automated market-data integration must use an appropriately licensed provider or official API.

## Current deployed application

The currently deployed application is:

**https://card-binder.evanmcrane.workers.dev/**

The live page was inspected on November 24, 2026. Its visible interface identified itself as **Card Binder v7 · Nov 23, 2026 · Worker · data format v1**.

The inspected interface included:

- Add a card.
- Add many cards from photos.
- A two-photo workflow (front, then back) and a one-photo (front-only) workflow.
- A review/check path for uncertain reads.
- A daily scan-usage indicator.
- A collection summary showing card count, paid amount, and value.
- Backup and restore controls.

At the time of inspection, the app showed an empty collection state. That is only what the inspected browser session displayed; it does not establish whether another browser or device contains collection data.

The live URL is the current app reference. Older references to a Claude Artifact or a downloaded standalone HTML file describe earlier project stages and should not be treated as the current deployment.

## Repository status and important limitation

The GitHub repository currently contains project documentation and deployment-related configuration, including:

- `CARD_BINDER_PROJECT_PLAN.md`
- `card-binder-project-log.md`
- `BASEBALL_CARD_APP_BUILD_SPEC.md`
- `card-binder-worker-review.md`
- `package.json`
- `wrangler.jsonc`
- This README

**The application source has not yet been found in this repository.** The repository tree inspected on November 24, 2026 did not contain:

- `public/index.html`
- `src/worker.js`
- `test/worker.test.mjs`

However, `wrangler.jsonc` refers to `src/worker.js` and `./public`, while `package.json` defines test and deploy scripts that depend on the missing paths. As currently checked, this repository is therefore not a complete, reproducible application source tree and cannot be assumed to be ready to deploy.

The existence of a live Cloudflare Worker and a GitHub repository does **not** prove that the repository is connected to the live deployment, that it contains the code currently running, or that a change pushed here will update the live site.

**Do not deploy this repository or replace the live application from it until the actual deployed source has been obtained and verified.** First establish the source of truth, preserve a recoverable copy of the deployed app and collection data, and confirm the deployment pipeline.

## Architecture: what is known and what is not

Known from the current project state:

- The public app is served from a Cloudflare Workers URL.
- The live interface labels the deployment as a Worker.
- The repository includes a Wrangler configuration naming the Worker `crane-founder`.
- The repository README and configuration describe a proposed Worker API and static asset directory.

Not yet independently established:

- The exact source code currently deployed.
- Whether the current GitHub repository is connected to Cloudflare Workers Builds.
- Whether card records and photos are stored only in the browser, in a Cloudflare service, or through a combination of mechanisms.
- Whether the live app's scan and price-check backend is fully configured and operational.
- Whether the repository's Wrangler configuration matches the live Worker configuration.

Do not infer the live storage model or deployment wiring from the configuration files alone. Inspect the actual deployed source and Cloudflare settings before changing either.

## Safe development and release workflow

1. **Identify the source of truth.** Obtain the current deployed Worker source and frontend assets from Cloudflare or locate the repository that actually builds the live app.
2. **Preserve a baseline.** Save a recoverable copy of the deployed source and a current full collection backup before making changes.
3. **Compare before replacing.** Verify that the recovered source corresponds to the live v7 deployment and document any differences from the files in this repository.
4. **Connect source control to deployment deliberately.** Confirm the Cloudflare build/deploy relationship rather than assuming a GitHub push publishes the app.
5. **Make changes in version control.** Use small, reviewable changes and retain a known-good release for rollback.
6. **Test data safety.** Test upgrades and backup/restore with copies of real-format data. Never experiment against the only copy of the collection.
7. **Deploy only after approval and verification.** A repository change is not a live release until the deployment has completed and the live site has been smoke-tested.

Do not put API keys, access tokens, account credentials, or private user data in this repository. Store secrets in the appropriate hosting-provider secret manager.

## Project direction

The near-term priority is a dependable personal collection app, not a broad rewrite into a different platform. Preserve the working live app and its established workflows while first recovering and understanding its real source.

The broader project plan in `CARD_BINDER_PROJECT_PLAN.md` contains a proposed reliability-focused roadmap. It is planning guidance, not proof that its proposed architecture or every listed feature has been selected or implemented.

The separate `BASEBALL_CARD_APP_BUILD_SPEC.md` describes a Python/Streamlit application architecture. That is an alternate implementation specification and does not describe the currently observed Cloudflare Worker deployment. Do not use it as authority to replace the live app unless the owner explicitly chooses that direction.

## Immediate next milestone

**Recover and verify the source for the live Cloudflare app.**

Completion means:

- The current frontend and Worker source are available in the repository (or the correct source repository is identified).
- The source is compared against the deployed application.
- The app's actual persistence and backup/restore behavior are documented.
- The Cloudflare deployment relationship is understood.
- A safe rollback path exists.

Only then should a major revamp or feature implementation begin.
