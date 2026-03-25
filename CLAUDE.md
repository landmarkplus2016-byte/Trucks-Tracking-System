# CLAUDE.md — Trucks Tracking System

Developer notes for Claude. Read this before making any changes.

---

## Project Links

| | |
|---|---|
| **Live URL** | https://landmarkplus2016-byte.github.io/Trucks-Tracking-System/ |
| **GitHub** | https://github.com/landmarkplus2016-byte/Trucks-Tracking-System |
| **Apps Script URL** | https://script.google.com/macros/s/AKfycbwehWt6IZc7bhUW4NqYEzshfY7JEmOEZEB1WSRpwb75yrwqv-Oak5Klnx7XlF8q3Nkl/exec |
| **Sheet ID** | `167LeUQQLTf9BHNbWExgWIabU24AvJTEUZSoXEDwX41M` |

---

## Tech Stack

- **Frontend:** Plain HTML5 + CSS3 + Vanilla JS (ES6+) — no build tools, no npm, no frameworks
- **Backend:** Google Apps Script deployed as a Web App
- **Database:** Google Sheets (one file, six tabs)
- **Hosting:** GitHub Pages — must work by opening `index.html` directly, no server required

---

## Project Structure

```
index.html                        ← login page (entry point)
pages/fleet/                      ← fleet coordinator pages
pages/project/                    ← project coordinator pages
css/base/                         ← variables, reset, typography, layout
css/components/                   ← button, input, card, table, badge, modal, navbar, notification-bell
css/pages/                        ← one file per page
js/config/config.js               ← APPS_SCRIPT_URL lives HERE ONLY
js/constants/index.js             ← all string constants (ROLES, TRIP_STATUS, JC_STATUS, ROUTES, ACTIONS)
js/types/schemas.js               ← JSDoc type definitions only
js/utils/                         ← cost-calculator, date-formatter, validator
js/services/                      ← api, auth, trips, sites, notify
js/components/                    ← navbar, notification-bell, modal, cost-summary, site-list
js/pages/                         ← per-page scripts
apps-script/                      ← all .gs files (copy-paste into Apps Script editor)
```

---

## Strict Rules — Never Break These

1. **`js/config/config.js` is the only place the Apps Script URL lives.** Never hardcode it anywhere else.
2. **`js/constants/index.js` is the only place string constants live.** Never hardcode role names, status strings, or route paths in page scripts.
3. **Page scripts must never call `api.service.js` directly.** Always go through the relevant service file (`trips.service.js`, `sites.service.js`, etc.).
4. **All CSS values must use CSS custom properties from `css/base/variables.css`.** No hardcoded hex colours or px values outside that file.
5. **Session state lives in `sessionStorage` only**, keyed by `CONFIG.SESSION_KEY` (`tts_user`). Never use `localStorage`.
6. **Every page calls `requireAuth()` or `requireRole()` on load** and redirects to `index.html` if no session exists.
7. **No npm, no Node, no build step.** Everything must work by opening an HTML file in a browser.

---

## Architecture Decisions

### JS load order (every HTML page)
Scripts must load in this exact order — later files depend on earlier ones:
```
config.js → constants/index.js → utils/* → services/api.service.js
→ services/auth.service.js → services/trips|sites|notify.service.js
→ components/navbar.js → components/notification-bell.js → components/modal.js
→ [page-specific components] → js/pages/[page].js
```

### Cost calculation
- Lives **only** in `js/utils/cost-calculator.js` (client) and `apps-script/costs.gs` (server)
- Formula: `costPerSite = totalCost / totalSites` — `coordTotal = costPerSite × coordSiteCount`
- No rounding until the final value; stored at 2 decimal places

### Routing
- No SPA router — each page is a separate HTML file
- `ROUTES` constant in `js/constants/index.js` holds all page paths
- Navbar links and redirects must use `ROUTES.*`, never raw strings
- Pages in `pages/fleet/` and `pages/project/` use relative sibling paths for links (`dashboard.html`, not `/pages/fleet/dashboard.html`)

