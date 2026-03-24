/**
 * trips.gs — Trip CRUD operations
 * ────────────────────────────────
 * Trips sheet columns (in order):
 *   tripId | date | whRep | driver | route |
 *   laborCost | parkCost | truckCost | hotelCost | totalCost |
 *   status | createdBy | createdAt
 */

/**
 * Get trips, optionally filtered by coordinator email or tripId.
 * For project coordinators, only returns trips that have at least one
 * site belonging to them.
 *
 * @param {{ email?: string, role?: string, tripId?: string, jcStatus?: string }} data
 * @returns {{ success: boolean, data: Object[] }}
 */
function getTrips(data) {
  var trips = sheetToObjects(getSheet(TABS.TRIPS));

  // Filter by specific tripId
  if (data.tripId) {
    trips = trips.filter(function (t) { return t.tripId === data.tripId; });
    return { success: true, data: trips };
  }

  // For project coordinators: cross-reference with Sites sheet
  if (data.role === 'project' && data.email) {
    var sites = sheetToObjects(getSheet(TABS.SITES));
    var myTripIds = {};

    sites.forEach(function (s) {
      var emailMatch = String(s.coordinatorEmail || '').toLowerCase() === String(data.email || '').toLowerCase();
      var jcFilter   = !data.jcStatus || s.jcStatus === data.jcStatus;
      if (emailMatch && jcFilter) {
        myTripIds[s.tripId] = true;
      }
    });

    // No matching sites — return early with empty array
    if (Object.keys(myTripIds).length === 0) {
      return { success: true, data: [] };
    }

    trips = trips.filter(function (t) { return myTripIds[t.tripId]; });
  }

  return { success: true, data: trips };
}

/**
 * Create a new trip and its associated sites.
 * Also triggers email notifications to all affected project coordinators.
 *
 * @param {{ trip: Object, sites: Object[] }} data
 * @returns {{ success: boolean, data: { tripId: string } }}
 */
function createTrip(data) {
  var tripData = data.trip  || {};
  var sites    = data.sites || [];

  if (!tripData.date || !sites.length) {
    return { success: false, error: 'Trip date and at least one site are required.' };
  }

  var tripId    = generateId('TRIP');
  var createdAt = new Date().toISOString();
  var total     = (Number(tripData.laborCost) || 0)
                + (Number(tripData.parkCost)  || 0)
                + (Number(tripData.truckCost) || 0)
                + (Number(tripData.hotelCost) || 0);

  // Write trip row
  var tripsSheet = getSheet(TABS.TRIPS);
  tripsSheet.appendRow([
    tripId,
    tripData.date,
    tripData.whRep    || '',
    tripData.driver   || '',
    tripData.route    || '',
    Number(tripData.laborCost) || 0,
    Number(tripData.parkCost)  || 0,
    Number(tripData.truckCost) || 0,
    Number(tripData.hotelCost) || 0,
    total,
    'active',
    tripData.createdBy || '',
    createdAt,
  ]);

  // Write site rows
  var sitesSheet   = getSheet(TABS.SITES);
  var costPerSite  = sites.length > 0 ? Math.round((total / sites.length) * 100) / 100 : 0;

  sites.forEach(function (site) {
    var siteId = generateId('SITE');
    sitesSheet.appendRow([
      siteId,
      tripId,
      site.siteNumber       || '',
      site.coordinatorEmail || '',
      '',        // jobCode (empty until entered)
      costPerSite,
      'pending', // jcStatus
    ]);
  });

  // Notify all unique coordinator emails
  var uniqueEmails = [];
  sites.forEach(function (s) {
    var email = (s.coordinatorEmail || '').trim();
    if (email && uniqueEmails.indexOf(email) === -1) {
      uniqueEmails.push(email);
    }
  });

  uniqueEmails.forEach(function (email) {
    var mySites = sites.filter(function (s) { return s.coordinatorEmail === email; });
    var msg = 'A new truck trip (' + tripId + ') on ' + tripData.date
            + ' includes ' + mySites.length + ' of your site(s): '
            + mySites.map(function (s) { return s.siteNumber; }).join(', ') + '.';
    sendEmailNotification({ toEmail: email, tripId: tripId, message: msg });
  });

  try { rebuildCostPerSiteReport(); } catch(e) { Logger.log('Report error: ' + e.message); }

  return { success: true, data: { tripId: tripId } };
}

