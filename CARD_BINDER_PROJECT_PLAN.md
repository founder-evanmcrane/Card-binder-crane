# Card Binder — Full-Range Project Plan

**Plan version:** 1.0  
**Prepared:** 2026-11-21  
**Planning basis:** `card-binder-backup-2026-11-21.json`  
**Project mode:** Existing published HTML app; source file has not yet been supplied

## 1. Executive direction

Build Card Binder into a dependable, offline-first collection manager that makes it fast to capture cards, keep front/back images, maintain clean metadata, record defensible value history, and recover the collection without data loss.

The recommended near-term destination is a **stable personal collection app**, not a marketplace or multi-user platform. Keep the app simple and portable while establishing a clean data model, tested backup/restore, good search and editing, and a repeatable release process. Add cloud sync, accounts, sharing, or market integrations only after the offline version passes its reliability gates.

### North-star outcome

A collector can add or find a card in under 30 seconds, understand which records need attention, update value history with a source note, export the entire collection, restore it into a clean browser, and upgrade the app without losing or corrupting data.

### Success measures

| Area | Target |
|---|---|
| Data safety | 100% round-trip success for supported backup versions; failed imports make no changes |
| Reliability | No uncaught errors in the release test matrix; migration is idempotent |
| Speed | Search/filter feedback under 150 ms for 5,000 metadata-only records on a normal laptop |
| Capture | A basic card can be entered in under 30 seconds, excluding photography |
| Completeness | Dashboard reports missing values, acquisition details, images, and identity fields |
| Portability | Export is a documented, versioned file that restores into a clean browser |
| Accessibility | Keyboard-usable core flow, visible focus, labeled controls, adequate contrast |
| Release quality | Every release has a version, change log, backup reminder, test record, and rollback copy |

## 2. Evidence-based starting point

The supplied backup is readable and internally consistent at the structural level.

| Measure | Current state |
|---|---:|
| App / schema | `card-binder` / version `1` |
| Backup timestamp | 2026-11-21T05:26:06.941Z |
| File size | 3,424,280 bytes |
| Cards | 8 |
| Unique card IDs | 8 of 8 |
| Card type | 8 raw; 0 graded |
| Front images | 8 present; 8 valid base64 data URLs |
| Back images | 8 present; 8 valid base64 data URLs |
| Valued cards | 4 of 8 |
| Value-history rows | 4 |
| Sum of latest recorded values | $46.06 across the four valued cards only |
| Populated cost / acquired / notes | 0 / 0 / 0 |
| Year range | 1966–2025 |
| Distinct players / sets | 6 / 6 |

The $46.06 figure is **not** a collection value because half the cards do not have a value entry. Current value notes mention eBay sold averages, but the backup does not carry listing-level evidence, search criteria, condition normalization, or timestamps beyond the valuation date.

### What is already working

- Stable-looking UUIDs are present for every record.
- Every record has front and back image data.
- Value history is modeled as an array, which is a good base for trends.
- The export identifies the app, schema version, and saved timestamp.
- The collection includes modern and vintage cards, so testing already spans different eras and naming patterns.

### Gaps to address first

1. The published HTML/source artifact is missing, so UI and storage behavior cannot yet be audited.
2. Half the cards have no value entry.
3. Acquisition date, cost, notes, parallel, serial, grader, and grade are empty across the current collection.
4. Images account for most of the backup size; growth will become a storage and export concern.
5. Version 1 needs a documented contract, validation rules, and migration strategy before more features are added.
6. Restore behavior, duplicate handling, browser quota failure, and rollback are not evidenced by the backup alone.

## 3. Product boundaries

### In scope for the dependable personal-app release

- Add, view, edit, duplicate, and delete a card with confirmation/undo.
- Front/back image capture, rotation, cropping, compression, replacement, and removal.
- Search, sort, filters, saved views, and completeness indicators.
- Raw and graded cards with conditional fields.
- Acquisition data, notes, tags, location, quantity, status, and value history.
- Summary metrics that clearly distinguish valued, unvalued, cost, and estimated value.
- Versioned export, preflight validation, preview, merge/replace import, and restore verification.
- Offline operation, responsive layout, accessibility, and installable PWA behavior where the host permits it.
- Release checklist, smoke tests, migration tests, and rollback procedure.

### Defer until the core is proven

