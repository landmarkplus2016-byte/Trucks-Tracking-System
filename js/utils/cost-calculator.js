/**
 * utils/cost-calculator.js
 * ────────────────────────
 * All cost-splitting logic lives ONLY here.
 * Rules:
 *   costPerSite        = totalCost / totalSites
 *   coordinatorTotal   = costPerSite × coordSiteCount
 */

/**
 * Calculate the cost share for each site in a trip.
 *
 * @param {number} totalCost  - Sum of all cost fields for the trip
 * @param {number} siteCount  - Total number of sites in the trip
 * @returns {number} Cost per site (2 decimal precision)
 */
function splitCostPerSite(totalCost, siteCount) {
  if (!siteCount || siteCount <= 0) return 0;
  return Math.round((totalCost / siteCount) * 100) / 100;
}

/**
 * Calculate one coordinator's total cost share.
 *
 * @param {number} costPerSite      - Result of splitCostPerSite()
 * @param {number} coordSiteCount   - Number of sites belonging to this coordinator
 * @returns {number} Total cost for that coordinator (2 decimal precision)
 */
function getCoordinatorTotal(costPerSite, coordSiteCount) {
  return Math.round((costPerSite * coordSiteCount) * 100) / 100;
}

/**
 * Build the full cost breakdown for a trip given its sites array.
 *
 * @param {Object}   trip            - Trip object with cost fields
 * @param {number}   trip.laborCost
 * @param {number}   trip.parkCost
 * @param {number}   trip.truckCost
 * @param {number}   trip.hotelCost
 * @param {import('../types/schemas.js').Site[]} sites - All sites for this trip
 * @returns {import('../types/schemas.js').CostBreakdown}
 */
function buildCostBreakdown(trip, sites) {
  const totalCost = (Number(trip.laborCost) || 0)
                  + (Number(trip.parkCost)  || 0)
                  + (Number(trip.truckCost) || 0)
                  + (Number(trip.hotelCost) || 0);

  const siteCount   = sites.length;
  const costPerSite = splitCostPerSite(totalCost, siteCount);

  // Group sites by coordinator
  const coordMap = {};
  sites.forEach(site => {
    const email = site.coordinatorEmail;
    if (!coordMap[email]) {
      coordMap[email] = { coordinatorEmail: email, siteCount: 0, sites: [] };
    }
    coordMap[email].siteCount += 1;
    coordMap[email].sites.push(site);
  });

  const byCoordinator = Object.values(coordMap).map(c => ({
    ...c,
    totalCost: getCoordinatorTotal(costPerSite, c.siteCount),
  }));

  return { totalCost, siteCount, costPerSite, byCoordinator };
}

/**
 * Sum all cost fields from a trip form object.
 *
 * @param {{ laborCost: number, parkCost: number, truckCost: number, hotelCost: number }} costs
 * @returns {number}
 */
function sumTripCosts(costs) {
  return (Number(costs.laborCost) || 0)
       + (Number(costs.parkCost)  || 0)
       + (Number(costs.truckCost) || 0)
       + (Number(costs.hotelCost) || 0);
}

/**
 * Parse a raw site numbers string into an array of trimmed, non-empty strings.
 * Accepts "/" or "-" as separators.
 *
 * @param {string} rawInput - e.g. "1234/5678/8907" or "1234-5678-8907"
 * @returns {string[]}
 */
function parseSiteNumbers(rawInput) {
  return String(rawInput || '').split(/[\/\-]/).map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 0; });
}

/**
 * Calculate cost per site given a total cost and an array of group objects.
 * Each group has a `sites` property (raw string of site numbers).
 *
 * @param {number} totalCost
 * @param {{ sites: string }[]} allGroups
 * @returns {number}
 */
function calculateCostPerSite(totalCost, allGroups) {
  var totalSites = 0;
  allGroups.forEach(function (group) {
    totalSites += parseSiteNumbers(group.sites).length;
  });
  if (totalSites === 0) return 0;
  return totalCost / totalSites;
}