/**
 * Update an existing trip's fields and/or its sites.
 *
 * @param {{ tripId: string, trip?: Object, sites?: Object[] }} data
 * @returns {{ success: boolean }}
 */
function updateTrip(data) {
  var tripId = data.tripId;
  if (!tripId) return { success: false, error: 'tripId is required.' };

  var tripsSheet = getSheet(TABS.TRIPS);
  var values     = tripsSheet.getDataRange().getValues();
  var headers    = values[0];
  var tripCol    = headers.indexOf('tripId');

  var rowIndex   = -1;
  for (var i = 1; i < values.length; i++) {
    if (values[i][tripCol] === tripId) { rowIndex = i + 1; break; }
  }
  if (rowIndex === -1) return { success: false, error: 'Trip not found: ' + tripId };

  var tripData = data.trip || {};
  var total    = (Number(tripData.laborCost) || 0)
               + (Number(tripData.parkCost)  || 0)
               + (Number(tripData.truckCost) || 0)
               + (Number(tripData.hotelCost) || 0);

  // Update trip row fields by column name
  function setCol(name, val) {
    var c = headers.indexOf(name);
    if (c !== -1) tripsSheet.getRange(rowIndex, c + 1).setValue(val);
  }

  if (tripData.date)      setCol('date',      tripData.date);
  if (tripData.whRep)     setCol('whRep',     tripData.whRep);
  if (tripData.driver)    setCol('driver',    tripData.driver);
  if (tripData.route)     setCol('route',     tripData.route);
  if (tripData.laborCost !== undefined) setCol('laborCost', Number(tripData.laborCost) || 0);
  if (tripData.parkCost  !== undefined) setCol('parkCost',  Number(tripData.parkCost)  || 0);
  if (tripData.truckCost !== undefined) setCol('truckCost', Number(tripData.truckCost) || 0);
  if (tripData.hotelCost !== undefined) setCol('hotelCost', Number(tripData.hotelCost) || 0);
  if (tripData.laborCost !== undefined) setCol('totalCost', total);

  // Update sites if provided
  if (data.sites && data.sites.length) {
    var sitesSheet  = getSheet(TABS.SITES);
    var siteValues  = sitesSheet.getDataRange().getValues();
    var siteHeaders = siteValues[0];
    var sTripCol    = siteHeaders.indexOf('tripId');
    var costPerSite = data.sites.length > 0 ? Math.round((total / data.sites.length) * 100) / 100 : 0;

    // Delete existing sites for this trip
    for (var r = siteValues.length; r >= 2; r--) {
      if (siteValues[r - 1][sTripCol] === tripId) {
        sitesSheet.deleteRow(r);
      }
    }

    // Re-insert sites
    data.sites.forEach(function (site) {
      sitesSheet.appendRow([
        site.siteId           || generateId('SITE'),
        tripId,
        site.siteNumber       || '',
        site.coordinatorEmail || '',
        site.jobCode          || '',
        costPerSite,
        site.jcStatus         || 'pending',
      ]);
    });
  }

  try { rebuildCostPerSiteReport(); } catch(e) { Logger.log('Report error: ' + e.message); }

  return { success: true };
}

/**
 * Delete a trip and all its sites.
 *
 * @param {{ tripId: string }} data
 * @returns {{ success: boolean }}
 */
function deleteTrip(data) {
  var tripId = data.tripId;
  if (!tripId) return { success: false, error: 'tripId is required.' };

  // Delete trip row
  var tripsSheet = getSheet(TABS.TRIPS);
  var tValues    = tripsSheet.getDataRange().getValues();
  var tripCol    = tValues[0].indexOf('tripId');
  for (var i = tValues.length; i >= 2; i--) {
    if (tValues[i - 1][tripCol] === tripId) { tripsSheet.deleteRow(i); break; }
  }

  // Delete all site rows for this trip
  var sitesSheet = getSheet(TABS.SITES);
  var sValues    = sitesSheet.getDataRange().getValues();
  var sTripCol   = sValues[0].indexOf('tripId');
  for (var j = sValues.length; j >= 2; j--) {
    if (sValues[j - 1][sTripCol] === tripId) { sitesSheet.deleteRow(j); }
  }

  try { rebuildCostPerSiteReport(); } catch(e) { Logger.log('Report error: ' + e.message); }

  return { success: true };
}