- Accounts and multi-user permissions.
- Cloud synchronization across devices.
- Automated scraping or use of unauthorized marketplace APIs.
- Buying/selling workflows, payments, taxes, or shipping.
- Public collection sharing.
- AI identification as an authoritative source.
- Native mobile apps.

These can become later tracks without forcing complexity into the reliable offline core.

## 4. Decisions to lock before implementation

| Decision | Recommended default | Why / trigger to revisit |
|---|---|---|
| Primary audience | One collector, one collection | Revisit when another user needs independent access |
| Storage | IndexedDB for records and image blobs | Better capacity and structure than localStorage |
| Distribution | Maintain modular source; publish a generated self-contained build | Preserves easy deployment without making one giant file the development source |
| Offline model | Local-first | Matches current backup style and reduces operational overhead |
| Import default | Preview, then merge; never silently replace | Minimizes destructive mistakes |
| Image format | JPEG/WebP with bounded dimensions and quality | Controls quota and backup growth |
| Currency | Store ISO currency per monetary entry; initially default to USD | Avoids ambiguous numeric values |
| Valuation | Manual entries with source, basis, date, and optional evidence URL | Transparent and maintainable |
| Duplicate identity | User-visible fingerprint plus explicit “allow duplicate” | Trading cards may legitimately have multiple copies |
| Cloud sync | Separate post-core architecture decision | Requires identity, conflict resolution, privacy, and backend operations |

## 5. Target architecture

### Recommended layers

1. **Domain model** — card fields, validation, fingerprints, value calculations, migrations.
2. **Persistence adapter** — IndexedDB transactions, quota handling, export/import, backup metadata.
3. **Application services** — create/update/delete, image processing, duplicate checks, search index, summaries.
4. **UI** — collection grid/list, detail/editor, filters, dashboard, settings, restore wizard.
5. **Build/publish** — source modules and tests compiled into a self-contained published HTML artifact.

Keep domain and migration logic independent of the DOM so it can be tested without a browser UI.

### Proposed schema version 2

```json
{
  "app": "card-binder",
  "schemaVersion": 2,
  "exportedAt": "2026-11-21T00:00:00.000Z",
  "appVersion": "0.2.0",
  "settings": {
    "defaultCurrency": "USD"
  },
  "cards": [
    {
      "id": "uuid",
      "kind": "raw",
      "identity": {
        "player": "Hank Aaron",
        "year": 1966,
        "set": "Topps",
        "cardNumber": "500",
        "variation": "",
        "parallel": "",
        "serialNumber": null
      },
      "condition": {
        "rawCondition": "",
        "grader": null,
        "grade": null,
        "certNumber": null
      },
      "ownership": {
        "quantity": 1,
        "acquiredDate": null,
        "acquiredFrom": "",
        "cost": null,
        "currency": "USD",
        "location": "",
        "status": "collection"
      },
      "tags": [],
      "notes": "",
      "images": {
        "front": {"blobKey": "...", "mime": "image/jpeg"},
        "back": {"blobKey": "...", "mime": "image/jpeg"}
      },
      "valuations": [
        {
          "id": "uuid",
          "asOfDate": "2026-11-21",
          "amount": 41.5,
          "currency": "USD",
          "source": "eBay sold",
          "basis": "average",
          "sampleSize": 2,
          "conditionBasis": "raw",
          "notes": ""
        }
      ],
      "createdAt": "ISO-8601",
      "updatedAt": "ISO-8601"
    }
  ]
}
```

### Schema rules

- Treat `id`, `createdAt`, and historical valuation IDs as immutable.
- Store years and amounts as typed values, not presentation strings.
- Preserve the printed card number as text because it may contain letters, hyphens, or leading zeroes.
- Make graded-only fields conditional on `kind = graded`.
- Store money as decimal-safe integer minor units or a decimal library representation internally; never rely on binary floating-point for totals.
- Separate image blobs from card metadata in runtime storage. The export may embed images for portability, but the live database should not duplicate base64 strings.
- Keep unknown imported fields in a migration report or extension bag until deliberately retired; do not silently discard them.

## 6. Delivery roadmap

Durations are focused working-time estimates, not calendar promises. Each phase ends with a usable checkpoint.

### Phase 0 — Source capture and safety baseline (1–2 days)

**Objective:** Make the current app reproducible before changing it.

