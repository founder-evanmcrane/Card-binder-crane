# Baseball Card Valuation & Collection App — Autonomous Build Specification

> **Purpose:** This document is the complete execution contract for an implementation agent. It converts the product concept into fixed decisions, interfaces, data models, workflows, tasks, tests, and acceptance criteria so the agent can build the MVP without further architecture work.
>
> **Implementation mode:** Work autonomously. Follow the defaults in this file. Do not reopen architecture decisions unless a requirement is technically impossible, a paid credential is missing, or a provider license prohibits the requested use.

---

## 1. Agent operating instructions

### 1.1 Primary objective

Build a local-first Python application that lets a user:

1. Upload front and back images of a baseball card.
2. Enter or confirm the card's exact identity.
3. Retrieve or import comparable completed sales.
4. Calculate a transparent market-value range and confidence rating.
5. Estimate net proceeds after configurable selling costs.
6. Add the card to a personal collection.
7. Preserve acquisition data, images, comparable sales, and valuation history.
8. Export collection and valuation data to CSV.

### 1.2 Autonomy rules

The implementation agent must:

- Treat all decisions marked **LOCKED** as final.
- Use the fallback behavior documented here when an external API is unavailable.
- Keep the application runnable after every phase.
- Use deterministic calculations for valuation; do not ask a language model to invent a price.
- Write tests at the same time as each feature.
- Run formatting, linting, type checks, and tests before claiming a phase is complete.
- Never silently substitute a different parallel, variation, grader, grade, or serial-number denominator.
- Never present a raw-card condition estimate as an official numeric grade.
- Never scrape a website unless the user has documented permission and explicitly adds that source later.
- Preserve original uploaded images and generate separate analysis derivatives.
- Log provider requests without storing secrets.
- Prefer a working manual workflow over a fragile automated workflow.

The agent may ask for human input only when:

- A real provider integration requires an API key that is not present.
- The provider's current documentation is needed to map endpoints or authentication.
- A license or terms-of-use decision must be made by the owner.
- A destructive database migration would discard user data.

Missing provider credentials are **not** a blocker for the rest of the build. Continue with mock and CSV providers.

### 1.3 Definition of complete

The MVP is complete only when:

- The app starts from a clean checkout using the commands in this document.
- The core workflow works without paid APIs by using local/manual/mock providers.
- All required database tables and migrations exist.
- Uploaded images persist locally.
- A card can be added, edited, valued, viewed, and exported.
- Every valuation shows the comps used, excluded comps with reasons, formula version, range, and confidence.
- Automated tests pass.
- The README contains setup and operating instructions.

---

## 2. Product decisions

### 2.1 Locked MVP decisions

| Decision | Locked choice |
|---|---|
| Product type | Personal-use, local-first MVP |
| Sport | Baseball only |
| Inventory unit | Individual cards only; no packs, boxes, or lots as owned items |
| Card forms | Raw cards and graded slabs |
| Raw grading | No definitive numeric grade prediction |
| Required images | Front and back required for image-assisted identification; manual entry may proceed without images |
| Slab image | Optional label close-up |
| Identity confirmation | Human confirmation required before the card becomes canonical in the collection |
| UI | Streamlit multipage application |
| Language | Python 3.12 |
| Database | SQLite for MVP through SQLAlchemy 2.x and Alembic |
| Image storage | Local filesystem with database metadata |
| Data access | Provider adapters; no direct scraping |
| Offline/default providers | Manual entry, mock provider, and CSV import |
| Valuation center | Weighted median of valid completed sales |
| Valuation range | Weighted 25th–75th percentile |
| Confidence | Deterministic High/Medium/Low score with visible reasons |
| Collection history | Append-only valuation snapshots; never overwrite history |
| Export | CSV for cards, ownership, valuations, and comps |
| Production migration path | FastAPI + PostgreSQL + object storage, but not part of MVP |

### 2.2 Explicitly out of scope for MVP

Do not build these unless all MVP acceptance criteria are already complete:

- Public SaaS or multi-user authentication.
- Native iOS or Android apps.
- Automated listing creation on marketplaces.
- Automated buying, bidding, or selling.
- Website scraping.
- Definitive grading of raw cards.
- Automated counterfeit detection.
- Facial recognition.
- Non-baseball sports.
- Sealed products, boxes, packs, or multi-card owned lots.
- Tax reporting.
- Real-time price alerts.
- Custom-trained computer-vision models.
- Vector database or pgvector.
- Redis, background workers, Kubernetes, or cloud deployment.

---

## 3. User workflows

### 3.1 Add a card manually

1. Open **Add Card**.
2. Choose **Manual entry**.
3. Enter required identity fields.
4. Optionally upload images.
5. Enter ownership and acquisition details.
6. Review a normalized identity summary.
7. Confirm identity.
8. Save the card.
9. Redirect to the card detail page.

### 3.2 Add a card with image assistance

1. Open **Add Card**.
2. Upload front and back images.
3. Optionally upload a slab-label close-up and user hints.
4. Run image-quality checks.
5. Create normalized analysis copies while preserving originals.
6. Run configured identification providers.
7. Display up to three candidates, ordered by confidence.
8. Highlight material differences among candidates.
9. Require the user to select or edit a candidate.
10. Mark the chosen identity as user-confirmed.
11. Save the card and all identification-attempt metadata.

### 3.3 Value a card

1. Open a confirmed card.
2. Choose **Refresh valuation**.
3. Select a lookback window; default to 180 days.
4. Retrieve completed sales from enabled providers and/or imported CSV data.
5. Normalize and deduplicate sales.
6. Evaluate every sale against the card identity.
7. Show valid and excluded sales; every exclusion must have a reason.
8. Calculate weighted median, weighted quartiles, recent trend, liquidity, and confidence.
9. Calculate estimated net proceeds using a selected fee profile.
10. Save an immutable valuation snapshot.

### 3.4 Manage the collection

The user can:

- Search, sort, and filter owned cards.
- Open a card detail page.
- Edit ownership metadata without changing valuation history.
- Change status among `owned`, `listed`, `sold`, `traded`, and `submitted_for_grading`.
- Add acquisition and sale transactions.
- View cost basis, latest estimated value, unrealized gain/loss, and stale valuation state.
- Export collection data.

---

## 4. Required fields and business rules

### 4.1 Canonical card identity

A canonical card record supports:

