/**
 * trips.gs — CRUD operations for the Trips tab.
 *
 * Expected Trips columns (row 1 = headers):
 *   A: tripId | B: date | C: whRep | D: driver | E: route
 *   F: laborCost | G: parkCost | H: truckCost | I: hotelCost
 *   J: totalCost | K: status | L: createdBy | M: createdAt
 */

var TRIPS_SHEET = 'Trips';

/**
 * Returns all trips, optionally filtered by the creator's email.
 *
 * @param {string} [createdBy] - If provided, only trips created by this email are returned.
 * @returns {{ success: boolean, data?: object[], error?: string }}
 */
function getTrips(createdBy) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TRIPS_SHEET);
  if (!sheet) return { success: false, error: 'Trips sheet not found.' };

  var data = sheet.getDataRange().getValues();
  var trips = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0]) continue; // skip empty rows
    var trip = rowToTrip(row);
    if (!createdBy || trip.createdBy.toLowerCase() === createdBy.toLowerCase()) {
      trips.push(trip);
    }
  }
  // Sort newest first
  trips.sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
  return { success: true, data: trips };
}

/**
 * Creates a new trip row and appends its sites to the Sites tab.
 * Also sets totalCost and an initial status of PENDING_JC.
 *
 * @param {object} payload - CreateTripPayload from the frontend.
 * @returns {{ success: boolean, data?: object, error?: string }}
 */
function createTrip(payload) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TRIPS_SHEET);
  if (!sheet) return { success: false, error: 'Trips sheet not found.' };

  var tripId    = Utilities.getUuid();
  var totalCost = (payload.laborCost || 0) + (payload.parkCost || 0)
                + (payload.truckCost || 0) + (payload.hotelCost || 0);
  var createdAt = new Date().toISOString();
  var status    = 'PENDING_JC';

  sheet.appendRow([
    tripId,
    payload.date,
    payload.whRep,
    payload.driver,
    payload.route,
    payload.laborCost || 0,
    payload.parkCost  || 0,
    payload.truckCost || 0,
    payload.hotelCost || 0,
    totalCost,
    status,
    payload.createdBy,
    createdAt,
  ]);

  // Append sites
  var sites = payload.sites || [];
  var costPerSite = sites.length > 0 ? Math.round((totalCost / sites.length) * 100) / 100 : 0;
  for (var i = 0; i < sites.length; i++) {
    appendSite(tripId, sites[i].siteNumber, sites[i].coordinatorEmail, costPerSite);
  }

  return {
    success: true,
    data: {
      tripId:    tripId,
      date:      payload.date,
      whRep:     payload.whRep,
      driver:    payload.driver,
      route:     payload.route,
      laborCost: payload.laborCost || 0,
      parkCost:  payload.parkCost  || 0,
      truckCost: payload.truckCost || 0,
      hotelCost: payload.hotelCost || 0,
      totalCost: totalCost,
      status:    status,
      createdBy: payload.createdBy,
      createdAt: createdAt,
    },
  };
}

/**
 * Updates an existing trip row identified by tripId.
 * Only the fields provided in the payload are updated.
 *
 * @param {object} payload - UpdateTripPayload from the frontend (must include tripId).
 * @returns {{ success: boolean, data?: object, error?: string }}
 */
function updateTrip(payload) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TRIPS_SHEET);
  if (!sheet) return { success: false, error: 'Trips sheet not found.' };
  if (!payload.tripId) return { success: false, error: 'tripId is required.' };

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === payload.tripId) {
      var row = i + 1; // Sheets rows are 1-indexed
      if (payload.date      !== undefined) sheet.getRange(row, 2).setValue(payload.date);
      if (payload.whRep     !== undefined) sheet.getRange(row, 3).setValue(payload.whRep);
      if (payload.driver    !== undefined) sheet.getRange(row, 4).setValue(payload.driver);
      if (payload.route     !== undefined) sheet.getRange(row, 5).setValue(payload.route);
      if (payload.laborCost !== undefined) sheet.getRange(row, 6).setValue(payload.laborCost);
      if (payload.parkCost  !== undefined) sheet.getRange(row, 7).setValue(payload.parkCost);
      if (payload.truckCost !== undefined) sheet.getRange(row, 8).setValue(payload.truckCost);
      if (payload.hotelCost !== undefined) sheet.getRange(row, 9).setValue(payload.hotelCost);

      // Recalculate totalCost from current row values
      var updatedRow = sheet.getRange(row, 1, 1, 13).getValues()[0];
      var newTotal = updatedRow[5] + updatedRow[6] + updatedRow[7] + updatedRow[8];
      sheet.getRange(row, 10).setValue(newTotal);

      return { success: true, data: rowToTrip(sheet.getRange(row, 1, 1, 13).getValues()[0]) };
    }
  }
  return { success: false, error: 'Trip not found: ' + payload.tripId };
}

/**
 * Deletes a trip row (and all associated site rows) by tripId.
 *
 * @param {string} tripId - The trip's unique identifier.
 * @returns {{ success: boolean, error?: string }}
 */
function deleteTrip(tripId) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TRIPS_SHEET);
  if (!sheet) return { success: false, error: 'Trips sheet not found.' };

  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === tripId) {
      sheet.deleteRow(i + 1);
      // Cascade-delete associated sites
      deleteSitesByTrip(tripId);
      return { success: true };
    }
  }
  return { success: false, error: 'Trip not found: ' + tripId };
}

// ─── Internal helper ──────────────────────────────────────────────────────────

/**
 * Converts a raw Sheets row array into a Trip object.
 *
 * @param {Array} row - A row from sheet.getDataRange().getValues()
 * @returns {object} Trip
 */
function rowToTrip(row) {
  return {
    tripId:    String(row[0]),
    date:      String(row[1]),
    whRep:     String(row[2]),
    driver:    String(row[3]),
    route:     String(row[4]),
    laborCost: Number(row[5]) || 0,
    parkCost:  Number(row[6]) || 0,
    truckCost: Number(row[7]) || 0,
    hotelCost: Number(row[8]) || 0,
    totalCost: Number(row[9]) || 0,
    status:    String(row[10]),
    createdBy: String(row[11]),
    createdAt: String(row[12]),
  };
}