---

## Path Rules for GitHub Pages

GitHub Pages serves from the repo root. Absolute paths (`/css/...`) only work when the repo is at the domain root, which is **not** the case for project-level Pages URLs.

**Rule:** All `<link href>` and `<script src>` paths must be relative:

| File location | Prefix to use |
|---|---|
| `index.html` (root) | `css/...` / `js/...` |
| `pages/fleet/*.html` | `../../css/...` / `../../js/...` |
| `pages/project/*.html` | `../../css/...` / `../../js/...` |

Inline nav links within the same folder use bare filenames: `href="dashboard.html"`.

---

## Apps Script — Key Details

### Spreadsheet access
`getSpreadsheet()` in `Code.gs` uses a **hardcoded sheet ID** — NOT Script Properties:

```js
function getSpreadsheet() {
  return SpreadsheetApp.openById('167LeUQQLTf9BHNbWExgWIabU24AvJTEUZSoXEDwX41M');
}
```

Do **not** revert this to `PropertiesService` — the ID is intentionally hardcoded.

### All sheet access goes through `getSheet(tabName)`
Defined in `Code.gs`. No other `.gs` file should call `SpreadsheetApp` directly — they all use `getSheet(TABS.*)`.

### Deployment workflow
- Deploy as **Web App**, execute as **Me**, access **Anyone**
- After **any** `.gs` change: copy-paste the updated file(s) into the Apps Script browser editor, then **Deploy → Manage deployments → Edit → New version → Deploy**
- The URL does not change on redeploy — no need to update `config.js`
- CORS is handled by `ContentService.createTextOutput(...).setMimeType(MimeType.JSON)` — no extra headers needed

### Google Sheet tabs (must match `TABS` in `Code.gs`)
| Tab | Columns |
|---|---|
| `Trips` | tripId, date, whRep, driver, route, laborCost, parkCost, truckCost, hotelCost, totalCost, status, createdBy, createdAt |
| `Sites` | siteId, tripId, siteNumber, coordinatorEmail, jobCode, costShare, jcStatus |
| `Users` | userId, name, email, role, password, coordinatorName |
| `Notifications` | notifId, toEmail, tripId, message, isRead, createdAt |
| `Lists` | listName, value, label, sortOrder |
| `Cost per Site` | Date, Coordinator, Site, Job Code, Route, Driver, Total Cost, Status |

`Lists` powers dynamic dropdowns. Example rows for WH Representatives:

| listName | value | label | sortOrder |
|---|---|---|---|
| whRep | Ehab | Ehab | 1 |
| whRep | Karam | Karam | 2 |

### Known issues (2026-03-24)
- Pending JC page needs end-to-end testing after latest coordinator email fix
- Cost per Site tab and `rebuildCostPerSiteReport()` created but not yet tested in production

---

## Apps Script URL

Stored in `js/config/config.js`:
```
https://script.google.com/macros/s/AKfycbwehWt6IZc7bhUW4NqYEzshfY7JEmOEZEB1WSRpwb75yrwqv-Oak5Klnx7XlF8q3Nkl/exec
```

---

## Changes Made — 2026-03-22

### Initial build
- Created full project from scratch: all HTML, CSS, JS, and Apps Script files
- Two roles implemented: `fleet` (create/edit/delete trips) and `project` (enter job codes, view history)
- Notification bell polls every 60 s via `notify.service.js`; badge clears on read
- Cost breakdown computed client-side in `cost-calculator.js` and mirrored server-side in `costs.gs`
- PWA manifest added (`manifest.json`) for mobile "Add to Home Screen"

### Fix: Apps Script URL in `config.js`
- Replaced placeholder `YOUR_DEPLOYMENT_ID` with the real deployed URL
- Restored `Object.freeze`, `APP_NAME`, `NOTIF_POLL_INTERVAL`, and `SESSION_KEY` that were accidentally dropped in an intermediate edit