- `sport` — always `baseball` in MVP.
- `year` — four-digit integer.
- `manufacturer` — e.g. Topps, Bowman, Panini.
- `brand` — optional brand family.
- `set_name` — required.
- `player_name` — required.
- `card_number` — required string; preserve prefixes and leading zeroes.
- `parallel_name` — nullable; normalize base cards to `Base` in presentation.
- `variation_name` — nullable.
- `serial_number_numerator` — nullable positive integer.
- `serial_number_denominator` — nullable positive integer.
- `is_rookie` — boolean.
- `is_autograph` — boolean.
- `is_relic` — boolean.
- `is_reprint` — boolean.
- `raw_or_graded` — enum: `raw`, `graded`.
- `grader` — nullable for raw; required for graded.
- `grade` — nullable for raw; required string for graded because labels may contain values such as `9`, `9.5`, or `Authentic`.
- `certificate_number` — nullable.
- `identity_notes` — nullable.

### 4.2 Identity validation

- A graded card must have `grader` and `grade`.
- A raw card must not require `grader`, `grade`, or `certificate_number`.
- If either serial-number part is present, both parts are required.
- Serial numerator must be less than or equal to denominator.
- `year`, `player_name`, `set_name`, and `card_number` are required before confirmation.
- Changing a confirmed identity creates an audit event and marks the current valuation stale.
- Identity equality requires exact agreement on material attributes after normalization.

### 4.3 Material identity attributes

The following attributes are material for comp matching:

- Year.
- Manufacturer/brand and set.
- Player.
- Card number.
- Parallel.
- Variation.
- Autograph status.
- Relic status.
- Reprint status.
- Serial-number denominator.
- Raw versus graded.
- Grader and exact grade when graded.

Differences in a material attribute must either exclude the comp or be explicitly classified as an inference. Inference comps must never be mixed into the primary estimate.

### 4.4 Ownership record

Store:

- Quantity; default `1`.
- Acquisition date.
- Acquisition price.
- Acquisition tax.
- Acquisition shipping.
- Seller/source.
- Storage location.
- Notes.
- Status.
- Listed marketplace and listed price when applicable.

Cost basis is:

```text
cost_basis = acquisition_price + acquisition_tax + acquisition_shipping + other_acquisition_costs
```

---

## 5. Technical architecture

### 5.1 MVP component diagram

```text
Streamlit multipage UI
        |
        v
Application services
  +-- Card service
  +-- Image service
  +-- Identification service
  +-- Market data service
  +-- Valuation engine
  +-- Collection service
  +-- Import/export service
        |
        +----------------------+
        |                      |
        v                      v
SQLAlchemy repositories     Provider adapters
        |                   +-- Manual
        v                   +-- Mock
SQLite + Alembic            +-- CSV
                            +-- Optional licensed APIs

Original and derived images -> local data/images directory
```

### 5.2 Separation rules

- Streamlit pages call application services, not SQLAlchemy sessions directly.
- Application services depend on repository protocols and provider protocols.
- Provider-specific payloads are converted immediately into internal Pydantic models.
- The valuation engine accepts normalized internal models only.
- No provider client imports are allowed in the valuation engine.
- No Streamlit imports are allowed in domain, provider, repository, or valuation modules.
- Database models and Pydantic/domain models remain separate.
- Secrets are read from environment variables or `.streamlit/secrets.toml`, never committed.

---

## 6. Repository structure

Create this structure unless the existing repository already has an equivalent convention:

```text
baseball-card-app/
├── README.md
├── BUILD_SPEC.md
├── LICENSE
├── pyproject.toml
├── .env.example
├── .gitignore
├── alembic.ini
├── migrations/
│   ├── env.py
│   └── versions/
├── src/
│   └── cardvalue/
│       ├── __init__.py
│       ├── config.py
│       ├── logging_config.py
│       ├── enums.py
│       ├── errors.py
│       ├── models/
│       │   ├── domain.py
│       │   ├── api.py
│       │   └── valuation.py
│       ├── db/
│       │   ├── base.py
│       │   ├── session.py
│       │   ├── models.py
│       │   └── repositories.py
│       ├── services/
│       │   ├── cards.py
│       │   ├── collection.py
│       │   ├── images.py
│       │   ├── identification.py
│       │   ├── market_data.py
│       │   ├── valuation.py
│       │   └── export.py
│       ├── providers/
│       │   ├── base.py
│       │   ├── registry.py
│       │   ├── manual.py
│       │   ├── mock.py
│       │   ├── csv_provider.py
│       │   ├── card_hedge.py
│       │   ├── the_card_api.py
│       │   └── ebay_browse.py
│       ├── image_processing/
│       │   ├── quality.py
│       │   ├── transform.py
│       │   └── ocr.py
│       ├── valuation/
│       │   ├── matching.py
│       │   ├── deduplication.py
│       │   ├── outliers.py
│       │   ├── weights.py
│       │   ├── statistics.py
│       │   └── confidence.py
│       └── ui/
│           ├── app.py
│           ├── state.py
│           ├── components.py
│           └── pages/
│               ├── dashboard.py
│               ├── add_card.py
│               ├── collection.py
│               ├── card_detail.py
│               ├── imports_exports.py
│               └── settings.py
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── ui/
│   └── fixtures/
├── scripts/
│   ├── seed_demo.py
│   ├── import_comps.py
│   └── export_collection.py
└── data/
    ├── .gitkeep
    ├── images/
    ├── exports/
    └── imports/
```

The three real-provider modules may initially contain disabled adapters with clear setup documentation. They must not pretend to be integrated if current credentials and endpoint contracts are unavailable.

---

## 7. Dependency and tooling requirements

### 7.1 Runtime dependencies

Use compatible current stable releases and pin them in `pyproject.toml` after the first successful install:

- `streamlit`
- `sqlalchemy`
- `alembic`
- `pydantic`
- `pydantic-settings`
- `httpx`
- `tenacity`
- `pillow`
- `opencv-python-headless`
- `numpy`
- `pandas`
- `python-dateutil`
- `rapidfuzz`

OCR should be optional:

- Preferred optional extra: `paddleocr` and its compatible runtime.
- The app must still work when the OCR extra is not installed.

### 7.2 Development dependencies

- `pytest`
- `pytest-cov`
- `pytest-mock`
- `freezegun`
- `ruff`
- `mypy`
- `pre-commit`
- `types-python-dateutil`

### 7.3 Required commands

The completed README must support:

```bash
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e ".[dev]"
cp .env.example .env
alembic upgrade head
python scripts/seed_demo.py
streamlit run src/cardvalue/ui/app.py
```

Quality checks:

```bash
ruff format --check .
ruff check .
mypy src
pytest -q --cov=cardvalue --cov-report=term-missing
```

---

## 8. Configuration contract

Create a typed settings class. Support these environment variables:

