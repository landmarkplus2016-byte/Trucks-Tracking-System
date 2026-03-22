/**
 * types/schemas.js
 * ────────────────
 * JSDoc type definitions for all data structures used in the app.
 * These are documentation only — no runtime code here.
 */

/**
 * @typedef {Object} User
 * @property {string} userId    - Unique user identifier
 * @property {string} name      - Full display name
 * @property {string} email     - Login email
 * @property {string} role      - 'fleet' | 'project'  (see ROLES)
 */

/**
 * @typedef {Object} Trip
 * @property {string} tripId      - Unique trip identifier (e.g. "TRIP-001")
 * @property {string} date        - ISO date string "YYYY-MM-DD"
 * @property {string} whRep       - Warehouse representative name
 * @property {string} driver      - Driver name
 * @property {string} route       - Route description
 * @property {number} laborCost   - Labor cost in currency units
 * @property {number} parkCost    - Parking cost
 * @property {number} truckCost   - Truck rental/use cost
 * @property {number} hotelCost   - Hotel/accommodation cost
 * @property {number} totalCost   - Sum of all costs (calculated server-side)
 * @property {string} status      - 'draft' | 'active' | 'complete'
 * @property {string} createdBy   - Email of fleet coordinator who created it
 * @property {string} createdAt   - ISO datetime string
 */

/**
 * @typedef {Object} Site
 * @property {string} siteId            - Unique site identifier
 * @property {string} tripId            - Parent trip identifier
 * @property {string} siteNumber        - Human-readable site number/code
 * @property {string} coordinatorEmail  - Project coordinator responsible for this site
 * @property {string} jobCode           - JC entered by project coordinator (empty until entered)
 * @property {number} costShare         - This site's share of the trip cost
 * @property {string} jcStatus          - 'pending' | 'entered'  (see JC_STATUS)
 */

/**
 * @typedef {Object} Notification
 * @property {string}  notifId    - Unique notification identifier
 * @property {string}  toEmail    - Recipient email
 * @property {string}  tripId     - Related trip identifier
 * @property {string}  message    - Notification body text
 * @property {boolean} isRead     - Whether the user has seen it
 * @property {string}  createdAt  - ISO datetime string
 */

/**
 * @typedef {Object} CostBreakdown
 * @property {string} tripId          - Trip this breakdown is for
 * @property {number} totalCost       - Total trip cost
 * @property {number} siteCount       - Total number of sites in the trip
 * @property {number} costPerSite     - totalCost / siteCount
 * @property {CoordBreakdown[]} byCoordinator - Per-coordinator totals
 */

/**
 * @typedef {Object} CoordBreakdown
 * @property {string} coordinatorEmail - Project coordinator email
 * @property {number} siteCount        - Number of sites belonging to this coordinator
 * @property {number} totalCost        - costPerSite × siteCount
 * @property {Site[]} sites            - Sites belonging to this coordinator
 */

/**
 * @typedef {Object} ApiResponse
 * @property {boolean} success   - Whether the call succeeded
 * @property {*}       data      - Returned payload (type varies by action)
 * @property {string}  [error]   - Error message when success === false
 */