- Obtain the exact published HTML and, if available, the editable source repository/build files.
- Save immutable copies of the HTML and JSON backup with hashes.
- Record app URL/host, browser support, current storage mechanism, storage key names, and publish steps.
- Run the app offline and in a clean browser profile.
- Test current add/edit/delete/export/import behavior and capture failures.
- Create a change ledger and versioning convention.

**Exit gate:** The current app can be reopened or republished, its data can be exported, and the baseline artifacts are recoverable.

### Phase 1 — Data contract, storage, and migration safety (2–4 days)

**Objective:** Prevent data loss and make future changes safe.

- Document version 1 exactly, including required/optional fields and image encoding.
- Implement validation for top-level metadata, card IDs, field types, dates, values, and image data URLs.
- Design schema version 2 and write a pure `v1 → v2` migration.
- Move live storage to IndexedDB using atomic transactions.
- Add automatic pre-migration backup and post-migration verification.
- Handle quota, partial write, corrupt record, unsupported version, and interrupted import cases.
- Add fixture-based tests using a redacted copy of the supplied backup.

**Exit gate:** A version 1 backup imports to version 2 without field or image loss; running migration twice causes no additional changes; failure leaves the original database untouched.

### Phase 2 — Collection core and fast editing (3–6 days)

**Objective:** Make the app useful for daily cataloging.

- Implement collection list/grid and card detail/editor.
- Add autosave status or an explicit save flow with dirty-state protection.
- Add search across player, set, year, number, notes, tags, location, and cert number.
- Add filters for raw/graded, valued/unvalued, missing images, year, player, set, status, and completeness.
- Add stable sorts for recently updated, player, year, set, number, cost, and latest value.
- Add duplicate detection using a normalized fingerprint while allowing intentional duplicate copies.
- Add delete confirmation and short-lived undo.
- Add completeness badges and a “Needs attention” saved view.

**Exit gate:** All current eight records can be found, edited, and re-exported; intentional duplicates remain possible; keyboard-only core operation succeeds.

### Phase 3 — Image workflow and storage control (3–6 days)

**Objective:** Preserve visual evidence without allowing images to break storage.

- Add file/camera input, preview, front/back assignment, rotate, crop, replace, and remove.
- Normalize orientation and strip unnecessary metadata.
- Resize to a configured maximum dimension and compress with a visible quality/size result.
- Create thumbnails for collection views; load full images only in detail view.
- Detect unsupported files, decode failures, oversized images, and quota risk before commit.
- Add orphan-blob cleanup and integrity checks.
- Show current storage usage and estimated export size.

**Exit gate:** Eight current image pairs round-trip successfully; a large-image stress fixture does not freeze the UI or silently exceed quota.

### Phase 4 — Ownership, valuation, and reporting (4–8 days)

**Objective:** Turn the catalog into a decision-support tool without overstating data quality.

- Add acquisition date/source, cost, currency, quantity, location, status, tags, and notes.
- Add raw-condition fields and graded-card grader/grade/cert fields.
- Expand valuation entries with source, basis, sample size, condition basis, date, notes, and optional evidence link.
- Show latest value and value history per card.
- Add summaries for card count, valued count, unvalued count, latest recorded value, known cost, and unrealized difference only when comparable data exists.
- Never label partial sums as total collection value.
- Add stale-value indicators based on a configurable age.
- Add CSV export/import for metadata-only bulk edits, with a preview and error report.

**Exit gate:** Every dashboard total is traceable to records and clearly states data coverage; malformed money or dates cannot enter storage.

### Phase 5 — Backup, restore, and portability (2–4 days)

**Objective:** Make recovery routine and trustworthy.

- Export deterministic, versioned JSON with app version, schema version, timestamp, counts, and optional checksum manifest.
- Offer full backup and metadata-only backup.
- Build a restore wizard: select → validate → summarize → choose merge/replace → confirm → execute → verify.
- Show adds, updates, duplicates, conflicts, skipped rows, warnings, and expected storage use before mutation.
- Implement collision rules: identical ID + identical content = skip; identical ID + changed content = conflict; different ID + same fingerprint = possible duplicate.
- For replace, create a pre-restore snapshot first.
- Add a printable recovery guide and periodic backup reminder.

**Exit gate:** A full export restores into a clean profile with matching record count, IDs, field values, images, and valuation histories.