```dotenv
APP_ENV=development
APP_NAME=Baseball Card Value
DATABASE_URL=sqlite:///./data/cardvalue.db
IMAGE_STORAGE_ROOT=./data/images
EXPORT_ROOT=./data/exports
IMPORT_ROOT=./data/imports
LOG_LEVEL=INFO
DEFAULT_CURRENCY=USD
DEFAULT_LOOKBACK_DAYS=180
VALUATION_STALE_AFTER_DAYS=30
RECENCY_DECAY_DAYS=90
AUTO_CONFIRM_IDENTITY_THRESHOLD=0.95
MAX_UPLOAD_MB=20
ENABLED_PROVIDERS=manual,mock,csv

# Optional real-provider credentials. Leave blank by default.
CARD_HEDGE_API_KEY=
THE_CARD_API_KEY=
EBAY_CLIENT_ID=
EBAY_CLIENT_SECRET=
EBAY_MARKETPLACE_ID=EBAY_US
```

Rules:

- `.env` and `.streamlit/secrets.toml` must be ignored by Git.
- `.env.example` contains names and safe defaults only.
- The app shows a provider as enabled only when its configuration validates.
- Startup must not fail merely because optional provider keys are absent.

---

## 9. Database schema

Use UUID strings for primary keys unless SQLite support or existing conventions strongly favor another stable key. Store timestamps in UTC. Store money as integer minor units plus a three-letter currency code; do not store money as binary floats.

### 9.1 `users`

For future compatibility. Seed one local user.

| Column | Type | Rules |
|---|---|---|
| id | UUID string | PK |
| display_name | string | required |
| email | string | nullable |
| created_at | datetime | required |
| updated_at | datetime | required |

### 9.2 `canonical_cards`

| Column | Type | Rules |
|---|---|---|
| id | UUID string | PK |
| sport | string | default `baseball` |
| year | integer | required |
| manufacturer | string | required |
| brand | string | nullable |
| set_name | string | required |
| player_name | string | required |
| card_number | string | required |
| parallel_name | string | nullable |
| variation_name | string | nullable |
| serial_number_numerator | integer | nullable |
| serial_number_denominator | integer | nullable |
| is_rookie | boolean | default false |
| is_autograph | boolean | default false |
| is_relic | boolean | default false |
| is_reprint | boolean | default false |
| raw_or_graded | enum string | required |
| grader | string | nullable |
| grade | string | nullable |
| certificate_number | string | nullable |
| identity_key | string | required, indexed |
| identity_notes | text | nullable |
| created_at | datetime | required |
| updated_at | datetime | required |

`identity_key` is a normalized, versioned hash or joined key generated from all material identity attributes. Do not use it as the primary key.

### 9.3 `owned_cards`

| Column | Type | Rules |
|---|---|---|
| id | UUID string | PK |
| user_id | FK | required |
| canonical_card_id | FK | required |
| quantity | integer | default 1, positive |
| status | enum string | required |
| storage_location | string | nullable |
| notes | text | nullable |
| identity_confirmed | boolean | default false |
| identity_confirmed_at | datetime | nullable |
| listed_marketplace | string | nullable |
| listed_price_minor | integer | nullable |
| listed_currency | string | nullable |
| created_at | datetime | required |
| updated_at | datetime | required |

### 9.4 `card_images`

| Column | Type | Rules |
|---|---|---|
| id | UUID string | PK |
| owned_card_id | FK | nullable during identification workflow |
| identification_attempt_id | FK | nullable |
| image_role | enum | `front`, `back`, `slab_label`, `corner`, `surface` |
| original_path | string | required |
| analysis_path | string | nullable |
| sha256 | string | required, indexed |
| mime_type | string | required |
| width | integer | required |
| height | integer | required |
| file_size_bytes | integer | required |
| quality_json | JSON/text | required |
| created_at | datetime | required |

### 9.5 `identification_attempts`

| Column | Type | Rules |
|---|---|---|
| id | UUID string | PK |
| user_id | FK | required |
| status | enum | `created`, `processing`, `needs_confirmation`, `confirmed`, `failed` |
| user_hints_json | JSON/text | nullable |
| extracted_text | text | nullable |
| candidates_json | JSON/text | required |
| selected_candidate_json | JSON/text | nullable |
| selected_provider | string | nullable |
| top_confidence | decimal | nullable |
| error_message | text | nullable |
| created_at | datetime | required |
| completed_at | datetime | nullable |

### 9.6 `market_sources`

| Column | Type | Rules |
|---|---|---|
| id | UUID string | PK |
| source_code | string | unique |
| display_name | string | required |
| source_type | enum | `manual`, `mock`, `csv`, `api` |
| enabled | boolean | required |
| terms_url | string | nullable |
| created_at | datetime | required |
| updated_at | datetime | required |

### 9.7 `sale_comps`

| Column | Type | Rules |
|---|---|---|
| id | UUID string | PK |
| canonical_card_id | FK | required |
| market_source_id | FK | required |
| provider_record_id | string | nullable |
| marketplace | string | required |
| title | text | required |
| sold_at | datetime | required |
| sale_price_minor | integer | required |
| shipping_price_minor | integer | nullable |
| currency | string | required |
| normalized_total_minor | integer | required |
| sale_url | text | nullable |
| image_url | text | nullable |
| raw_payload_json | JSON/text | nullable; redact secrets and unnecessary personal data |
| normalized_identity_json | JSON/text | required |
| match_score | decimal | required |
| match_status | enum | `valid`, `excluded`, `inference` |
| exclusion_reasons_json | JSON/text | required |
| dedupe_key | string | required, indexed |
| retrieved_at | datetime | required |
| created_at | datetime | required |

### 9.8 `active_listings`

Store active listings separately so they cannot be accidentally included in completed-sale valuation.

| Column | Type | Rules |
|---|---|---|
| id | UUID string | PK |
| canonical_card_id | FK | required |
| market_source_id | FK | required |
| provider_record_id | string | nullable |
| marketplace | string | required |
| title | text | required |
| asking_price_minor | integer | required |
| shipping_price_minor | integer | nullable |
| currency | string | required |
| listing_url | text | nullable |
| listed_at | datetime | nullable |
| retrieved_at | datetime | required |
| is_active | boolean | required |

### 9.9 `valuation_snapshots`

| Column | Type | Rules |
|---|---|---|
| id | UUID string | PK |
| owned_card_id | FK | required |
| formula_version | string | required |
| calculated_at | datetime | required |
| currency | string | required |
| estimate_minor | integer | nullable |
| low_minor | integer | nullable |
| high_minor | integer | nullable |
| confidence_score | decimal | required |
| confidence_label | enum | `high`, `medium`, `low`, `insufficient_data` |
| confidence_reasons_json | JSON/text | required |
| valid_comp_count | integer | required |
| excluded_comp_count | integer | required |
| oldest_comp_at | datetime | nullable |
| newest_comp_at | datetime | nullable |
| recent_trend_percent | decimal | nullable |
| average_days_between_sales | decimal | nullable |
| valuation_inputs_json | JSON/text | required |
| included_comp_ids_json | JSON/text | required |
| excluded_comp_ids_json | JSON/text | required |
| fee_profile_json | JSON/text | nullable |
| net_proceeds_minor | integer | nullable |

