# Trucks Tracking System

A fleet cost-tracking web app for the Telecom Department.
Built with plain HTML / CSS / Vanilla JS — no build tools required.
Hosted on GitHub Pages. Backend is Google Apps Script + Google Sheets.

---

## Roles

| Role | Can do |
|---|---|
| **Fleet Coordinator** | Create / edit / delete trips, add sites, view cost breakdowns |
| **Project Coordinator** | Receive notifications, enter Job Codes for their sites, view history |

---

## Quick Start (first-time setup)

### 1. Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet.
2. Rename **Sheet1** to `Trips` and add these headers in row 1 (exact spelling):

   ```
   tripId | date | whRep | driver | route | laborCost | parkCost | truckCost | hotelCost | totalCost | status | createdBy | createdAt
   ```

3. Add three more tabs and their headers:

   **Sites**
   ```
   siteId | tripId | siteNumber | coordinatorEmail | jobCode | costShare | jcStatus
   ```

   **Users**
   ```
   userId | name | email | role | password
   ```

   **Notifications**
   ```
   notifId | toEmail | tripId | message | isRead | createdAt
   ```

4. Add your users to the **Users** tab. Example row:
   ```
   USER-001 | Alice Fleet | alice@company.com | fleet | mypassword
   ```

### 2. Deploy the Apps Script

1. In your Google Sheet, open **Extensions → Apps Script**.
2. Delete the default `Code.gs` content.
3. Create one file for each `.gs` file in the `apps-script/` folder of this repo.
   Copy-paste the contents of each file into the corresponding Apps Script file.
4. Click **Deploy → New deployment**.
   - Type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone** (required for GitHub Pages to reach it)
5. Click **Deploy** and copy the Web App URL.

### 3. Update the App URL

Open `js/config/config.js` and replace the placeholder:

```js
APPS_SCRIPT_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',
```

with your actual Web App URL.

### 4. Push to GitHub Pages

```bash
# Initialize repo (if not done yet)
git init
git remote add origin https://github.com/YOUR_USERNAME/trucks-tracking-system.git

# Stage and commit everything
git add .
git commit -m "Initial commit: Trucks Tracking System"

# Push to main
git push -u origin main
```

Then in your GitHub repo:
**Settings → Pages → Source → Deploy from branch → main / (root)**

Your app will be live at:
`https://YOUR_USERNAME.github.io/trucks-tracking-system/`

---

## Project Structure

```
index.html                  ← Login (entry point)
pages/
  fleet/
    dashboard.html
    new-trip.html
    edit-trip.html
    history.html
  project/
    dashboard.html
    pending-jc.html
    history.html
css/
  base/                     ← variables, reset, typography, layout
  components/               ← button, input, card, table, etc.
  pages/                    ← per-page styles
js/
  config/config.js          ← APPS_SCRIPT_URL (only here)
  constants/index.js        ← ROLES, TRIP_STATUS, JC_STATUS, ROUTES
  types/schemas.js          ← JSDoc type definitions
  utils/                    ← cost-calculator, date-formatter, validator
  services/                 ← api, auth, trips, sites, notify
  components/               ← navbar, notification-bell, modal, etc.
  pages/                    ← per-page scripts
apps-script/                ← Google Apps Script .gs files
```

---

## Cost Calculation

```
costPerSite        = totalTripCost ÷ totalSites
coordinatorTotal   = costPerSite × coordinatorSiteCount
```

Logic lives only in `js/utils/cost-calculator.js` (client) and `apps-script/costs.gs` (server).

---

## Re-deploying After Changes

After editing any Apps Script file:
1. **Deploy → Manage deployments → Edit (pencil icon)**
2. Change version to **New version**
3. Click **Deploy**

The URL stays the same — no need to update `config.js`.

---

## Adding PWA Icons

Place 192×192 and 512×512 PNG icons at:
```
assets/icons/icon-192.png
assets/icons/icon-512.png
```

Users can then "Add to Home Screen" on mobile.