### Phase 6 — Published-app hardening (3–6 days)

**Objective:** Make the deliverable safe and repeatable to publish.

- Add error boundary/global error handling with user-safe recovery guidance.
- Remove inline event handlers and unsafe dynamic HTML construction where feasible.
- Audit third-party scripts; pin versions and eliminate unnecessary remote dependencies.
- Add a restrictive Content Security Policy compatible with the chosen host.
- Ensure HTTPS hosting and no secrets, tokens, or private endpoints in client code.
- Add responsive mobile/desktop layouts, accessible dialogs, visible focus, and reduced-motion support.
- Add app/version display, release notes, and a backup reminder before schema-changing releases.
- Generate the published self-contained HTML from source and compare build hashes/artifact sizes.

**Exit gate:** Release candidate passes the browser/device, offline, accessibility, restore, and security smoke-test matrix and can be rolled back to the prior artifact.

### Phase 7 — Optional installability and device sync (decision gate; 1–3+ weeks)

**Objective:** Add convenience only if the stable local app no longer meets the need.

**PWA sub-track:** manifest, service worker, install prompts, versioned caches, update notification, and offline shell tests.

**Cloud-sync sub-track:** authentication, encrypted transport, backend database/object storage, conflict policy, deletion/tombstones, sync status, retry queue, audit trail, privacy notice, account deletion, monitoring, backups, and operating cost.

Do not implement sync by copying the entire JSON file between devices. Use record-level revisions and explicit conflict handling.

**Go/no-go questions:**

- Is multi-device access worth account and backend complexity?
- Should images sync at full resolution?
- What is the source of truth when two devices edit the same card?
- What recovery and privacy commitments can be maintained?

### Phase 8 — Scale and enhancement backlog (after core adoption)

- Binder/page/box location views.
- Want list and trade/sell status.
- Barcode or OCR-assisted entry with mandatory user confirmation.
- External catalog identifiers.
- Import adapters for other collection tools.
- User-defined fields and templates.
- Public read-only sharing with redaction controls.
- Authorized market-data integration with caching, provenance, and rate-limit handling.
- Analytics for collection mix, acquisition trends, and value coverage.

## 7. Prioritized backlog

### P0 — Protect the collection

1. Capture current HTML/source and hash baseline artifacts.
2. Document version 1 and implement strict import validation.
3. Add atomic IndexedDB persistence and safe migration.
4. Add full round-trip backup/restore tests.
5. Add quota and corrupt-backup handling.
6. Add release/rollback procedure.

### P1 — Make daily use excellent

1. Fast search, filters, and stable sorting.
2. Detail/editor with dirty-state protection.
3. Duplicate detection and intentional-copy handling.
4. Image compression, thumbnails, and integrity checks.
5. Acquisition, condition, grading, location, tags, and notes.
6. Complete valuation evidence and coverage-aware summaries.
7. Responsive, keyboard-accessible UX.

### P2 — Add leverage

1. Metadata CSV round trip.
2. PWA installability.
3. Binder/location visualization.
4. OCR-assisted draft entry.
5. External identifiers and authorized integrations.
6. Cloud sync after a separate architecture review.

## 8. Testing and release gates

### Automated tests

- **Unit:** normalization, fingerprinting, validation, totals, date handling, currency handling, value selection, migration.
- **Migration:** version 1 fixtures, missing optional fields, unknown fields, duplicate IDs, malformed images, unsupported versions, idempotence.
- **Persistence:** atomic writes, rollback, quota exception, transaction interruption, orphan cleanup.
- **Import/export:** deterministic output, checksum/count match, merge/replace semantics, conflict reports, metadata-only backup.
- **UI:** add/edit/delete/undo, filters, keyboard navigation, dialog focus, unsaved changes, image operations.

### Manual matrix

| Dimension | Minimum coverage |
|---|---|
| Browsers | Current Chrome/Edge; Safari/Firefox if targeted |
| Viewports | Small phone, large phone, tablet, laptop, wide desktop |
| Storage states | Empty, current 8-card backup, 500 records, 5,000 records, near quota |
| Connectivity | Online, offline at startup, connection lost during use |
| Imports | Valid v1, valid v2, corrupt JSON, wrong app, future version, duplicate-heavy file |
| Accessibility | Keyboard only, 200% zoom, screen-reader labels, contrast, reduced motion |

### Release checklist