Valuation snapshots are append-only. Corrections create a new snapshot.

### 9.10 `acquisition_transactions`

| Column | Type | Rules |
|---|---|---|
| id | UUID string | PK |
| owned_card_id | FK | required |
| transaction_date | date | required |
| purchase_price_minor | integer | required |
| tax_minor | integer | default 0 |
| shipping_minor | integer | default 0 |
| other_cost_minor | integer | default 0 |
| currency | string | required |
| seller_or_source | string | nullable |
| notes | text | nullable |
| created_at | datetime | required |

### 9.11 `sale_transactions`

| Column | Type | Rules |
|---|---|---|
| id | UUID string | PK |
| owned_card_id | FK | required |
| transaction_date | date | required |
| gross_sale_minor | integer | required |
| marketplace_fee_minor | integer | default 0 |
| payment_fee_minor | integer | default 0 |
| shipping_cost_minor | integer | default 0 |
| insurance_minor | integer | default 0 |
| promotion_minor | integer | default 0 |
| other_cost_minor | integer | default 0 |
| currency | string | required |
| marketplace | string | nullable |
| notes | text | nullable |
| created_at | datetime | required |

### 9.12 `api_request_audit`

| Column | Type | Rules |
|---|---|---|
| id | UUID string | PK |
| provider_code | string | required |
| operation | string | required |
| request_fingerprint | string | required |
| response_status | integer | nullable |
| duration_ms | integer | nullable |
| result_count | integer | nullable |
| cache_hit | boolean | default false |
| error_type | string | nullable |
| created_at | datetime | required |

Never store authorization headers, API keys, full certificates, or payment data in this table.

---

## 10. Internal models and provider contracts

### 10.1 Identification candidate

```python
class IdentificationCandidate(BaseModel):
    year: int | None
    manufacturer: str | None
    brand: str | None
    set_name: str | None
    player_name: str | None
    card_number: str | None
    parallel_name: str | None
    variation_name: str | None
    serial_number_numerator: int | None
    serial_number_denominator: int | None
    is_rookie: bool | None
    is_autograph: bool | None
    is_relic: bool | None
    is_reprint: bool | None
    raw_or_graded: Literal["raw", "graded"] | None
    grader: str | None
    grade: str | None
    certificate_number: str | None
    provider_code: str
    provider_candidate_id: str | None
    confidence: float
    evidence: list[str]
    warnings: list[str]
```

### 10.2 Normalized completed sale

```python
class CompletedSale(BaseModel):
    provider_code: str
    provider_record_id: str | None
    marketplace: str
    title: str
    sold_at: datetime
    sale_price_minor: int
    shipping_price_minor: int | None
    currency: str
    sale_url: str | None
    image_url: str | None
    parsed_identity: CardIdentity
    source_reliability: float
    raw_payload: dict[str, Any] | None
```

### 10.3 Market provider protocol

```python
class MarketSource(Protocol):
    code: str
    display_name: str

    def is_configured(self) -> bool: ...

    def search_catalog(
        self,
        query: CardSearchQuery,
    ) -> list[IdentificationCandidate]: ...

    def identify_image(
        self,
        images: list[ImageInput],
        hints: CardSearchQuery | None = None,
    ) -> list[IdentificationCandidate]: ...

    def get_completed_sales(
        self,
        identity: CardIdentity,
        start: datetime,
        end: datetime,
    ) -> list[CompletedSale]: ...

    def get_active_listings(
        self,
        identity: CardIdentity,
    ) -> list[ActiveListing]: ...
```

A provider may raise a typed `UnsupportedOperationError` for methods it does not support. The registry catches provider failures, records them, and continues with other enabled providers.

### 10.4 Required provider implementations

#### Manual provider

- Supports manual candidate creation.
- Supports adding a completed sale through a form.
- Never makes network calls.

#### Mock provider

- Returns deterministic fixture data.
- Supports happy paths, no-results, sparse-data, duplicates, outliers, wrong parallel, and provider-error scenarios.
- Powers demos and automated tests.

#### CSV provider

- Imports completed sales from a documented template.
- Validates every row.
- Shows row-level errors without dropping valid rows.
- Stores original row numbers for traceability.

Required CSV columns:

```text
provider_record_id,marketplace,title,sold_at,sale_price,shipping_price,currency,
year,manufacturer,brand,set_name,player_name,card_number,parallel_name,
variation_name,serial_number_denominator,is_autograph,is_relic,is_reprint,
raw_or_graded,grader,grade,sale_url
```

#### Real-provider adapters

Create adapter modules and setup documentation for:

- Card Hedge or another licensed image/catalog/comps provider.
- The Card API or another licensed completed-sales provider.
- An official active-listings API such as eBay Browse.

Implementation rules:

- Use only current official documentation supplied or retrieved during implementation.
- Put provider-specific field mapping in that provider module.
- Add timeouts, bounded retries, pagination, rate-limit handling, and response validation.
- Add contract tests using recorded redacted fixtures, not live API calls in CI.
- Do not assert a real integration is complete until at least one authenticated smoke test succeeds.

---

## 11. Image handling

### 11.1 Upload rules

Accept JPEG, PNG, and WebP. Reject other formats with a clear message. Enforce `MAX_UPLOAD_MB` per file.

For every upload:

1. Read bytes once.
2. Calculate SHA-256.
3. Validate the file with Pillow.
4. Remove path information supplied by the client.
5. Generate a UUID filename while preserving a safe extension.
6. Save the original under a date- or card-scoped directory.
7. Read EXIF orientation and rotate correctly.
8. Record dimensions, MIME type, size, and hash.
9. Generate a separate analysis image; never overwrite the original.

### 11.2 Analysis derivative

- Correct orientation.
- Convert to RGB.
- Resize so the longest side is at most 2000 pixels.
- Preserve aspect ratio.
- Save as high-quality JPEG or PNG.
- Optionally detect the largest card-like quadrilateral and apply perspective correction.
- If perspective detection is uncertain, retain the uncropped normalized image.

### 11.3 Quality checks

Return independent flags and measurements:

- `too_small`: shortest side below 600 pixels.
- `likely_blurry`: variance of Laplacian below a configurable threshold.
- `likely_overexposed`: excessive percentage of near-white pixels.
- `likely_underexposed`: excessive percentage of near-black pixels.
- `possible_glare`: large high-brightness low-saturation regions.
- `card_too_small`: detected card occupies less than 35% of image area.
- `multiple_cards_possible`: more than one card-like contour.
- `severe_perspective`: corner-angle or aspect distortion exceeds threshold.

Warnings do not block manual entry. Missing front or back blocks image-assisted identification but not manual entry.

### 11.4 OCR behavior

