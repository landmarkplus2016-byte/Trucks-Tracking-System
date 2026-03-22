/**
 * auth.gs — User authentication and role resolution.
 *
 * Reads from the "Users" tab in Google Sheets.
 * Expected columns (row 1 = headers):
 *   A: userId | B: name | C: email | D: role | E: password
 *
 * NOTE: Storing passwords in plain text in a Sheet is acceptable for an
 * internal-only tool, but for production you should hash passwords (e.g.
 * with Utilities.computeDigest) and never store them in plain text.
 */

var USERS_SHEET = 'Users';

/**
 * Validates a user's credentials.
 * Returns { success: true, data: User } on success,
 * or { success: false, error: "…" } on failure.
 *
 * @param {string} email    - The user's email address.
 * @param {string} password - The user's plain-text password.
 * @returns {{ success: boolean, data?: object, error?: string }}
 */
function validateUser(email, password) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(USERS_SHEET);
  if (!sheet) return { success: false, error: 'Users sheet not found.' };

  var data = sheet.getDataRange().getValues();
  // Row 0 is the header row — skip it
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rowEmail    = String(row[2]).trim().toLowerCase();
    var rowPassword = String(row[4]).trim();
    if (rowEmail === email.trim().toLowerCase() && rowPassword === password) {
      return {
        success: true,
        data: {
          userId: String(row[0]),
          name:   String(row[1]),
          email:  String(row[2]),
          role:   String(row[3]),
        },
      };
    }
  }
  return { success: false, error: 'Invalid email or password.' };
}

/**
 * Returns all users with the "project" role.
 * Used by the fleet coordinator when building a new trip so they can
 * assign sites to coordinators.
 *
 * @returns {{ success: boolean, data?: object[], error?: string }}
 */
function getProjectCoordinators() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(USERS_SHEET);
  if (!sheet) return { success: false, error: 'Users sheet not found.' };

  var data = sheet.getDataRange().getValues();
  var coordinators = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (String(row[3]).trim().toLowerCase() === 'project') {
      coordinators.push({
        userId: String(row[0]),
        name:   String(row[1]),
        email:  String(row[2]),
        role:   String(row[3]),
      });
    }
  }
  return { success: true, data: coordinators };
}

/**
 * Returns the role of a user identified by email.
 * Returns null if the user is not found.
 *
 * @param {string} email - The user's email address.
 * @returns {string|null} - "fleet" | "project" | null
 */
function getUserRole(email) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(USERS_SHEET);
  if (!sheet) return null;

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][2]).trim().toLowerCase() === email.trim().toLowerCase()) {
      return String(data[i][3]).trim().toLowerCase();
    }
  }
  return null;
}
