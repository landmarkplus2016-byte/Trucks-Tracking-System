/**
 * costs.gs — Cost breakdown calculation (server-side)
 * ─────────────────────────────────────────────────────
 * Mirrors the client-side logic in js/utils/cost-calculator.js.
 * Called when the client requests a pre-calculated breakdown
 * rather than computing it locally.
 */

/**
 * Build and return the full cost breakdown for a trip.
 *
 * @param {{ tripId: string }} data
 * @returns {{ success: boolean, data: Object }}
 */
function getCostBreakdown(data) {
  var tripId = data.tripId;
  if (!tripId) return { success: false, error: 'tripId is required.' };

  // Load trip
  var trips = sheetToObjects(getSheet(TABS.TRIPS));
  var trip  = trips.find(function (t) { return t.tripId === tripId; });
  if (!trip) return { success: false, error: 'Trip not found: ' + tripId };

  // Load sites for this trip
  var allSites = sheetToObjects(getSheet(TABS.SITES));
  var sites    = allSites.filter(function (s) { return s.tripId === tripId; });

  var totalCost  = (Number(trip.laborCost) || 0)
                 + (Number(trip.parkCost)  || 0)
                 + (Number(trip.truckCost) || 0)
                 + (Number(trip.hotelCost) || 0);
  var siteCount  = sites.length;
  var costPerSite= siteCount > 0 ? Math.round((totalCost / siteCount) * 100) / 100 : 0;

  // Group by coordinator
  var coordMap = {};
  sites.forEach(function (site) {
    var email = site.coordinatorEmail;
    if (!coordMap[email]) {
      coordMap[email] = { coordinatorEmail: email, siteCount: 0, sites: [] };
    }
    coordMap[email].siteCount += 1;
    coordMap[email].sites.push(site);
  });

  var byCoordinator = Object.keys(coordMap).map(function (email) {
    var c = coordMap[email];
    return {
      coordinatorEmail: c.coordinatorEmail,
      siteCount:        c.siteCount,
      totalCost:        Math.round((costPerSite * c.siteCount) * 100) / 100,
      sites:            c.sites,
    };
  });

  return {
    success: true,
    data: {
      tripId:        tripId,
      laborCost:     Number(trip.laborCost)  || 0,
      parkCost:      Number(trip.parkCost)   || 0,
      truckCost:     Number(trip.truckCost)  || 0,
      hotelCost:     Number(trip.hotelCost)  || 0,
      totalCost:     totalCost,
      siteCount:     siteCount,
      costPerSite:   costPerSite,
      byCoordinator: byCoordinator,
    },
  };
}
