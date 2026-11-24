# Card Binder: Project Log and Plan

Last updated: Nov 20, 2026
Live app: https://claude.ai/artifact/VzWhW36mAveisLW1setcov
Source plan: "gameplan for baseball card app" (Gmail PDF, Nov 20, 2026)

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
| App format | Phone-friendly web page (single HTML file, Add to Home Screen) | The gameplan suggested Streamlit, but it can't be installed on a phone and I want to take photos on my device |
| Storage | Browser storage on the device (IndexedDB) | Simple, private, no account or server |
| Card reading | Claude reads the photos (the page's "ask Claude" feature) | Fills in the fields without a separate OCR or catalog service |
| Valuation, for now | Prefilled eBay search links, plus a screenshot-based average | No licensed price data yet, and the page can't call outside sites |
| Value history | Each save adds an entry | Matches the "snapshots, not overwrite" principle |
| Collection view | Grid of card images | Easier to scan and search than a list |

---

## 3. What has been done

### Version 1: collection foundation
- Add a card with front and back photos (photos are shrunk before saving).
- Fields: player, year, card number, brand and set, parallel, serial number, raw or graded (grader and grade), amount paid, date acquired, notes.
- Search by player, set, year, parallel and notes.
- Card page with value history, an "add value" entry, and eBay "Sold" and "For sale" links built from the card's details.
- Summary strip with card count, total paid, total value.
- "Back up my list" shows a copyable CSV (details only, no photos).

### Save problem and fix
- Reported: Save did nothing on the published link.
- I could not reproduce it in a test browser, so the exact cause is unconfirmed. The likely cause was a storage write that never finished and froze the screen.
- Fix: saving no longer waits on storage, storage calls time out, an on-screen note says "Saved on this device" or warns when storage refused it, and unexpected errors now show on screen.
- The downloaded copy of the file saved correctly and I recorded a first card in it.

### Version 2 (published Nov 20, 2026)
- **Grid view:** cards show as images, three across, with player, set, parallel or grade, and a value tag.
- **Photo scan:** adding a photo asks Claude to fill in the fields. It leaves blanks where it can't see something, only fills empty fields, and highlights fields it is unsure of. "Scan photos again" overwrites.
- **Price check from a screenshot:** open the eBay sold link, screenshot the results, add the screenshot on the card page. Claude reads the listings and keeps only those that match the card. The app shows the average, median, range, and how many it skipped, with "Save as value." It flags when the screenshot shows asking prices rather than sold prices.
- **Fixes:** gain/loss no longer counts a value as profit when no price paid was entered. Card numbers display in capitals. Paid shows a dash until a price is entered.

### Testing so far
- Save, grid, and price-check logic were tested in a test browser with a stand-in for Claude.
- Real scanning and real price reading have **not** yet been tried on my phone.

### Progress against the gameplan phases

| Phase | Status |
|---|---|
| 0. Requirements and licensing | Scope decided. Data provider not chosen. Licensing not checked |
| 1. Collection foundation | Done in adapted form. No CSV import yet |
| 2. Card identification | Partly done: Claude reads photos and fills fields. No catalog matching, no top-three candidate list, no photo quality checks or cropping |
| 3. Comparable sales and valuation | Stopgap only: screenshot average. No licensed sales data, no weighting or confidence score |
| 4. Collection analytics | Minimal: totals and per-card history |
| 5. Pilot and hardening | Not started |

---

## 4. Known issues and limits

- **Two separate data stores.** The downloaded file and the published link each keep their own cards. My first test card (2026 Topps Tribute Ronald Acuña Jr. relic) lives in the downloaded copy.
- **Scan and price check only work in the published link**, not the downloaded file.
- **Link storage not yet confirmed on my phone.** The app now says on screen whether a save worked.
- **Data lives only on the device.** Clearing browser data could wipe it. The CSV backup leaves out photos and there is no restore.
- **Serial typo to fix:** the saved Acuña shows 151/193, but the listing shows /199.
- **Test photos were listing screenshots**, not photos of real cards. The back photo is sideways. No rotate or crop yet.
- **Price check depends on the screenshot.** Blurry, short, or mixed results give weak averages. It is a rough estimate, not a market value.
- **Parallels can't always be told apart from a photo.** The app should flag these for me to confirm.
- **Scans use my own Claude usage**, and the first use asks permission.
- **Search covers my own collection only**, not a catalog of all cards.

---

## 5. Next steps

### A. Do next (testing, no building)
1. Open the published link on my phone and Add to Home Screen.
2. Add a card with real front and back photos. Check the scan fills the right fields and highlights uncertain ones.
3. Close and reopen the app. Confirm the card is still there.
4. Fix the Acuña serial and decide which copy is the real one (the link is the one with scanning).
5. Run a price check with a real eBay sold-results screenshot. Compare the average to what I'd estimate by eye.
6. Add 20 to 30 cards and note what is annoying.

### B. Near-term improvements
- Backup and restore that includes photos.
- If browser storage proves unreliable: move cards and photos to the app's own database and file storage so they survive clearing and sync across devices.
- Auto-rotate and crop photos, and warn about blur or glare.
- A "confirm this card" step when the scan is unsure, showing a few likely matches.
- Quantity and status fields (owned, sent for grading, and so on).
- Simple sort options (recently added, highest value). Keep it light.
- Flag cards with old or missing values.

### C. Later (needs a backend and a data license)
- Choose a data provider. The gameplan names Card Hedge (identification, catalog, comps) and The Card API (completed sales). Check price, personal-use terms, and whether storing results is allowed.
- Build a small backend with a swappable "market source" layer so providers can change.
- Automatic identification and sold-price averages with no screenshot step.
- Valuation with a range, confidence, and the actual comparable sales shown, as laid out in the gameplan.
- Optional: estimated net proceeds after fees, only if I ever want it.
- Optional: offline install support with a proper app wrapper.

### Success checks (from the gameplan, adjusted for personal use)
- The right card is the top result most of the time, and in the top three nearly always.
- Nothing is saved as confirmed when the app is unsure.
- Every price shows where it came from.
- A different parallel or grade is never mixed in silently.
- I can export my whole collection.

---

## 6. Resuming this project

To pick this up in a new chat, share this file and the live link, then say which step in section 5 to work on. The app is a single HTML file (`card-binder.html`) that uses the page's "ask Claude" feature with image support for scanning. Cards and photos are saved in browser storage on the device.