- OCR is an assistive signal only.
- If PaddleOCR is installed, run it on analysis derivatives.
- If OCR is unavailable or fails, continue without it.
- Store extracted text and confidence, but do not treat OCR as authoritative.
- Search for likely card number, year, grader, grade, certificate, serial pattern, and player-name tokens.

---

## 12. Identification and confirmation

### 12.1 Candidate aggregation

1. Collect candidates from all enabled identification/catalog providers.
2. Normalize text for comparison while preserving original display values.
3. Merge candidates that share the same material identity.
4. Retain all provider evidence.
5. Calculate an aggregate confidence between 0 and 1.
6. Return the top three distinct identities.

Suggested initial aggregate score:

```text
aggregate_confidence = clamp(
    0.45 * provider_confidence
  + 0.20 * exact_card_number_match
  + 0.15 * player_name_match
  + 0.10 * year_set_match
  + 0.10 * parallel_serial_consistency,
  0,
  1
)
```

If more than one provider returns the same identity, use the highest provider confidence and add a consensus bonus of at most `0.05`; cap at `1.0`.

### 12.2 Candidate difference display

The confirmation screen must visibly compare:

- Base versus named parallel.
- Serial-number denominator.
- Variation or image variation.
- Rookie designation.
- Autograph and relic flags.
- Raw versus graded.
- Grader and exact grade.
- Certificate number.

### 12.3 Confirmation rule

Even if a candidate exceeds `AUTO_CONFIRM_IDENTITY_THRESHOLD`, the MVP still requires a user confirmation click. The threshold only controls whether the candidate is preselected.

On confirmation:

- Validate all required fields.
- Generate `identity_key`.
- Create or reuse a matching canonical card.
- Create the owned-card record.
- Link images and identification attempt.
- Store the user's final edits.
- Mark identity as confirmed.

---

## 13. Comparable-sale normalization

### 13.1 Currency

The MVP supports USD-only valuation by default.

- USD comps are accepted directly.
- Non-USD comps are excluded unless a documented exchange rate and rate date are supplied.
- Do not fetch exchange rates implicitly in the first MVP.
- Store original currency and amount even when excluded.

### 13.2 Total price

```text
normalized_total = sale_price + shipping_price
```

Treat missing shipping as unknown, not automatically zero, unless the provider explicitly defines it as included or free. The UI must show whether shipping was included, zero, or unknown.

### 13.3 Deduplication

Build a stable `dedupe_key` from, in order of preference:

1. Provider + provider record ID.
2. Normalized sale URL or marketplace item ID.
3. Marketplace + normalized title + sold date + total amount.

When duplicates occur across providers:

- Keep one logical comp for valuation.
- Preserve all source references in metadata.
- Prefer the record with a known accepted sale price, known shipping, richer identity, and reliable sale status.

### 13.4 Strict matching

A comp is `valid` only when all available evidence supports the exact card identity. Required behavior:

- Different year: exclude.
- Different player: exclude.
- Different card number: exclude.
- Different set: exclude.
- Different named parallel: exclude.
- Unknown parallel when the owned card is a named parallel: exclude by default.
- Different variation: exclude.
- Different serial denominator: exclude.
- Different autograph/relic/reprint status: exclude.
- Graded versus raw mismatch: exclude from primary valuation.
- Different grader or exact grade: exclude from primary graded valuation.
- Multi-card lot: exclude.
- Unsold or active listing: exclude.
- Cancelled/unreliable sale: exclude when status is known.
- Damaged/altered qualifier that does not match the owned card: exclude.

Adjacent grades, different graders, raw versus graded, and nearby parallels may be shown in a separate **Reference only** section with `match_status=inference`. They never enter the primary calculation.

### 13.5 Match score

Use a transparent score for diagnostics, not to override hard exclusions:

```text
match_score =
    0.15 * year_match
  + 0.15 * player_match
  + 0.15 * set_match
  + 0.10 * card_number_match
  + 0.15 * parallel_variation_match
  + 0.10 * autograph_relic_match
  + 0.05 * serial_denominator_match
  + 0.15 * grade_state_match
```

Each component is between 0 and 1. A hard-exclusion rule still wins even if the numeric score is high.

---

## 14. Valuation engine

### 14.1 Formula version

Start with `valuation-v1`. Every snapshot stores the formula version and all parameters needed to reproduce the result.

### 14.2 Input eligibility

A completed sale enters the primary calculation only when:

- It is marked `valid`.
- It is inside the requested date range.
- It has a positive normalized total.
- It is in the valuation currency.
- It is not a duplicate.
- It survives outlier review.

### 14.3 Outlier handling

Outlier removal must be conservative and visible.

- If fewer than 5 valid comps exist, do not automatically remove statistical outliers.
- With 5 or more comps, calculate unweighted Q1, Q3, and IQR.
- Flag prices below `Q1 - 1.5 * IQR` or above `Q3 + 1.5 * IQR`.
- Exclude flagged values from the primary estimate only when at least 4 non-outlier comps remain.
- Record `statistical_outlier` as the exclusion reason.
- Display excluded outliers to the user and allow inspection.

### 14.4 Comp weight

For each eligible comp:

```text
weight = identity_match_confidence
       * condition_or_grade_match
       * source_reliability
       * recency_weight
       * completeness_weight
```

Definitions:

```text
recency_weight = exp(-days_old / RECENCY_DECAY_DAYS)
```

Initial values:

- `identity_match_confidence`: normalized match score, minimum 0.70 for a valid comp.
- `condition_or_grade_match`: `1.0` for exact state; inference comps are not eligible.
- `source_reliability`: provider-supplied configuration between `0.70` and `1.00`.
- `completeness_weight`: `1.0` when shipping and sale status are known; `0.90` when shipping is unknown; minimum `0.80` for otherwise usable records.

Reject zero or negative final weights.

### 14.5 Weighted quantile algorithm

Implement one tested function for weighted quantiles:

1. Sort `(price, weight)` pairs by price ascending.
2. Reject negative weights and empty input.
3. Normalize cumulative weights to `[0, 1]`.
4. Return the first price whose cumulative normalized weight is greater than or equal to the requested quantile.

Use:

- Weighted median: quantile `0.50`.
- Low range: quantile `0.25`.
- High range: quantile `0.75`.

Money output is rounded to the nearest minor unit using decimal arithmetic.

### 14.6 Trend

When at least 6 eligible comps span at least 60 days:

- Define `recent` as the newest one-third of the selected date window.
- Define `earlier` as the remainder.
- Require at least 3 comps in each group.
- Calculate weighted median for both groups.
- Calculate:

```text
trend_percent = ((recent_median - earlier_median) / earlier_median) * 100
```

Otherwise trend is `None` and the UI says there is insufficient history.

### 14.7 Liquidity

When at least 2 eligible comps exist:

- Sort sale dates.
- Calculate day gaps between successive sales.
- Report the arithmetic mean of those gaps.