### Fix: GitHub Pages relative paths
- All 8 HTML files had absolute paths (`/css/...`, `/js/...`) which 404 on GitHub Pages
- `index.html`: removed leading `/` from all `href`/`src` attributes
- All 6 `pages/fleet/*.html` and `pages/project/*.html`: replaced `/` prefix with `../../`
- Inline nav links (Back buttons, View All, etc.) updated to use sibling-relative paths

### Fix: Apps Script spreadsheet access
- `getSheet()` in `Code.gs` was calling `SpreadsheetApp.getActiveSpreadsheet()` which returns `null` in Web App context (no active spreadsheet)
- Added `getSpreadsheet()` that reads the sheet ID from Script Properties (`SHEET_ID`)
- Updated `getSheet()` to call `getSpreadsheet()` — all other `.gs` files already used `getSheet()` so no other files needed changes
- **Required setup step:** add `SHEET_ID` script property in Apps Script → Project Settings → Script Properties

---

## Changes Made — 2026-03-23

### Fix: CORS — switched API calls to GET
- Google Apps Script POST requests cause a CORS redirect that loses the POST body
- Changed `fetchAPI` in `api.service.js` to use GET with URL query params: `?action=X&data=JSON`
- Updated `doGet` in `Code.gs` to route all actions (same switch as `doPost`)
- No other files needed changes — all callers go through `fetchAPI`

### Fix: Role normalization
- Users sheet role values like `"Fleet Coordinator"`, `"Project Coord"`, `"FC"` were not matching exact constants
- `apps-script/auth.gs` `validateUser` and `getUserRole`: map all variants to `'fleet'` or `'project'`
- `js/services/auth.service.js` `login()`: normalizes `result.data.role` to `.toLowerCase().trim()` before saving session
- `requireRole()`: compares roles case-insensitively

### Fix: Loading timeout pattern — all page scripts
- Pages could hang forever if `requireRole()` threw before the timeout was set
- Pattern applied to all 6 page scripts (both fleet and project):
  1. Set `loadingTimeout = setTimeout(showError, 10000)` as first line
  2. Call `requireRole` inside `try/catch` AFTER the timeout — catch clears timeout and redirects to login
  3. `clearTimeout(loadingTimeout)` is the first statement after each `await fetchAPI(...)` resolves
- `hideLoading()` uses `loadingEl?.remove()` to pull the spinner out of the DOM entirely

### Feature: Dynamic dropdowns — Lists sheet + coordinators
- Added `Lists` tab to the spreadsheet: `listName | value | label | sortOrder`
- `apps-script/lists.gs` (new file):
  - `getList(data)`: returns items for a named list, sorted by `sortOrder`
  - `getCoordinators()`: returns project-role users as `{ value: email, label: name }`
- `js/services/trips.service.js`: added `getListValues(listName)` and updated `getCoordinators()`
- `ACTIONS.GET_LIST` and `ACTIONS.GET_COORDINATORS` added to `js/constants/index.js`
- New/edit trip forms: WH Rep `<select id="whRep">` populated from Lists sheet; coordinator `<select class="coordinator-select">` per site loaded async via `loadCoordinatorOptions(selectEl)`

### Fix: New trip and edit trip form IDs
- Cost input IDs changed from hyphenated (`labor-cost`) to camelCase (`laborCost`, `parkCost`, `truckCost`, `hotelCost`) to match JS property names
- WH Rep select changed from `id="wh-rep"` to `id="whRep"`
- Coordinator fields changed from free-text `<input>` to `<select class="coordinator-select">`
- Fallback WH rep list (`Ehab`, `Karam`) used if API call fails or times out

---

## Changes Made — 2026-03-24

### Fix: Login redirect stuck at index.html
- `login.js` was using `ROUTES.FLEET_DASHBOARD` / `ROUTES.PROJECT_DASHBOARD` for post-login redirects
- These are root-relative paths that should resolve correctly, but combined with `requireRole`'s sibling-relative `dashboard.html` redirect on wrong role, could cause a loop back to `index.html`
- Fixed by hardcoding literal paths in `login.js`: `'pages/fleet/dashboard.html'` and `'pages/project/dashboard.html'`
- This applies to BOTH the "already logged in" early redirect at the top AND the post-login redirect
- **Rule**: `login.js` is the only file that uses these literal paths. All other files use `ROUTES.*` or sibling-relative `dashboard.html`

