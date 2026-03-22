/**
 * Code.gs — Main entry point for the Trucks Tracking System Apps Script Web App.
 *
 * All HTTP requests from the React frontend hit this file first.
 * doGet()  handles read operations (query params: action + optional filters).
 * doPost() handles write/mutation operations (JSON body: { action, ...payload }).
 *
 * Every function returns JSON via ContentService and sets CORS headers so the
 * React app hosted on GitHub Pages can call this endpoint from the browser.
 */

// ─── CORS helper ──────────────────────────────────────────────────────────────

/**
 * Wraps a plain JavaScript object in a ContentService TextOutput
 * with the correct MIME type and CORS headers.
 *
 * @param {object} data - The object to serialise as JSON.
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Wraps an error string in a standard { success: false, error: "…" } envelope.
 *
 * @param {string} message - Human-readable error message.
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function errorResponse(message) {
  return jsonResponse({ success: false, error: message });
}

// ─── doGet — read operations ──────────────────────────────────────────────────

/**
 * Handles all GET requests from the React frontend.
 * The 'action' query parameter determines which function to call.
 *
 * Supported actions:
 *   getTrips              → trips.gs: getTrips(createdBy?)
 *   getSitesByTrip        → sites.gs: getSitesByTrip(tripId)
 *   getSitesByCoordinator → sites.gs: getSitesByCoordinator(coordinatorEmail)
 *   calculateCostBreakdown→ costs.gs: calculateCostBreakdown(tripId)
 *   getUnreadNotifications→ notifications.gs: getUnreadNotifications(toEmail)
 *   getProjectCoordinators→ auth.gs: getProjectCoordinators()
 *
 * @param {GoogleAppsScript.Events.DoGet} e - The GET event object.
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function doGet(e) {
  try {
    var params = e.parameter || {};
    var action = params.action;

    switch (action) {
      case 'getTrips':
        return jsonResponse(getTrips(params.createdBy));

      case 'getSitesByTrip':
        if (!params.tripId) return errorResponse('tripId is required');
        return jsonResponse(getSitesByTrip(params.tripId));

      case 'getSitesByCoordinator':
        if (!params.coordinatorEmail) return errorResponse('coordinatorEmail is required');
        return jsonResponse(getSitesByCoordinator(params.coordinatorEmail));

      case 'calculateCostBreakdown':
        if (!params.tripId) return errorResponse('tripId is required');
        return jsonResponse(calculateCostBreakdown(params.tripId));

      case 'getUnreadNotifications':
        if (!params.toEmail) return errorResponse('toEmail is required');
        return jsonResponse(getUnreadNotifications(params.toEmail));

      case 'getProjectCoordinators':
        return jsonResponse(getProjectCoordinators());

      default:
        return errorResponse('Unknown GET action: ' + action);
    }
  } catch (err) {
    return errorResponse('Server error: ' + err.message);
  }
}

// ─── doPost — write/mutation operations ───────────────────────────────────────

/**
 * Handles all POST requests from the React frontend.
 * The request body must be JSON with an 'action' field.
 *
 * Supported actions:
 *   createTrip      → trips.gs: createTrip(payload)
 *   updateTrip      → trips.gs: updateTrip(payload)
 *   deleteTrip      → trips.gs: deleteTrip(tripId)
 *   updateJobCode   → sites.gs: updateJobCode(siteId, jobCode)
 *   sendEmailNotification → notifications.gs: sendEmailNotification(tripId)
 *   markAsRead      → notifications.gs: markAsRead(notifId)
 *   markAllAsRead   → notifications.gs: markAllAsRead(toEmail)
 *   validateUser    → auth.gs: validateUser(email, password)
 *
 * @param {GoogleAppsScript.Events.DoPost} e - The POST event object.
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action;

    switch (action) {
      case 'createTrip':
        return jsonResponse(createTrip(body));

      case 'updateTrip':
        return jsonResponse(updateTrip(body));

      case 'deleteTrip':
        if (!body.tripId) return errorResponse('tripId is required');
        return jsonResponse(deleteTrip(body.tripId));

      case 'updateJobCode':
        if (!body.siteId || !body.jobCode) return errorResponse('siteId and jobCode are required');
        return jsonResponse(updateJobCode(body.siteId, body.jobCode));

      case 'sendEmailNotification':
        if (!body.tripId) return errorResponse('tripId is required');
        return jsonResponse(sendEmailNotification(body.tripId));

      case 'markAsRead':
        if (!body.notifId) return errorResponse('notifId is required');
        return jsonResponse(markAsRead(body.notifId));

      case 'markAllAsRead':
        if (!body.toEmail) return errorResponse('toEmail is required');
        return jsonResponse(markAllAsRead(body.toEmail));

      case 'validateUser':
        if (!body.email || !body.password) return errorResponse('email and password are required');
        return jsonResponse(validateUser(body.email, body.password));

      default:
        return errorResponse('Unknown POST action: ' + action);
    }
  } catch (err) {
    return errorResponse('Server error: ' + err.message);
  }
}
