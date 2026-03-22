/**
 * sites.gs — CRUD operations for the Sites tab.
 *
 * Expected Sites columns (row 1 = headers):
 *   A: siteId | B: tripId | C: siteNumber | D: coordinatorEmail
 *   E: jobCode | F: costShare | G: jcStatus
 */

var SITES_SHEET = 'Sites';

/**
 * Returns all sites belonging to a specific trip.
 *
 * @param {string} tripId - The trip's unique identifier.
 * @returns {{ success: boolean, data?: object[], error?: string }}
 */
function getSitesByTrip(tripId) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SITES_SHEET);
  if (!sheet) return { success: false, error: 'Sites sheet not found.' };

  var data = sheet.getDataRange().getValues();
  var sites = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0]) continue;
    if (String(row[1]) === String(tripId)) {
      sites.push(rowToSite(row));
    }
  }
  return { success: true, data: sites };
}

/**
 * Returns all sites assigned to a specific project coordinator.
 *
 * @param {string} coordinatorEmail - The coordinator's email address.
 * @returns {{ success: boolean, data?: object[], error?: string }}
 */
function getSitesByCoordinator(coordinatorEmail) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SITES_SHEET);
  if (!sheet) return { success: false, error: 'Sites sheet not found.' };

  var data = sheet.getDataRange().getValues();
  var sites = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0]) continue;
    if (String(row[3]).trim().toLowerCase() === coordinatorEmail.trim().toLowerCase()) {
      sites.push(rowToSite(row));
    }
  }
  return { success: true, data: sites };
}

/**
 * Updates the Job Code for a single site and changes its jcStatus to ENTERED.
 * If all sites in the parent trip now have a JC, the trip status is set to COMPLETE.
 *
 * @param {string} siteId  - The site's unique identifier.
 * @param {string} jobCode - The new Job Code value.
 * @returns {{ success: boolean, data?: object, error?: string }}
 */
function updateJobCode(siteId, jobCode) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SITES_SHEET);
  if (!sheet) return { success: false, error: 'Sites sheet not found.' };

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(siteId)) {
      var row = i + 1; // Sheets rows are 1-indexed
      sheet.getRange(row, 5).setValue(jobCode);   // Column E: jobCode
      sheet.getRange(row, 7).setValue('ENTERED'); // Column G: jcStatus

      var updatedSite = rowToSite(sheet.getRange(row, 1, 1, 7).getValues()[0]);

      // Check if all sites for this trip are now ENTERED — if so, mark trip COMPLETE
      checkAndCompleteTripIfAllJcEntered(updatedSite.tripId);

      return { success: true, data: updatedSite };
    }
  }
  return { success: false, error: 'Site not found: ' + siteId };
}

/**
 * Appends a new site row to the Sites sheet.
 * Called internally from trips.gs when a trip is created.
 *
 * @param {string} tripId             - Parent trip ID.
 * @param {string} siteNumber         - The site number/identifier.
 * @param {string} coordinatorEmail   - Email of the assigned coordinator.
 * @param {number} costShare          - Pre-calculated cost share for this site.
 */
function appendSite(tripId, siteNumber, coordinatorEmail, costShare) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SITES_SHEET);
  if (!sheet) return;

  var siteId = Utilities.getUuid();
  sheet.appendRow([siteId, tripId, siteNumber, coordinatorEmail, '', costShare, 'PENDING']);
}

/**
 * Deletes all site rows associated with a given tripId.
 * Called internally from trips.gs when a trip is deleted.
 *
 * @param {string} tripId - The parent trip's ID.
 */
function deleteSitesByTrip(tripId) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SITES_SHEET);
  if (!sheet) return;

  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][1]) === String(tripId)) {
      sheet.deleteRow(i + 1);
    }
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Converts a raw Sheets row array into a Site object.
 *
 * @param {Array} row
 * @returns {object} Site
 */
function rowToSite(row) {
  return {
    siteId:           String(row[0]),
    tripId:           String(row[1]),
    siteNumber:       String(row[2]),
    coordinatorEmail: String(row[3]),
    jobCode:          String(row[4] || ''),
    costShare:        Number(row[5]) || 0,
    jcStatus:         String(row[6] || 'PENDING'),
  };
}

/**
 * Checks whether all sites for a given trip have jcStatus === ENTERED.
 * If yes, updates the trip's status to COMPLETE in the Trips sheet.
 *
 * @param {string} tripId
 */
function checkAndCompleteTripIfAllJcEntered(tripId) {
  var sitesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SITES_SHEET);
  var tripsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Trips');
  if (!sitesSheet || !tripsSheet) return;

  var sitesData = sitesSheet.getDataRange().getValues();
  var allEntered = true;
  var foundSite = false;

  for (var i = 1; i < sitesData.length; i++) {
    if (String(sitesData[i][1]) === String(tripId)) {
      foundSite = true;
      if (String(sitesData[i][6]) !== 'ENTERED') {
        allEntered = false;
        break;
      }
    }
  }

  if (!foundSite || !allEntered) return;

  // Update trip status to COMPLETE
  var tripsData = tripsSheet.getDataRange().getValues();
  for (var j = 1; j < tripsData.length; j++) {
    if (String(tripsData[j][0]) === String(tripId)) {
      tripsSheet.getRange(j + 1, 11).setValue('COMPLETE'); // Column K: status
      break;
    }
  }
}