Also show eligible sale count for the chosen lookback window. Do not estimate marketplace time-to-sell from this value.

### 14.8 Low-data behavior

- `0` eligible comps: no price estimate; confidence `insufficient_data`.
- `1–2` eligible comps: show observed prices and an indicative range; confidence cannot exceed `low`.
- `3–4` eligible comps: calculate normally; confidence cannot exceed `medium`.
- `5+` eligible comps: full confidence calculation is allowed.

The app may offer to expand the lookback window, but it must not silently do so.

### 14.9 Confidence score

Calculate a 0–1 score:

```text
confidence_score =
    0.25 * identity_component
  + 0.25 * comp_count_component
  + 0.15 * recency_component
  + 0.15 * dispersion_component
  + 0.10 * source_diversity_component
  + 0.10 * completeness_component
```

Components:

- `identity_component`: confirmed identity confidence, capped at 1.
- `comp_count_component`: `min(valid_comp_count / 10, 1)`.
- `recency_component`: `max(0, 1 - newest_comp_age_days / 180)`.
- `dispersion_component`: if median is positive, `max(0, 1 - ((Q3 - Q1) / median))`; otherwise 0.
- `source_diversity_component`: `0.5` for one source, `0.8` for two, `1.0` for three or more.
- `completeness_component`: average completeness weight.

Labels:

- `high`: score `>= 0.75`, at least 5 valid comps, and confirmed identity.
- `medium`: score `>= 0.50` and at least 3 valid comps.
- `low`: any estimate that does not meet medium criteria.
- `insufficient_data`: no valid comps.

Store and show reason strings such as:

- `Only 2 exact comparable sales were found.`
- `Newest comparable sale is 143 days old.`
- `Price dispersion is high.`
- `All comparable sales came from one source.`

### 14.10 Fee profile and net proceeds

Fee profiles are user-configurable and stored with the snapshot:

```python
class FeeProfile(BaseModel):
    name: str
    marketplace_percent: Decimal = Decimal("0")
    marketplace_fixed_minor: int = 0
    payment_percent: Decimal = Decimal("0")
    payment_fixed_minor: int = 0
    expected_shipping_minor: int = 0
    insurance_minor: int = 0
    promotion_percent: Decimal = Decimal("0")
    grading_cost_minor: int = 0
    other_cost_minor: int = 0
```

Calculation:

```text
percentage_fees = estimate * (
    marketplace_percent
  + payment_percent
  + promotion_percent
)

fixed_costs = marketplace_fixed
            + payment_fixed
            + expected_shipping
            + insurance
            + grading_cost
            + other_cost

net_proceeds = max(0, estimate - percentage_fees - fixed_costs)
```

Do not hard-code current marketplace fee percentages. Seed a `Custom` profile with zero values and require the user to verify fees.

---

## 15. Streamlit user interface

### 15.1 Global behavior

- Use a wide layout.
- Keep navigation stable.
- Show success, warning, and error messages in plain language.
- Preserve in-progress form state across reruns.
- Confirm destructive actions.
- Format money from integer minor units.
- Display all timestamps in the user's local timezone while storing UTC.
- Do not expose stack traces or secrets in the UI.

### 15.2 Dashboard

Show:

- Total cards and total quantity.
- Latest estimated collection value.
- Total cost basis.
- Unrealized gain/loss.
- Count of stale valuations.
- Count of cards with low or insufficient confidence.
- Status distribution.
- Recent valuation changes.

If a card lacks a valuation, exclude it from collection estimated value and show the count of unvalued cards.

### 15.3 Add Card

Sections:

1. Entry mode: image-assisted or manual.
2. Front/back/slab-label uploader.
3. Quality results.
4. Optional hints.
5. Candidate cards.
6. Editable identity form.
7. Ownership and acquisition form.
8. Confirmation summary.

The save button remains disabled until identity validation passes.

### 15.4 Collection

A searchable, sortable table with:

- Thumbnail.
- Player.
- Year.
- Set.
- Card number.
- Parallel.
- Grade state.
- Quantity.
- Status.
- Cost basis.
- Latest value.
- Gain/loss.
- Confidence.
- Last valued date.

Filters:

- Player text.
- Year range.
- Set.
- Raw/graded.
- Grader.
- Status.
- Confidence.
- Stale valuation.

### 15.5 Card detail

Tabs:

- **Overview:** images, identity, ownership, cost basis, latest value.
- **Valuation:** estimate, range, confidence, trend, liquidity, fee profile, net proceeds.
- **Comparable sales:** included, excluded, and reference-only tables.
- **History:** valuation chart and snapshot table.
- **Transactions:** acquisitions and sale details.
- **Audit:** identity confirmation and correction history.

### 15.6 Imports & Exports

- Download CSV templates.
- Import completed-sales CSV.
- Import collection CSV only after a preview and validation step.
- Export cards, ownership, latest valuations, valuation history, and comps.
- Include UTF-8 headers and ISO 8601 dates.

### 15.7 Settings

Show:

- Database and image paths without secrets.
- Enabled providers and configuration status.
- Default lookback.
- Stale-after days.
- Recency decay.
- Default currency.
- Fee profiles.
- Formula version.

---

## 16. Import/export contracts

### 16.1 Collection export

At minimum include:

```text
owned_card_id,quantity,status,storage_location,year,manufacturer,brand,set_name,
player_name,card_number,parallel_name,variation_name,serial_number_numerator,
serial_number_denominator,is_rookie,is_autograph,is_relic,is_reprint,
raw_or_graded,grader,grade,certificate_number,identity_confirmed,
acquisition_date,cost_basis,currency,latest_estimate,latest_low,latest_high,
latest_confidence,latest_valued_at,notes
```

### 16.2 Import validation

- Parse entire file before writing.
- Show valid-row count and error-row count.
- Require explicit confirmation before inserting.
- Insert valid rows in one transaction.
- Roll back the transaction on unexpected failure.
- Provide a downloadable error CSV with row number, field, bad value, and message.

---

## 17. Error handling, resilience, and security

### 17.1 Typed errors

Define and handle at least:

- `ValidationError`
- `ImageProcessingError`
- `ProviderConfigurationError`
- `ProviderAuthenticationError`
- `ProviderRateLimitError`
- `ProviderTimeoutError`
- `ProviderResponseError`
- `UnsupportedOperationError`
- `InsufficientDataError`
- `PersistenceError`

### 17.2 Network behavior

For real providers:

- Connect timeout: 5 seconds.
- Read timeout: 20 seconds.
- Retry at most 3 times for timeouts, 429, and transient 5xx responses.
- Use exponential backoff with jitter.
- Honor `Retry-After` when present.
- Do not retry most 4xx responses.
- Cap pagination according to configured provider limits.
- Cache identical read requests for a short documented interval when the provider license allows it.