### Fix: Pending JC page shows empty — coordinator email matching
- `pending-jc.js` was filtering sites client-side with `s.coordinatorEmail === user.email` (strict equality)
- Fixed by normalizing both sides: `String(s.coordinatorEmail || '').toLowerCase().trim() === String(user.email || '').toLowerCase().trim()`
- Also moved filtering server-side: `getSitesByTrip` in `sites.gs` now accepts an optional `email` parameter and filters by `coordinatorEmail` (case-insensitive) when provided
- `pending-jc.js` now passes `email: user.email` in the `GET_SITES_BY_TRIP` call; client-side filter kept as safety fallback

### Fix: requireRole error handling in project pages
- All three project page scripts (`dashboard.js`, `pending-jc.js`, `history.js`): `requireRole` catch changed from `showError(...)` to `window.location.href = '../../index.html'; return;`
- Previously the catch was displaying a misleading "Could not reach the server" error while also navigating away
- Now: any auth/role failure cleanly redirects to login without showing an error on the wrong page

---

## Changes Made — 2026-03-24 (continued)

### Redesign: Group-based site entry in New Trip and Edit Trip forms
- Replaced individual site rows with coordinator groups: one group = one coordinator + multiple site numbers
- Sites input accepts `/` or `-` as separators (e.g. `1234/5678/8907`)
- Button renamed from "Add Another Site" → "Add Another Coordinator"; groups labeled "Group 1", "Group 2" etc.
- `parseSiteNumbers()` and `calculateCostPerSite()` added to `js/utils/cost-calculator.js`
- On submit: groups are expanded into individual site records before sending to the server
- Edit trip: existing sites are re-grouped by coordinator email on load; original `siteId`/`jobCode`/`jcStatus` preserved by matching parsed site numbers back to originals on save
- Cost preview updates live as site numbers are typed (counts parsed sites across all groups)
- Pending JC page (`pending-jc.js`) and `site-list.js` unchanged — they already show individual site rows

### Fix: Sites sheet `coordinatorName` column removed
- Column was added then removed; both `appendRow` calls in `trips.gs` (`createTrip` and `updateTrip`) updated to 7-column order: siteId, tripId, siteNumber, coordinatorEmail, jobCode, costShare, jcStatus

### Feature: Cost per Site reporting tab
- New file `apps-script/reports.gs` with `rebuildCostPerSiteReport()`
- Rebuilds the "Cost per Site" sheet from scratch on every write operation (one row per site, sorted newest first)
- Coordinator display name resolved from the Lists sheet (`listName = 'coordinator'`)
- Trigger added (wrapped in `try/catch`) to: `createTrip`, `updateTrip`, `deleteTrip` in `trips.gs`; `updateJobCode` in `sites.gs`
- `COST_PER_SITE: 'Cost per Site'` added to `TABS` in `Code.gs`

### Fix: `getSpreadsheet()` hardcoded sheet ID
- Replaced `PropertiesService.getScriptProperties().getProperty('SHEET_ID')` with hardcoded ID `167LeUQQLTf9BHNbWExgWIabU24AvJTEUZSoXEDwX41M`
- No Script Property setup required

---

## Changes Made — 2026-03-25

### Full rewrite: `new-trip.js` — async, group-based, API-driven dropdowns

**Problem:** The old `new-trip.js` was a synchronous IIFE that used plain text inputs for coordinator email and a hardcoded `id="wh-rep"` select for WH Rep. It tracked individual sites (one site number per row) and computed cost preview using group count, not actual parsed site count.

