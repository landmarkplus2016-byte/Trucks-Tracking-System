# CLAUDE.md — Trucks Tracking System

Developer notes for Claude. Read this before making any changes.

---

## Tech Stack

- **Frontend:** Plain HTML5 + CSS3 + Vanilla JS (ES6+) — no build tools, no npm, no frameworks
- **Backend:** Google Apps Script deployed as a Web App
- **Database:** Google Sheets (one file, four tabs)
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
`SpreadsheetApp.getActiveSpreadsheet()` returns `null` when running as a deployed Web App (no active spreadsheet context). **Always use `getSpreadsheet()`** defined in `Code.gs`:

```js
function getSpreadsheet() {
  var id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  return SpreadsheetApp.openById(id);
}
```

The sheet ID must be set as a Script Property named `SHEET_ID` (Project Settings → Script Properties).

### All sheet access goes through `getSheet(tabName)`
Defined in `Code.gs`. No other `.gs` file should call `SpreadsheetApp` directly — they all use `getSheet(TABS.*)`.

### Deployment
- Deploy as **Web App**, execute as **Me**, access **Anyone**
- After any `.gs` change: **Deploy → Manage deployments → Edit → New version → Deploy**
- The URL does not change on redeploy — no need to update `config.js`
- CORS is handled by `ContentService.createTextOutput(...).setMimeType(MimeType.JSON)` — no extra headers needed

### Google Sheet tab names (must match `TABS` in `Code.gs`)
| Tab | Key columns |
|---|---|
| `Trips` | tripId, date, whRep, driver, route, laborCost, parkCost, truckCost, hotelCost, totalCost, status, createdBy, createdAt |
| `Sites` | siteId, tripId, siteNumber, coordinatorEmail, jobCode, costShare, jcStatus |
| `Users` | userId, name, email, role, password |
| `Notifications` | notifId, toEmail, tripId, message, isRead, createdAt |

---

## Apps Script URL

Stored in `js/config/config.js`:
```
https://script.google.com/macros/s/AKfycbzB-m5et53xdYwOjKQ71w87tSbAOnZJ09xL01hKMYmuKqWaB-csaBBByaSPijjgeeTS9Q/exec
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
