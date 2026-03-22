# Trucks Tracking System (TTS)

A Progressive Web App (PWA) for managing truck fleet trips, cost allocation, and job code entry across Fleet Coordinators and Project Coordinators.

**Stack:** React + TypeScript + Vite · Google Apps Script · Google Sheets · GitHub Pages · CSS Modules

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Google Sheets Setup](#google-sheets-setup)
4. [Apps Script Deployment](#apps-script-deployment)
5. [GitHub Repository Setup](#github-repository-setup)
6. [GitHub Actions / CI-CD Setup](#github-actions--ci-cd-setup)
7. [Project Structure](#project-structure)
8. [Environment Variables](#environment-variables)
9. [Cost Calculation Rules](#cost-calculation-rules)
10. [Role Reference](#role-reference)

---

## Prerequisites

| Tool | Minimum Version |
|---|---|
| Node.js | 20.x |
| npm | 10.x |
| Git | any recent version |
| Google account | — |
| GitHub account | — |

---

## Local Development Setup

```bash
# 1. Clone the repo (after pushing — see GitHub Repository Setup below)
git clone https://github.com/<YOUR_USERNAME>/trucks-tracking-system.git
cd trucks-tracking-system

# 2. Install dependencies
npm install

# 3. Create your local .env file
cp .env.example .env
# Then open .env and paste your Apps Script Web App URL

# 4. Start the dev server
npm run dev
# → http://localhost:5173/trucks-tracking-system/

# 5. Build for production (optional local test)
npm run build
npm run preview
```

---

## Google Sheets Setup

1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet.
2. Name it: **Trucks Tracking System**
3. Create the following tabs (right-click a tab → **Rename**):

### Tab: `Trips`
| A | B | C | D | E | F | G | H | I | J | K | L | M |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| tripId | date | whRep | driver | route | laborCost | parkCost | truckCost | hotelCost | totalCost | status | createdBy | createdAt |

### Tab: `Sites`
| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| siteId | tripId | siteNumber | coordinatorEmail | jobCode | costShare | jcStatus |

### Tab: `Users`
| A | B | C | D | E |
|---|---|---|---|---|
| userId | name | email | role | password |

Add at least one user per role to get started:

| userId | name | email | role | password |
|---|---|---|---|---|
| u001 | Fleet Manager | fleet@example.com | fleet | changeme123 |
| u002 | Project Coord 1 | coord1@example.com | project | changeme123 |
| u003 | Project Coord 2 | coord2@example.com | project | changeme123 |

### Tab: `Notifications`
| A | B | C | D | E | F |
|---|---|---|---|---|---|
| notifId | toEmail | tripId | message | isRead | createdAt |

> **Note:** Row 1 of every tab must contain the column headers exactly as shown. Apps Script reads by column position, not by header name.

---

## Apps Script Deployment

1. In your Google Sheet, go to **Extensions → Apps Script**.
2. The script editor opens. **Delete** the default `Code.gs` content.
3. For each `.gs` file in the `apps-script/` folder of this repo, create a corresponding file in the script editor:
   - Click **+** next to "Files" → **Script**
   - Name it exactly (e.g. `trips`, `sites`, `costs`, `notifications`, `auth`)
   - Paste the contents of the matching `.gs` file

   Files to create:
   - `Code` ← paste `apps-script/Code.gs`
   - `trips` ← paste `apps-script/trips.gs`
   - `sites` ← paste `apps-script/sites.gs`
   - `costs` ← paste `apps-script/costs.gs`
   - `notifications` ← paste `apps-script/notifications.gs`
   - `auth` ← paste `apps-script/auth.gs`

4. Click **Deploy → New deployment**.
5. Click the gear icon next to **Type** → select **Web app**.
6. Fill in:
   - **Description:** `TTS v1`
   - **Execute as:** `Me`
   - **Who has access:** `Anyone` *(required for the React app to call it)*
7. Click **Deploy**.
8. Authorize the script (Google will ask for Gmail and Sheets permissions).
9. **Copy the Web app URL** — it looks like:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```
10. Paste this URL into your `.env` file:
    ```
    VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycb.../exec
    ```
11. Also add it as a **GitHub Secret** (see next section).

> **Redeployment:** Any time you change a `.gs` file, go to **Deploy → Manage deployments → Edit (pencil icon) → New version → Deploy**.

---

## GitHub Repository Setup

```bash
# 1. Inside the project folder, initialize git
git init

# 2. Stage all files
git add .

# 3. First commit
git commit -m "Initial commit: Trucks Tracking System"

# 4. Create a new repo on GitHub (do NOT initialize with README)
#    Then connect and push:
git remote add origin https://github.com/<YOUR_USERNAME>/trucks-tracking-system.git
git branch -M main
git push -u origin main
```

---

## GitHub Actions / CI-CD Setup

The workflow file at `.github/workflows/deploy.yml` runs automatically on every push to `main`. It:
1. Installs dependencies (`npm ci`)
2. Injects environment variables from GitHub Secrets
3. Runs `npm run build`
4. Deploys the `/dist` folder to GitHub Pages

### Steps to enable GitHub Pages + Secrets:

1. Go to your repo on GitHub → **Settings → Pages**
2. Under **Source**, select **GitHub Actions**
3. Go to **Settings → Secrets and variables → Actions → New repository secret**
4. Add:
   - **Name:** `VITE_APPS_SCRIPT_URL`
   - **Value:** your Apps Script Web App URL

5. Push any change to `main` to trigger the first deployment.
6. Your app will be live at:
   ```
   https://<YOUR_USERNAME>.github.io/trucks-tracking-system/
   ```

---

## Project Structure

```
src/
  components/
    common/          Button, Input, Card, NotificationBell
    fleet/           TripForm, CostSummary, SiteList
    project/         JCEntry, SiteCostBreakdown
  pages/
    Login/
    fleet/           Dashboard, NewTrip, History
    project/         Dashboard, PendingJC, History
  hooks/             useAuth, useTrips, useNotifications
  services/          sheets.service, auth.service, notify.service
  styles/            colors.ts, typography.ts, spacing.ts, theme.ts, global.css
  types/             index.ts  (all TypeScript interfaces)
  constants/         index.ts  (all app constants)
  utils/             cost-calculator.ts, date-formatter.ts
  App.tsx            BrowserRouter wrapper
  AppLayout.tsx      Top nav + Outlet layout
  router.tsx         Role-based route definitions
  main.tsx           ReactDOM entry point

apps-script/         Code.gs, trips.gs, sites.gs, costs.gs, notifications.gs, auth.gs
public/              manifest.json, favicon.svg, icons/
.github/workflows/   deploy.yml
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_APPS_SCRIPT_URL` | Yes | Google Apps Script Web App URL |

All `VITE_` prefixed variables are embedded at build time by Vite. They are **not secret at runtime** (they appear in the compiled JS). Use Google Apps Script's own authorization to protect your Sheet data.

---

## Cost Calculation Rules

```
totalCost    = laborCost + parkCost + truckCost + hotelCost
costPerSite  = totalCost / totalSites          (rounded to 2 dp)
coordTotal   = costPerSite × coordSiteCount    (rounded to 2 dp)
```

- Implemented in TypeScript: [`src/utils/cost-calculator.ts`](src/utils/cost-calculator.ts)
- Mirrored in Apps Script: [`apps-script/costs.gs`](apps-script/costs.gs)

---

## Role Reference

| Role | Can do |
|---|---|
| **fleet** | Create / edit / delete trips · Assign sites to coordinators · See full cost breakdown |
| **project** | View trips that include their sites · Enter / edit Job Codes · See their cost share |

---

## PWA Icons

The `public/icons/` folder is referenced in `manifest.json` but the PNG files are **not included** in this repo. Generate them from `public/favicon.svg` using a tool such as:

- [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator): `npx pwa-asset-generator public/favicon.svg public/icons`
- Or any online icon generator (e.g. realfavicongenerator.net)

Required sizes: 72, 96, 128, 144, 152, 192, 384, 512 px.

---

*Built with React + TypeScript + Vite · Backend: Google Apps Script · Database: Google Sheets*