### 17.3 Security

- Never commit secrets.
- Redact tokens from logs and exceptions.
- Validate image content, not only file extension.
- Generate server-side filenames.
- Prevent path traversal.
- Escape or sanitize provider text before rendering.
- Do not render arbitrary HTML from provider responses.
- Use parameterized SQL through SQLAlchemy.
- Document backup and restore for `data/cardvalue.db` and `data/images`.

### 17.4 Privacy

- Keep uploaded images local by default.
- Before sending an image to a cloud provider, show which enabled provider will receive it.
- Document whether a provider retains submitted images based on the provider's current terms; do not guess.
- Allow provider integrations to be disabled independently.

---

## 18. Testing strategy

### 18.1 Minimum coverage target

- Overall line coverage: at least 80%.
- Valuation, matching, money, and identity-key modules: at least 95%.
- Do not chase coverage by testing trivial getters while leaving core branches untested.

### 18.2 Unit tests

Required test groups:

#### Identity

- Raw identity validates without grader.
- Graded identity requires grader and grade.
- Serial numerator and denominator validation.
- Identity key is stable under whitespace/case normalization.
- Different parallel produces a different identity key.
- Different grade produces a different identity key.

#### Images

- Valid JPEG/PNG/WebP accepted.
- Invalid or renamed non-image rejected.
- EXIF rotation applied.
- Hash deduplication works.
- Original remains unchanged.
- Oversized upload rejected.

#### Matching

- Exact raw match is valid.
- Graded versus raw is excluded.
- Different grader excluded.
- Different grade excluded.
- Different parallel excluded.
- Unknown parallel excluded for a named parallel.
- Different serial denominator excluded.
- Lot listing excluded.
- Active listing never enters completed comps.

#### Deduplication

- Same provider record ID deduplicates.
- Same marketplace item across providers deduplicates.
- Richer record wins.

#### Statistics

- Weighted median with odd and even observations.
- Weighted quartiles.
- Duplicate prices.
- Zero and negative weight rejection.
- Outlier rule below five comps.
- Outlier rule at five or more comps.
- Decimal-money rounding.

#### Confidence

- Zero comps gives insufficient data.
- Two comps cannot exceed low.
- Four comps cannot exceed medium.
- High requires at least five comps and confirmed identity.
- Old comps reduce confidence.
- Wide dispersion reduces confidence.

#### Net proceeds

- Percentage and fixed fees.
- Zero-fee profile.
- Result cannot be negative.

### 18.3 Integration tests

- Clean migration from empty database.
- Seed script is idempotent.
- Add manual card end to end through services.
- Save images and link to owned card.
- Import comps CSV with partial row errors.
- Generate and persist valuation snapshot.
- Identity edit marks valuation stale.
- Export round trip preserves required fields.
- Provider failure does not erase results from healthy providers.

### 18.4 UI smoke tests

Use Streamlit's testing support where practical:

- App starts.
- Dashboard loads on empty database.
- Manual card form validates required fields.
- Collection table renders seeded data.
- Card detail renders no-valuation state.
- Refresh valuation displays fixture comps.
- CSV download controls exist.

### 18.5 Required fixture scenarios

Create deterministic fixtures for:

1. Exact raw card with 10 good comps.
2. Graded PSA 9 card with mixed PSA 9, PSA 10, SGC 9, and raw records.
3. Numbered parallel `/99` with wrong `/199` records.
4. Sparse card with 2 exact comps.
5. No-comps card.
6. Duplicate sale returned by two providers.
7. Extreme high outlier.
8. Multi-card lot.
9. Non-USD sale.
10. Provider timeout and 429 response.

---

## 19. Observability and audit behavior

Log in structured key/value form:

- Request or operation ID.
- Provider code.
- Operation.
- Duration.
- Result count.
- Cache hit.
- Error type.

Do not log:

- API keys.
- Authorization headers.
- Full image bytes.
- Complete provider payloads by default.

Every valuation snapshot must make it possible to answer:

- Which exact comps were included?
- Which comps were excluded and why?
- What formula version and parameters were used?
- What fee profile was used?
- What was the confirmed identity at calculation time?

---

## 20. Build plan

Execute phases in order. Do not begin optional real-provider work before the offline MVP passes.

### Phase 0 — Bootstrap

Tasks:

- Create repository structure.
- Create `pyproject.toml`, `.gitignore`, `.env.example`, and README skeleton.
- Add typed configuration and logging.
- Add lint, formatting, typing, and test configuration.
- Add a minimal Streamlit app health page.

Exit criteria:

- Editable install succeeds.
- App starts.
- Formatting, linting, typing, and one smoke test pass.

### Phase 1 — Database and collection foundation

Tasks:

- Implement enums and database models.
- Configure SQLAlchemy session handling.
- Configure Alembic and create initial migration.
- Implement repositories and transaction boundaries.
- Implement card identity validation and identity key.
- Implement manual card entry.
- Implement acquisition and ownership records.
- Build Collection and Card Detail pages.
- Add seed script.

Exit criteria:

- A manual card can be created, opened, edited, and listed.
- Clean migration and repository tests pass.

### Phase 2 — Image upload and identification workflow

Tasks:

- Implement secure image storage.
- Implement derivative creation and quality checks.
- Add optional OCR interface.
- Implement identification-attempt state machine.
- Implement Manual and Mock identification providers.
- Aggregate candidates.
- Build candidate comparison and confirmation UI.
- Link images to the confirmed owned card.

Exit criteria:

- Front and back upload works.
- Originals are preserved.
- Quality warnings display.
- User can confirm or edit a candidate.
- The resulting card is saved with audit metadata.

### Phase 3 — Market data and valuation

Tasks:

- Implement provider protocol and registry.
- Implement Mock and CSV completed-sales providers.
- Implement normalization, strict matching, and deduplication.
- Implement outlier handling.
- Implement weighted quantiles, trend, liquidity, and confidence.
- Implement fee profiles and net proceeds.
- Persist append-only valuation snapshots.
- Build valuation and comps UI.

Exit criteria:

- Fixture comps produce reproducible expected outputs.
- Included and excluded comps are visible with reasons.
- Sparse and no-data behavior is correct.
- Net proceeds are configurable.

### Phase 4 — Dashboard, history, and import/export

Tasks:

- Implement dashboard aggregates.
- Implement valuation-history chart.
- Implement stale-valuation detection.
- Implement collection and comp CSV exports.
- Implement comp CSV import preview, validation, and error download.
- Document backup and restore.

Exit criteria:

- Collection totals are correct.
- Missing valuations are reported, not treated as zero-valued cards.
- Exports open correctly in spreadsheet software.
- Import validation is transactional.

### Phase 5 — Hardening

Tasks:

