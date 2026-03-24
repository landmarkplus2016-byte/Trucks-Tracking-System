/**
 * sites.gs — Site-level operations
 * ──────────────────────────────────
 * Sites sheet columns (in order):
 *   siteId | tripId | siteNumber | coordinatorEmail | jobCode | costShare | jcStatus
 */

/**
 * Get sites for a given trip, optionally filtered by coordinator email.
 *
 * @param {{ tripId: string, email?: string }} data
 * @returns {{ success: boolean, data: Object[] }}
 */
function getSitesByTrip(data) {
  var tripId = data.tripId;
  if (!tripId) return { success: false, error: 'tripId is required.' };

  var sites = sheetToObjects(getSheet(TABS.SITES));
  var result = sites.filter(function (s) { return s.tripId === tripId; });

  // Optional: filter to a specific coordinator's sites
  if (data.email) {
    var emailLower = String(data.email).toLowerCase().trim();
    result = result.filter(function (s) {
      return String(s.coordinatorEmail || '').toLowerCase().trim() === emailLower;
    });
  }

  return { success: true, data: result };
}

/**
 * Update the Job Code for a site and mark it as entered.
 *
 * @param {{ siteId: string, jobCode: string }} data
 * @returns {{ success: boolean }}
 */
function updateJobCode(data) {
  var siteId  = data.siteId;
  var jobCode = String(data.jobCode || '').trim();

  if (!siteId)  return { success: false, error: 'siteId is required.' };
  if (!jobCode) return { success: false, error: 'jobCode cannot be empty.' };

  var sitesSheet = getSheet(TABS.SITES);
  var values     = sitesSheet.getDataRange().getValues();
  var headers    = values[0];
  var siteIdCol  = headers.indexOf('siteId');
  var jcCol      = headers.indexOf('jobCode');
  var statusCol  = headers.indexOf('jcStatus');

  for (var i = 1; i < values.length; i++) {
    if (values[i][siteIdCol] === siteId) {
      if (jcCol     !== -1) sitesSheet.getRange(i + 1, jcCol     + 1).setValue(jobCode);
      if (statusCol !== -1) sitesSheet.getRange(i + 1, statusCol + 1).setValue('entered');

      // Check if all sites for this trip now have JC entered → update trip status
      var tripId    = values[i][headers.indexOf('tripId')];
      checkAndUpdateTripStatus(tripId);

      try { rebuildCostPerSiteReport(); } catch(e) { Logger.log('Report error: ' + e.message); }

      return { success: true };
    }
  }

  return { success: false, error: 'Site not found: ' + siteId };
}

/**
 * If all sites for a trip have jcStatus === 'entered', set trip status to 'complete'.
 *
 * @param {string} tripId
 */
function checkAndUpdateTripStatus(tripId) {
  var sites     = sheetToObjects(getSheet(TABS.SITES));
  var tripSites = sites.filter(function (s) { return s.tripId === tripId; });

  if (!tripSites.length) return;

  var allEntered = tripSites.every(function (s) { return s.jcStatus === 'entered'; });
  if (!allEntered) return;

  // Update trips sheet status to 'complete'
  var tripsSheet = getSheet(TABS.TRIPS);
  var tValues    = tripsSheet.getDataRange().getValues();
  var headers    = tValues[0];
  var tripIdCol  = headers.indexOf('tripId');
  var statusCol  = headers.indexOf('status');

  for (var i = 1; i < tValues.length; i++) {
    if (tValues[i][tripIdCol] === tripId) {
      tripsSheet.getRange(i + 1, statusCol + 1).setValue('complete');
      return;
    }
  }
}