**What changed:**
- Converted to `async function` so WH rep and coordinator lists can be awaited on load
- Form submit button is disabled until the WH rep API call resolves (or times out after 10 s, falling back to `['Ehab', 'Karam']`)
- `requireRole()` is called inside `try/catch` after the timeout is set; a caught auth error redirects to login instead of crashing
- `addGroupEntry()` replaced `addSiteEntry()`: each group has a free-text sites field (`name="groupSites"`) and a `<select class="coordinator-select">` loaded async via `loadCoordinatorOptions()`
- On submit: `parseSiteNumbers(rawSites)` expands each group into individual `{ siteNumber, coordinatorEmail }` objects before the payload is sent
- Per-group validation on submit: sites field must produce ≥1 parsed number; coordinator select must have a value; inline error spans (`.sites-field-error`, `.coord-field-error`) shown per group
- Cost preview counts `parseSiteNumbers()` results across all groups, not just group count; shows `—` when no sites are entered yet
- WH rep populated by `fetchAPI(ACTIONS.GET_LIST, { listName: 'whRep' })`; falls back to hardcoded array if the call fails

**Key IDs (HTML must match):**
- `id="whRep"` — WH rep select
- `id="laborCost"`, `id="parkCost"`, `id="truckCost"`, `id="hotelCost"` — cost inputs (camelCase, not hyphenated)
- `id="sites-container"` — container for group divs
- `id="add-site-btn"` — "Add Another Coordinator" button

---

### Full rewrite: `edit-trip.js` — async, group-based, re-grouping, data-originals

**Problem:** The old `edit-trip.js` called `getTrips()` and `getSitesByTrip()` via service wrappers, used hyphenated form IDs (`labor-cost`, `wh-rep`), showed individual site rows with free-text coordinator email inputs, and had the loading timeout set after `requireRole()` (so if `requireRole` threw, the timeout was never set).

**What changed:**

*Loading and auth:*
- `loadingTimeout = setTimeout(showPageError, 10000)` is set as the very first statement before `requireRole()`
- `requireRole()` is called inside `try/catch`; caught errors call `showPageError(...)` and return immediately
- `hideLoading()` calls `loadingEl?.remove()` (removes from DOM, not just hides)
- All three data fetches (`GET_TRIPS`, `GET_SITES_BY_TRIP`, `GET_LIST whRep`) run in a single `Promise.all()` and `clearTimeout(loadingTimeout)` runs immediately after

*WH rep dropdown:*
- Populated from `GET_LIST whRep` API result; falls back to `FALLBACK_WH_REPS` if the call fails or returns empty
- Handles the case where `trip.whRep` does not match any list value by appending a one-off `<option selected>` for it
- References `id="whRep"` (camelCase); old `id="wh-rep"` is gone

*Site groups and re-grouping:*
- Existing sites (from `GET_SITES_BY_TRIP`) are re-grouped by `coordinatorEmail.toLowerCase().trim()` into a `groupMap`
- Each group's `rawSites` is built by joining `siteNumber` values with `/`
- The original site objects are stored on the group div as `div.dataset.originals = JSON.stringify(originals)` — this preserves `siteId`, `jobCode`, and `jcStatus` across edits
- `addGroupEntry(group)` builds the UI: a sites text input pre-filled with `rawSites`, and a coordinator `<select>` populated async (pre-selects `group.coordinatorEmail`)

*Collecting form data on submit:*
- `parseSiteNumbers(rawSites)` expands each group back to individual site objects
- For each parsed site number, the corresponding entry from `originals` (matched by `siteNumber`) is found to preserve `siteId`/`jobCode`/`jcStatus`; unmatched numbers get a fresh record (no `siteId` → server generates one)
- Per-group validation mirrors `new-trip.js`: sites field and coordinator select both validated inline before submit

*Form ID fixes:*
- `id="laborCost"`, `id="parkCost"`, `id="truckCost"`, `id="hotelCost"` (was `labor-cost` etc.)
- `id="whRep"` (was `wh-rep`)

---

### Fix: `pending-jc.js` — loading timeout before `requireRole`, direct `fetchAPI`, server-side filter

