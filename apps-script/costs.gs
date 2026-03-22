/**
 * costs.gs — Cost calculation logic for the Trucks Tracking System.
 *
 * This file mirrors the TypeScript logic in src/utils/cost-calculator.ts
 * so that the server-side breakdown is always consistent with the frontend.
 *
 * Cost rules:
 *   - Total trip cost = laborCost + parkCost + truckCost + hotelCost
 *   - Cost per site   = totalCost / totalSites  (rounded to 2 decimal places)
 *   - Coordinator's total = costPerSite × number of their sites
 */

/**
 * Builds a complete cost breakdown for a trip by reading the Trips and Sites sheets.
 *
 * @param {string} tripId - The trip's unique identifier.
 * @returns {{ success: boolean, data?: object, error?: string }}
 */
function calculateCostBreakdown(tripId) {
  var ss      = SpreadsheetApp.getActiveSpreadsheet();
  var trips   = ss.getSheetByName('Trips');
  var sites   = ss.getSheetByName('Sites');
  if (!trips) return { success: false, error: 'Trips sheet not found.' };
  if (!sites) return { success: false, error: 'Sites sheet not found.' };

  // Find the trip row
  var tripsData = trips.getDataRange().getValues();
  var tripRow   = null;
  for (var i = 1; i < tripsData.length; i++) {
    if (String(tripsData[i][0]) === String(tripId)) {
      tripRow = tripsData[i];
      break;
    }
  }
  if (!tripRow) return { success: false, error: 'Trip not found: ' + tripId };

  var laborCost = Number(tripRow[5]) || 0;
  var parkCost  = Number(tripRow[6]) || 0;
  var truckCost = Number(tripRow[7]) || 0;
  var hotelCost = Number(tripRow[8]) || 0;
  var totalCost = laborCost + parkCost + truckCost + hotelCost;

  // Gather all sites for this trip
  var sitesData = sites.getDataRange().getValues();
  var tripSites = [];
  for (var j = 1; j < sitesData.length; j++) {
    if (String(sitesData[j][1]) === String(tripId)) {
      tripSites.push({
        siteId:           String(sitesData[j][0]),
        tripId:           String(sitesData[j][1]),
        siteNumber:       String(sitesData[j][2]),
        coordinatorEmail: String(sitesData[j][3]),
        jobCode:          String(sitesData[j][4] || ''),
        costShare:        Number(sitesData[j][5]) || 0,
        jcStatus:         String(sitesData[j][6] || 'PENDING'),
      });
    }
  }

  var totalSites  = tripSites.length;
  var costPerSite = totalSites > 0 ? Math.round((totalCost / totalSites) * 100) / 100 : 0;

  // Group sites by coordinator
  var byCoord = {};
  tripSites.forEach(function(site) {
    var key = site.coordinatorEmail;
    if (!byCoord[key]) byCoord[key] = [];
    byCoord[key].push(site);
  });

  var coordinatorBreakdowns = Object.keys(byCoord).map(function(email) {
    var coordSites = byCoord[email];
    return {
      coordinatorEmail: email,
      siteCount:        coordSites.length,
      totalCost:        Math.round(costPerSite * coordSites.length * 100) / 100,
      sites:            coordSites,
    };
  });

  return {
    success: true,
    data: {
      tripId:                 tripId,
      totalCost:              totalCost,
      totalSites:             totalSites,
      costPerSite:            costPerSite,
      coordinatorBreakdowns:  coordinatorBreakdowns,
    },
  };
}
