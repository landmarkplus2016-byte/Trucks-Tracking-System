/**
 * services/trips.service.js
 * ─────────────────────────
 * CRUD for trips. All calls go through fetchAPI().
 */

/**
 * Get all trips (optionally filtered).
 * @param {{ role?: string, email?: string }} [filters]
 * @returns {Promise<import('../types/schemas.js').Trip[]>}
 */
async function getTrips(filters = {}) {
  const result = await fetchAPI(ACTIONS.GET_TRIPS, filters);
  if (!result.success) throw new Error(result.error);
  return result.data || [];
}

/**
 * Create a new trip with its sites.
 * @param {{ trip: Object, sites: Object[] }} payload
 * @returns {Promise<{ tripId: string }>}
 */
async function createTrip(payload) {
  const result = await fetchAPI(ACTIONS.CREATE_TRIP, payload);
  if (!result.success) throw new Error(result.error);
  return result.data;
}

/**
 * Update an existing trip (and optionally its sites).
 * @param {string} tripId
 * @param {{ trip?: Object, sites?: Object[] }} updates
 * @returns {Promise<void>}
 */
async function updateTrip(tripId, updates) {
  const result = await fetchAPI(ACTIONS.UPDATE_TRIP, { tripId, ...updates });
  if (!result.success) throw new Error(result.error);
}

/**
 * Delete a trip by ID.
 * @param {string} tripId
 * @returns {Promise<void>}
 */
async function deleteTrip(tripId) {
  const result = await fetchAPI(ACTIONS.DELETE_TRIP, { tripId });
  if (!result.success) throw new Error(result.error);
}

/**
 * Get all entries for a named list (e.g. 'whRep').
 * @param {string} listName
 * @returns {Promise<Array<{ value: string, label: string, sortOrder: number }>>}
 */
async function getLists(listName) {
  const result = await fetchAPI(ACTIONS.GET_LIST, { listName });
  return result.data || [];
}

/**
 * Alias for getLists — returns { value, label } items for a named list.
 * @param {string} listName
 * @returns {Promise<Array<{ value: string, label: string }>>}
 */
async function getListValues(listName) {
  const result = await fetchAPI(ACTIONS.GET_LIST, { listName });
  return result.data || [];
}

/**
 * Get all project coordinators from the Users sheet.
 * @returns {Promise<Array<{ value: string, label: string }>>}
 */
async function getCoordinators() {
  const result = await fetchAPI(ACTIONS.GET_COORDINATORS, {});
  return result.data || [];
}