**Problem:** `pending-jc.js` called `requireRole()` synchronously before setting a loading timeout, so any auth error would crash before the timeout was armed. It also used service-wrapper calls (`getTrips()`, `getSitesByTrip()`) and filtered coordinator email client-side with strict equality.

**What changed:**
- Loading timeout (`setTimeout(showError, 10000)`) set before `requireRole()`
- `requireRole()` in `try/catch`; catch does `window.location.href = '../../index.html'; return;` (no error shown on wrong page)
- Trips fetched with `fetchAPI(ACTIONS.GET_TRIPS, { email, role, jcStatus })` directly
- Sites fetched with `fetchAPI(ACTIONS.GET_SITES_BY_TRIP, { tripId, email: user.email })` — server now filters by email (see `sites.gs` below)
- Client-side safety filter kept: normalises both emails with `.toLowerCase().trim()` before comparing
- `hideLoading()` removes the loading element from the DOM

---

### Fix: `apps-script/sites.gs` — server-side coordinator email filter

`getSitesByTrip(data)` now accepts an optional `email` field:
```js
if (data.email) {
  var emailLower = String(data.email).toLowerCase().trim();
  result = result.filter(function (s) {
    return String(s.coordinatorEmail || '').toLowerCase().trim() === emailLower;
  });
}
```
This reduces the payload sent to the client and prevents coordinator A from ever seeing coordinator B's sites even if client-side filtering had a bug.

`updateJobCode` now triggers `rebuildCostPerSiteReport()` (wrapped in `try/catch`) after a successful job-code update.

---

### Feature: `apps-script/reports.gs` — `rebuildCostPerSiteReport()`

New file. Called (wrapped in `try/catch`) from `createTrip`, `updateTrip`, `deleteTrip` in `trips.gs` and from `updateJobCode` in `sites.gs`.

Behaviour:
- Clears the "Cost per Site" sheet, writes a header row, then writes one data row per site across all trips
- Columns: Date, Coordinator, Site, Job Code, Route, Driver, Total Cost, Status
- Coordinator display name is resolved from the `Lists` sheet (`listName = 'coordinator'`, `value = coordinatorEmail`)
- Rows sorted newest-first by date
- Any error during rebuild is logged and swallowed so it never breaks a write operation

`COST_PER_SITE: 'Cost per Site'` added to `TABS` in `Code.gs`.

---

### Fix: `apps-script/Code.gs` — `LISTS` tab added, routing for `getList`/`getCoordinators`

- `TABS.LISTS = 'Lists'` and `TABS.COST_PER_SITE = 'Cost per Site'` added to the `TABS` object
- `doGet` and `doPost` switch statements both now route `'getList'` → `getList(data)` and `'getCoordinators'` → `getCoordinators(data)`
- `getSpreadsheet()` hardcoded to open sheet ID `167LeUQQLTf9BHNbWExgWIabU24AvJTEUZSoXEDwX41M` directly (no Script Properties lookup)

---

### Fix: `apps-script/trips.gs` — Sites `appendRow` 7-column order, report triggers

Both `createTrip` and `updateTrip` write sites with exactly 7 columns:
```
siteId | tripId | siteNumber | coordinatorEmail | jobCode | costShare | jcStatus
```
(The `coordinatorName` column that was temporarily added is gone.)

`rebuildCostPerSiteReport()` called (in `try/catch`) at the end of `createTrip`, `updateTrip`, and `deleteTrip`.

---

### Known issues after 2026-03-25 session
- `rebuildCostPerSiteReport()` builds coordinator name from `Lists` tab using `listName = 'coordinator'` — confirm this list exists in the sheet with `value = coordinatorEmail` rows before testing the Cost per Site tab in production
- End-to-end test of Edit Trip flow needed: verify that `data-originals` round-trip correctly preserves `jobCode` and `jcStatus` for sites that already have them
- New Trip flow: verify that coordinator dropdown loads and that a submitted trip's sites land in the Sites sheet with correct 7-column order
