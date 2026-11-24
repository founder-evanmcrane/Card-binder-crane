# Card Binder on Cloudflare Workers: review and change list

Reviewed Nov 22, 2026
Site: https://card-binder.evanmcrane.workers.dev/
Goal: get the Worker version back to where the claude.ai version left off (v5, Nov 21), with no dependence on claude.ai artifact features.

---

## 1. Summary

The page you deployed is the same app as our last version (v5). I compared the code and it has everything: grid, search, rotate, value history, backup and restore, Add many, scan on photo pick, price check from screenshots, and the copy-to-Claude values box. You also added a Worker backend (`/api/ai`) to replace the claude.ai scanning feature, which is the right idea.

The scanning problems have one cause: **the backend is not set up, so the page quietly switches scanning off.** Restore is a separate problem and I could not reproduce it, so section 3 lists the likely causes in order.

I only read things. I changed nothing in your Cloudflare account.

---

## 2. Why scan, Add many and price check do not work

### What the page does
On load it calls `/api/status`. Only if that returns OK does it turn on scanning. The "Add many cards from photos" box, the scan on photo pick, and the screenshot price check are all hidden or skipped when it does not. If the call fails, it says nothing.

### What I found
- The live Worker has **no bindings at all**. I read its settings through the Cloudflare API and the list is empty.
- The Worker needs three things before it will answer any `/api` call:
  - `ANTHROPIC_API_KEY` (secret)
  - `TEAM_DOMAIN` (the Access team address)
  - `POLICY_AUD` (the Access application's audience tag)
- With none of them, `verifyAccess` fails, every `/api` call returns 401, and the page never enables scanning.

### Proof
I ran a copy of your page locally with the backend answering 401, then 200:

| `/api/status` | Add many box | Scan on photo pick | Restore |
|---|---|---|---|
| 401 (your Worker today) | Missing | Silent, nothing fills in | Worked |
| 200 | Present | Filled in 4 fields | Worked |

The 401 row matches what you described. The front end is fine. The backend is the gap.

### Fix
1. Add the secret: Workers & Pages, card-binder, Settings, Variables and Secrets, add `ANTHROPIC_API_KEY` as a secret.
2. Put Cloudflare Access in front of the site (for a workers.dev address, turn on Access in the Worker's Domains and Routes settings) with a policy that allows only your email. Without Access, the JWT header never arrives and `/api` stays locked. I did not check your Access setup.
3. Add `TEAM_DOMAIN` as `https://YOURTEAM.cloudflareaccess.com`. It must match exactly: https, no trailing slash.
4. Add `POLICY_AUD` with the Application Audience (AUD) tag from the Access application.
5. Check it: signed in, open `/api/status` in the same browser.
   - `{"error":"Sign-in required"}` means Access or the two variables are wrong.
   - `{"error":"Not configured"}` means the API key is missing.
   - `{"ready":true}` means it is working, and the app will show Add many.

---

## 3. Why restore may not work

In my local test, restore worked: I saved a backup, opened the app in a fresh browser profile, restored, and the cards came back and survived a reload. So the logic is sound. Likely causes on your phone, most likely first:

1. **File picker filter.** The Restore button only allows `.json` or `application/json`. Android pickers can grey out a downloaded file whose type is not recognised, so you cannot select it. Fix: remove the `accept` filter and check the contents instead.
2. **The restore button was replaced mid-pick.** When scanning switches on late, the page redraws the main screen. If you are choosing a file at that moment, the choice is lost. This is the same bug we fixed on the form before. Fix: add the Add many box in place instead of redrawing the whole screen.
3. **"Nothing new in that file."** Restore skips any card whose id already exists and never overwrites. If cards were already added, newer values from the backup are ignored.
4. **A false success message.** It says "Restored N" even when the browser refused to store the cards, so they vanish on reload. It should report how many were actually saved.

What would settle it: what message you see after choosing the file, and whether the file can be selected at all.

---

## 4. Claude.ai ties still in the code

These are what to remove so the app stands alone:

- `window.claude`, `claude.use('sample')` and `claude.use('downloads')` checks at startup, and the `dl` variable.
- The `sample` object and its `modelTier` option. The Worker mimics this with `apiSample`. Rename it to something neutral like `ai`.
- Error codes borrowed from claude.ai (`not_granted`, `declined`).
- The copy-to-Claude values box. It works without a backend, but it depends on a manual chat. Replace it with a Worker route (section 5).
- Prompts live in the browser, and `/api/ai` accepts any prompt up to 8,000 characters. Move them into the Worker.

---

## 5. What I would change, in order

### A. To get back to where we left off
1. Configure the backend (section 2).
2. Show the backend state on screen, for example "Scanning: ready", "Sign-in needed" or "Not set up", with a retry. Today failures are silent.
3. Make `/api/status` say why it is not ready (missing key, Access misconfigured, not signed in) instead of a bare 401.
4. Fix restore (section 3): remove the file filter, report saved versus failed, and let the newer version of a card win using an `updated` timestamp.
5. Stop redrawing the main screen when scanning becomes available.
6. Show a version number in the footer, such as "v5, Nov 21". You now have three copies (the claude.ai link, the downloaded file, the Worker), and a visible version makes it obvious which one you are using.

### B. To remove claude.ai dependence
7. Replace `sample` and `claude.use` with a plain `ai` helper that calls the Worker.
8. Move the prompts into the Worker with fixed routes: `/api/scan` (card photos) and `/api/price` (screenshots). The browser sends images and card fields only. The Worker holds the prompts and checks the replies.
9. Add cost guards: a daily limit stored in KV, a smaller `max_tokens` for scans, and a usage log.
10. Save backups with the phone's own file or share options, not the claude.ai download feature.

### C. Things the Worker makes possible
11. **Real install on your phone.** Add a web app manifest, icons and a service worker. Right now it is only a home-screen shortcut, with no offline use and no install prompt.
12. **Valuation with no screenshots and no copy and paste.** Add `/api/value`, which calls a licensed price source from the Worker with its key stored as a secret. Candidates from the gameplan: Card Hedge, The Card API, SportsCardsPro API. Each needs an account and a terms check. This is the one-tap option we could not build on claude.ai, and it is now doable.
13. **Storage that survives.** Keep cards in D1 and photos in R2 behind Access, with the browser copy as an offline cache. Cards would then sync across devices and survive clearing the browser. Move existing cards over by restoring from a backup.
14. **Batch that pairs by reading.** Have the scan label each photo as front or back and match by player and card number, so a missed or out-of-order photo does not shift every pair after it. Your last batch showed this problem.

### D. Housekeeping
15. The whole page is stored as one long string inside `worker.js`. That makes escaping mistakes easy and changes hard to review. Move the page to its own `index.html` served as a static asset, and keep the Worker for `/api` only.
16. Add a short test list to run after each deploy (section 7).

---

## 6. Feature check against the last claude.ai version

| Feature | Last version | Worker now | What is needed |
|---|---|---|---|
| Grid, search, add, edit, delete | Yes | Yes | None |
| Rotate, whole-photo display | Yes | Yes | None |
| Value history, eBay links, CSV | Yes | Yes | None |
| Backup save | Yes | Yes | None |
| Restore | Yes | Failing for you | Section 3 |
| Scan on photo pick | Yes | Off | Section 2 |
| Add many from photos | Yes | Hidden | Section 2 |
| Price check from screenshot | Yes | Hidden | Section 2 |
| Values via copy to Claude | Yes | Yes | None (replace later with `/api/value`) |
| Fast and careful scan tiers | Yes | Needs key | Worker picks Haiku 5.5 or Sonnet 5.5 |
| Install on phone, offline | No | No | Item 11 |

---

## 7. Checks after each change

1. Signed in, `/api/status` returns `{"ready":true}`.
2. The main screen shows "Add many cards from photos".
3. Add one card with a front photo: fields fill in within a few seconds.
4. Pick a second photo while the first is still being read: both photos stay.
5. Add many with 4 photos: 2 cards appear.
6. Save a backup, open the app in a private window, restore: the cards appear, and still do after a reload.
7. Open the app signed out or in another browser: scanning is refused, and the page says why.

---

## 8. Not checked

- Your Cloudflare Access setup.
- The response from your live `/api/status`. I tested a local copy with the same code.
- Whether your Anthropic key is valid.
- How restore behaves on your phone.