- [ ] Current collection exported before release.
- [ ] Version and schema changes documented.
- [ ] Migrations tested against a copy of the real backup.
- [ ] Add/edit/delete/search/filter/image flows pass.
- [ ] Clean-profile restore produces matching counts and IDs.
- [ ] Offline startup and update behavior pass.
- [ ] Console has no uncaught errors in the supported browser matrix.
- [ ] No secrets or unapproved remote dependencies are present.
- [ ] Accessibility smoke checks pass.
- [ ] Previous published artifact and rollback instructions are retained.
- [ ] Release notes identify known limitations.

## 9. Risk register

| Risk | Likelihood / impact | Mitigation | Early warning |
|---|---|---|---|
| Browser quota exhausted by images | Medium / High | IndexedDB blobs, compression, usage meter, preflight | Writes slow/fail; export grows rapidly |
| Migration corrupts existing collection | Low / Critical | Immutable backup, pure migration, atomic swap, verification | Count/hash mismatch |
| Published-only edits become unmaintainable | High / Medium | Recover source; modular source of truth; generated artifact | Repeated direct edits to one large HTML file |
| Partial values mislead decisions | High / Medium | Coverage labels, valued/unvalued counts, no false “total” | Dashboard total omits records silently |
| Duplicate imports multiply cards | Medium / Medium | IDs, fingerprints, preview, explicit conflict rules | Count jumps after restore |
| Remote scripts break offline/privacy | Medium / Medium | Minimize/pin dependencies; CSP; offline test | App fails without network |
| Cloud sync creates conflicts/data exposure | Medium / High | Separate design gate, revision model, auth/privacy review | Last-write-wins data loss |
| Marketplace integration violates terms or becomes unstable | Medium / Medium | Authorized API only; provenance and fallback | Rate limits or markup changes |

## 10. Delivery cadence and governance

### Suggested sequence

- **Week 1:** Phase 0 and Phase 1 design; baseline, schema contract, migration tests.
- **Week 2:** Complete Phase 1; begin collection core.
- **Week 3:** Finish Phase 2; begin image workflow.
- **Week 4:** Finish Phase 3; release an internal alpha.
- **Weeks 5–6:** Ownership, valuation, reporting, and backup/restore.
- **Week 7:** Hardening, accessibility, security, and performance.
- **Week 8:** Stable personal-app release and decision on PWA/cloud track.

Adjust the sequence by gate completion, not by date pressure. A phase is not complete because its UI exists; its failure and recovery paths must also pass.

### Change-control record for every release

- Release version and date.
- User-visible changes.
- Schema changes and migration function.
- Tests run and outcomes.
- Backup used for migration verification.
- Published artifact hash and size.
- Known issues.
- Rollback artifact and steps.

## 11. Definition of done for the stable personal-app release

The release is done when:

1. The current version 1 backup migrates without losing eight records, 16 images, four valuation entries, or any current text fields.
2. Export from the new version restores into a clean browser with matching IDs and content.
3. Import errors are explained before any destructive change.
4. Search, filter, sort, add, edit, image, delete/undo, value, export, and restore flows pass on supported browsers and target viewports.
5. The dashboard distinguishes complete and incomplete monetary coverage.
6. The app starts and remains usable offline after installation/load as designed.
7. The core flow is keyboard accessible and usable at 200% zoom.
8. A new release can be built and published from maintained source, and the prior release can be restored.
9. No secret or private credential exists in the client artifact.
10. Documentation explains backup, restore, upgrade, limitations, and recovery.

## 12. Immediate next actions

1. Supply the currently published HTML file and the source repository/build folder if one exists.
2. Freeze the supplied JSON as the baseline fixture; work only on copies.
3. Record the current host URL, browser target, storage keys, and publish method.
4. Choose the personal-app boundary and defer cloud sync unless it is a current requirement.
5. Implement the version 1 validator and round-trip test before changing the UI.
6. Draft and test the version 1-to-version 2 migration.
7. Build the collection core and backup/restore before optional enhancements.

## 13. Planning review checkpoints

At the end of each phase, update this document with:

- Completed evidence and test results.
- Newly discovered constraints.
- Decisions made and why.
- Risks opened/closed.
- Backlog changes.
- Next phase scope and exit gate.

This keeps the plan connected to the real app rather than turning it into a one-time wish list.
