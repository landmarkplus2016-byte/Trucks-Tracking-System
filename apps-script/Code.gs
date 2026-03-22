/**
 * Code.gs — Main entry point
 * ──────────────────────────
 * Handles all incoming POST requests from the web app.
 * Routes by the 'action' parameter to the correct handler.
 * Every response is JSON with { success, data } or { success, error }.
 */

/** Sheet tab names — keep in sync with client SHEET_TABS constant */
var TABS = {
  TRIPS:         'Trips',
  SITES:         'Sites',
  USERS:         'Users',
  NOTIFICATIONS: 'Notifications',
};

/**
 * Entry point for all HTTP POST requests.
 * @param {GoogleAppsScript.Events.DoPost} e
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function doPost(e) {
  var action = e.parameter.action || '';
  var data   = {};

  try {
    data = JSON.parse(e.parameter.data || '{}');
  } catch (err) {
    return jsonResponse({ success: false, error: 'Invalid request data.' });
  }

  try {
    switch (action) {
      // Auth
      case 'login':
        return jsonResponse(validateUser(data));

      // Trips
      case 'getTrips':
        return jsonResponse(getTrips(data));
      case 'createTrip':
        return jsonResponse(createTrip(data));
      case 'updateTrip':
        return jsonResponse(updateTrip(data));
      case 'deleteTrip':
        return jsonResponse(deleteTrip(data));

      // Sites
      case 'getSitesByTrip':
        return jsonResponse(getSitesByTrip(data));
      case 'updateJobCode':
        return jsonResponse(updateJobCode(data));

      // Cost
      case 'getCostBreakdown':
        return jsonResponse(getCostBreakdown(data));

      // Notifications
      case 'getUnreadNotifications':
        return jsonResponse(getUnreadNotifications(data));
      case 'markNotifRead':
        return jsonResponse(markNotifRead(data));

      default:
        return jsonResponse({ success: false, error: 'Unknown action: ' + action });
    }
  } catch (err) {
    Logger.log('doPost error [' + action + ']: ' + err.message);
    return jsonResponse({ success: false, error: 'Server error: ' + err.message });
  }
}

/**
 * Required for CORS preflight from GitHub Pages.
 * @param {GoogleAppsScript.Events.DoGet} e
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function doGet(e) {
  return jsonResponse({ success: true, message: 'Trucks Tracking System API is running.' });
}

/**
 * Wrap a result object as a CORS-enabled JSON response.
 * @param {Object} obj
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function jsonResponse(obj) {
  var output = ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}

/**
 * Get a sheet tab by name from the active spreadsheet.
 * @param {string} tabName
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getSheet(tabName) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) throw new Error('Sheet tab not found: ' + tabName);
  return sheet;
}

/**
 * Convert a sheet's data rows to an array of objects using the header row as keys.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @returns {Object[]}
 */
function sheetToObjects(sheet) {
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0];
  return values.slice(1).map(function (row) {
    var obj = {};
    headers.forEach(function (h, i) { obj[h] = row[i]; });
    return obj;
  });
}

/**
 * Generate a simple unique ID with a prefix.
 * @param {string} prefix  e.g. "TRIP", "SITE"
 * @returns {string}
 */
function generateId(prefix) {
  return prefix + '-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
}
