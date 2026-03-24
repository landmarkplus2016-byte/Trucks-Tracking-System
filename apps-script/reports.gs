/**
 * reports.gs — Sheet reporting
 * ─────────────────────────────
 * Rebuilds the "Cost per Site" tab from scratch whenever trips or
 * sites are created, updated, or deleted.
 * Never throws — always wrapped in try/catch at call sites.
 */

/**
 * Rebuilds the entire Cost per Site tab from scratch.
 * Called automatically whenever trips or sites are created/updated.
 */
function rebuildCostPerSiteReport() {
  var reportSheet = getSpreadsheet().getSheetByName(TABS.COST_PER_SITE);
  if (!reportSheet) return;

  // Get all data
  var trips = sheetToObjects(getSheet(TABS.TRIPS));
  var sites = sheetToObjects(getSheet(TABS.SITES));
  var lists = sheetToObjects(getSheet(TABS.LISTS));

  // Build coordinator name lookup: email (lowercase) -> display name
  var coordNames = {};
  lists.forEach(function (row) {
    if (String(row.listName).toLowerCase() === 'coordinator') {
      coordNames[String(row.value).toLowerCase().trim()] = row.label;
    }
  });

  // Build trip lookup: tripId -> trip
  var tripMap = {};
  trips.forEach(function (trip) {
    tripMap[trip.tripId] = trip;
  });

  // Build report rows — one row per site
  var reportRows = [];
  sites.forEach(function (site) {
    var trip = tripMap[site.tripId];
    if (!trip) return;

    var coordEmail = String(site.coordinatorEmail || '').toLowerCase().trim();
    var coordName  = coordNames[coordEmail] || site.coordinatorEmail || '';

    reportRows.push([
      trip.date ? new Date(trip.date) : '',
      coordName,
      site.siteNumber || '',
      site.jobCode    || '',
      trip.route      || '',
      trip.driver     || '',
      site.costShare  || 0,
      site.jcStatus   || 'pending',
    ]);
  });

  // Sort by date descending (newest first)
  reportRows.sort(function (a, b) {
    if (!a[0] && !b[0]) return 0;
    if (!a[0]) return 1;
    if (!b[0]) return -1;
    return new Date(b[0]) - new Date(a[0]);
  });

  // Clear existing data rows (keep header row 1)
  var lastRow = reportSheet.getLastRow();
  if (lastRow > 1) {
    reportSheet.getRange(2, 1, lastRow - 1, 8).clearContent();
  }

  // Write new data rows
  if (reportRows.length > 0) {
    reportSheet.getRange(2, 1, reportRows.length, 8).setValues(reportRows);
  }
}