- Complete typed error handling.
- Add bounded retry and timeout utilities.
- Add audit logging and redaction tests.
- Add UI empty/error/loading states.
- Run all quality checks.
- Raise coverage to target.
- Review README against a clean install.

Exit criteria:

- All required checks pass.
- A clean checkout can be installed and run using README instructions.
- No secret or personal test data is committed.

### Phase 6 — Optional licensed providers

Only begin after Phases 0–5 pass.

For each provider:

1. Confirm the user's allowed use and credentials.
2. Read current official API documentation.
3. Implement authentication and configuration validation.
4. Map provider responses into internal models.
5. Add pagination, retries, rate-limit behavior, and audit records.
6. Add redacted contract fixtures.
7. Run an authenticated smoke test.
8. Document storage, display, caching, and attribution obligations.

A provider is not complete until all eight steps are satisfied.

---

## 21. Acceptance scenarios

### Scenario A — Manual raw card

Given an empty local database:

- User enters a raw baseball card manually.
- User enters acquisition price, tax, and shipping.
- Card saves with a confirmed identity.
- Collection shows correct cost basis.
- Card detail shows `No valuation yet`.

### Scenario B — Image-assisted confirmation

- User uploads front and back images.
- App stores originals and derivatives.
- Mock provider returns three candidates.
- User chooses one and edits the parallel.
- App stores the final user-confirmed identity and candidate history.

### Scenario C — Exact graded valuation

- Owned card is PSA 9.
- Imported data contains PSA 9, PSA 10, SGC 9, and raw sales.
- Only exact PSA 9 records enter the primary estimate.
- Other records appear as excluded or reference-only with reasons.

### Scenario D — Numbered parallel

- Owned card is a parallel numbered `/99`.
- Data includes the base card and `/199` parallel.
- Neither enters the primary estimate.
- No substitution occurs even if exact comps are sparse.

### Scenario E — Sparse data

- Two exact comps exist.
- App shows their observed range and a low-confidence indication.
- App does not fabricate additional precision.
- User can explicitly expand the window.

### Scenario F — Duplicate and outlier

- Same sale arrives from two sources.
- It counts once.
- An extreme outlier is flagged according to the documented rule.
- The UI shows why it was excluded.

### Scenario G — Net proceeds

- User defines a custom fee profile.
- App calculates all percentage and fixed costs.
- Snapshot stores the fee profile used.
- Historical net proceeds remain reproducible if the current profile later changes.

### Scenario H — Export and recovery

- User exports collection and valuation history.
- CSVs contain documented fields.
- Database and images can be backed up and restored using README steps.

---

## 22. Success metrics

Use these as pilot targets, not guarantees:

- At least 80% exact top-result identification on an agreed labeled test set.
- At least 90% correct identity in the top three candidates.
- No automatic final confirmation.
- Normal front/back processing completes in under 30 seconds on the target machine, excluding slow external-provider time.
- Every valuation exposes its comps and exclusions.
- Exact parallel and grade are never silently substituted.
- Low-confidence and sparse-data valuations are clearly labeled.
- Collection is fully exportable.
- Valuation history is reproducible.
- Manual corrections remain in the audit trail.

Before measuring identification accuracy, assemble a labeled test set of 100–300 cards spanning:

- Modern base cards.
- Refractors and color parallels.
- Numbered cards.
- Autographs and relics.
- Image variations.
- Vintage cards.
- Raw and graded examples.
- Multiple grading companies.

Do not use the same images for tuning and final evaluation.

---

## 23. Future production path

Do not implement this during the MVP, but preserve the seams:

- Replace Streamlit-only architecture with FastAPI and a separate web client.
- Migrate SQLite to PostgreSQL.
- Move images to S3-compatible object storage.
- Add user authentication and authorization.
- Add background jobs for OCR, refresh, and bulk import.
- Add Redis only when a measured need exists.
- Add provider-specific caching consistent with licensing.
- Add pgvector or another vector search only after a labeled test proves value.
- Add monitoring, automated backups, recovery testing, and deployment automation.
- Add commercial data licenses before public distribution.

---

## 24. Final implementation checklist

The agent must not claim completion until every applicable item is checked.

### Product

- [ ] Baseball-only MVP.
- [ ] Raw and graded cards supported.
- [ ] No definitive raw numeric grading.
- [ ] Manual card entry works.
- [ ] Image-assisted workflow works with mock/manual providers.
- [ ] Human confirmation is always required.
- [ ] Collection tracking works.
- [ ] Acquisition and sale transactions work.
- [ ] CSV import/export works.

### Valuation

- [ ] Completed sales and active listings are stored separately.
- [ ] Exact identity matching is enforced.
- [ ] Parallel, serial denominator, grader, and grade mismatches are excluded.
- [ ] Deduplication works.
- [ ] Conservative outlier handling works.
- [ ] Weighted median and quartiles are tested.
- [ ] Sparse-data behavior works.
- [ ] Confidence reasons are visible.
- [ ] Net proceeds use user-configurable fees.
- [ ] Snapshots are append-only and reproducible.

### Engineering

- [ ] SQLAlchemy models and Alembic migration exist.
- [ ] App starts with no paid credentials.
- [ ] Secrets are excluded from source control.
- [ ] Original images are preserved.
- [ ] Provider errors are isolated.
- [ ] Logs redact secrets.
- [ ] Clean-install instructions are verified.
- [ ] Ruff passes.
- [ ] Mypy passes.
- [ ] Pytest passes.
- [ ] Coverage targets pass.

### Documentation

- [ ] README setup instructions.
- [ ] Environment-variable reference.
- [ ] Provider setup and license caveats.
- [ ] CSV templates and field definitions.
- [ ] Backup and restore steps.
- [ ] Valuation formula explanation.
- [ ] Known limitations.

---

## 25. Stop conditions

Stop and report a precise blocker only if:

- The local filesystem or Python runtime prevents the offline MVP from running.
- A required dependency has no compatible Python 3.12 release and no reasonable substitute.
- An existing repository constraint directly conflicts with a locked requirement.
- A destructive operation would be required against existing user data.

Do **not** stop because:

- A paid API key is missing.
- OCR is unavailable.
- A provider is rate-limited.
- Image identification is uncertain.
- Exact comps are unavailable.

Use manual entry, mock data, CSV import, visible low-confidence states, and typed provider errors so the rest of the application remains usable.

---

## 26. Required completion report from the implementation agent

At the end, provide:

1. A concise summary of what was built.
2. Exact run commands.
3. Quality-check results.
4. Database migration status.
5. Providers implemented and which are mock/manual/real.
6. Known limitations.
7. Any credential or licensing work still requiring the owner.
8. A checklist mapping completed work to the acceptance scenarios in this document.

Do not report a real provider as working unless an authenticated smoke test succeeded. Do not report the application as complete if the offline/manual path, valuation transparency, or exports are missing.
