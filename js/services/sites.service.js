/**
 * services/sites.service.js
 * ─────────────────────────
 * Site-level operations (fetch by trip, update JC).
 */

/**
 * Get all sites for a specific trip.
 * @param {string} tripId
 * @returns {Promise<import('../types/schemas.js').Site[]>}
 */
async function getSitesByTrip(tripId) {
  const result = await fetchAPI(ACTIONS.GET_SITES_BY_TRIP, { tripId });
  if (!result.success) throw new Error(result.error);
  return result.data || [];
}

/**
 * Save a Job Code for a site.
 * @param {string} siteId
 * @param {string} jobCode
 * @returns {Promise<void>}
 */
async function updateJobCode(siteId, jobCode) {
  const result = await fetchAPI(ACTIONS.UPDATE_JOB_CODE, { siteId, jobCode });
  if (!result.success) throw new Error(result.error);
}
