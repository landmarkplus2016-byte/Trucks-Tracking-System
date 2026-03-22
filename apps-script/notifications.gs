/**
 * notifications.gs — Email notifications and in-app notification management.
 *
 * Expected Notifications columns (row 1 = headers):
 *   A: notifId | B: toEmail | C: tripId | D: message | E: isRead | F: createdAt
 *
 * Email is sent via GmailApp.sendEmail() using the Google account that owns
 * the Apps Script project. No external email service is required.
 */

var NOTIF_SHEET = 'Notifications';

/**
 * Sends an email notification to every project coordinator whose sites are
 * in the given trip, then records the notification in the Notifications sheet.
 *
 * Called automatically after a trip is created.
 *
 * @param {string} tripId - The newly created trip's ID.
 * @returns {{ success: boolean, error?: string }}
 */
function sendEmailNotification(tripId) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var trips = ss.getSheetByName('Trips');
  var sites = ss.getSheetByName('Sites');
  var notifs = ss.getSheetByName(NOTIF_SHEET);

  if (!trips || !sites || !notifs) {
    return { success: false, error: 'One or more required sheets not found.' };
  }

  // Find the trip
  var tripsData = trips.getDataRange().getValues();
  var trip = null;
  for (var i = 1; i < tripsData.length; i++) {
    if (String(tripsData[i][0]) === String(tripId)) {
      trip = {
        tripId:    String(tripsData[i][0]),
        date:      String(tripsData[i][1]),
        route:     String(tripsData[i][4]),
        totalCost: Number(tripsData[i][9]) || 0,
        createdBy: String(tripsData[i][11]),
      };
      break;
    }
  }
  if (!trip) return { success: false, error: 'Trip not found: ' + tripId };

  // Collect unique coordinator emails for this trip
  var sitesData = sites.getDataRange().getValues();
  var emailsSeen = {};
  var coordinatorEmails = [];
  for (var j = 1; j < sitesData.length; j++) {
    if (String(sitesData[j][1]) === String(tripId)) {
      var email = String(sitesData[j][3]).trim().toLowerCase();
      if (email && !emailsSeen[email]) {
        emailsSeen[email] = true;
        coordinatorEmails.push(email);
      }
    }
  }

  var subject = '[TTS] New Trip on ' + trip.date + ' — Action Required';
  var createdAt = new Date().toISOString();

  coordinatorEmails.forEach(function(toEmail) {
    var message =
      'Hello,\n\n' +
      'A new trip has been submitted that includes your sites.\n\n' +
      'Trip Date : ' + trip.date + '\n' +
      'Route     : ' + trip.route + '\n' +
      'Total Cost: $' + trip.totalCost.toFixed(2) + '\n\n' +
      'Please log in to the Trucks Tracking System to enter your Job Codes:\n' +
      'https://<your-github-username>.github.io/trucks-tracking-system/project/pending-jc\n\n' +
      'This is an automated message — please do not reply.\n';

    // Send the email
    try {
      GmailApp.sendEmail(toEmail, subject, message);
    } catch (emailErr) {
      // Log but don't fail the whole operation if one email bounces
      Logger.log('Failed to send email to ' + toEmail + ': ' + emailErr.message);
    }

    // Record in Notifications sheet
    var notifId = Utilities.getUuid();
    var notifMessage = 'New trip on ' + trip.date + ' (' + trip.route + ') includes your sites. Please enter Job Codes.';
    notifs.appendRow([notifId, toEmail, tripId, notifMessage, false, createdAt]);
  });

  return { success: true };
}

/**
 * Returns all unread notifications for a given email address.
 *
 * @param {string} toEmail - The recipient's email address.
 * @returns {{ success: boolean, data?: object[], error?: string }}
 */
function getUnreadNotifications(toEmail) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOTIF_SHEET);
  if (!sheet) return { success: false, error: 'Notifications sheet not found.' };

  var data = sheet.getDataRange().getValues();
  var notifications = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0]) continue;
    var rowEmail  = String(row[1]).trim().toLowerCase();
    var isRead    = row[4] === true || String(row[4]).toLowerCase() === 'true';
    if (rowEmail === toEmail.trim().toLowerCase() && !isRead) {
      notifications.push(rowToNotif(row));
    }
  }
  // Sort newest first
  notifications.sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
  return { success: true, data: notifications };
}

/**
 * Marks a single notification as read by its ID.
 *
 * @param {string} notifId - The notification's unique identifier.
 * @returns {{ success: boolean, error?: string }}
 */
function markAsRead(notifId) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOTIF_SHEET);
  if (!sheet) return { success: false, error: 'Notifications sheet not found.' };

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(notifId)) {
      sheet.getRange(i + 1, 5).setValue(true); // Column E: isRead
      return { success: true };
    }
  }
  return { success: false, error: 'Notification not found: ' + notifId };
}

/**
 * Marks ALL notifications for a given email as read.
 *
 * @param {string} toEmail - The recipient's email address.
 * @returns {{ success: boolean, error?: string }}
 */
function markAllAsRead(toEmail) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOTIF_SHEET);
  if (!sheet) return { success: false, error: 'Notifications sheet not found.' };

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1]).trim().toLowerCase() === toEmail.trim().toLowerCase()) {
      sheet.getRange(i + 1, 5).setValue(true); // Column E: isRead
    }
  }
  return { success: true };
}

// ─── Internal helper ──────────────────────────────────────────────────────────

/**
 * Converts a raw Sheets row array into a Notification object.
 *
 * @param {Array} row
 * @returns {object} Notification
 */
function rowToNotif(row) {
  return {
    notifId:   String(row[0]),
    toEmail:   String(row[1]),
    tripId:    String(row[2]),
    message:   String(row[3]),
    isRead:    row[4] === true || String(row[4]).toLowerCase() === 'true',
    createdAt: String(row[5]),
  };
}
