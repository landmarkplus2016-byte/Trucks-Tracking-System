/**
 * notifications.gs — Email + in-app notifications
 * ──────────────────────────────────────────────────
 * Notifications sheet columns (in order):
 *   notifId | toEmail | tripId | message | isRead | createdAt
 */

/**
 * Send an email and store an in-app notification record.
 *
 * @param {{ toEmail: string, tripId: string, message: string }} data
 * @returns {{ success: boolean }}
 */
function sendEmailNotification(data) {
  var toEmail = String(data.toEmail || '').trim();
  var tripId  = String(data.tripId  || '');
  var message = String(data.message || '');

  if (!toEmail || !message) {
    return { success: false, error: 'toEmail and message are required.' };
  }

  // Write notification record
  var notifId   = generateId('NOTIF');
  var createdAt = new Date().toISOString();
  getSheet(TABS.NOTIFICATIONS).appendRow([
    notifId,
    toEmail,
    tripId,
    message,
    false,       // isRead
    createdAt,
  ]);

  // Send email via Gmail
  try {
    var subject = 'Trucks Tracking System — New Trip ' + tripId;
    var body    = 'Hello,\n\n'
                + message + '\n\n'
                + 'Please log in to the Trucks Tracking System to enter the Job Code(s) for your site(s).\n\n'
                + 'This is an automated notification.';
    GmailApp.sendEmail(toEmail, subject, body);
  } catch (emailErr) {
    // Log but don't fail — in-app notification was already stored
    Logger.log('Email send failed to ' + toEmail + ': ' + emailErr.message);
  }

  return { success: true };
}

/**
 * Get all unread notifications for a given email address.
 *
 * @param {{ email: string }} data
 * @returns {{ success: boolean, data: Object[] }}
 */
function getUnreadNotifications(data) {
  var email = String(data.email || '').trim().toLowerCase();
  if (!email) return { success: false, error: 'email is required.' };

  var notifs = sheetToObjects(getSheet(TABS.NOTIFICATIONS));
  var unread = notifs.filter(function (n) {
    return String(n.toEmail || '').trim().toLowerCase() === email
        && String(n.isRead) !== 'true'
        && n.isRead !== true;
  });

  return { success: true, data: unread };
}

/**
 * Mark a single notification as read.
 *
 * @param {{ notifId: string }} data
 * @returns {{ success: boolean }}
 */
function markNotifRead(data) {
  var notifId = data.notifId;
  if (!notifId) return { success: false, error: 'notifId is required.' };

  var sheet   = getSheet(TABS.NOTIFICATIONS);
  var values  = sheet.getDataRange().getValues();
  var headers = values[0];
  var idCol   = headers.indexOf('notifId');
  var readCol = headers.indexOf('isRead');

  for (var i = 1; i < values.length; i++) {
    if (values[i][idCol] === notifId) {
      sheet.getRange(i + 1, readCol + 1).setValue(true);
      return { success: true };
    }
  }

  return { success: false, error: 'Notification not found: ' + notifId };
}
