/**
 * constants/index.js
 * ──────────────────
 * All application-level constants. Import this before page scripts.
 * Never hardcode these strings in any other file.
 */

/** User roles */
const ROLES = Object.freeze({
  FLEET:   'fleet',
  PROJECT: 'project',
});

/** Trip lifecycle statuses */
const TRIP_STATUS = Object.freeze({
  DRAFT:    'draft',
  ACTIVE:   'active',
  COMPLETE: 'complete',
});

/** Per-site Job Code entry statuses */
const JC_STATUS = Object.freeze({
  PENDING:  'pending',
  ENTERED:  'entered',
});

/** Google Sheets tab names */
const SHEET_TABS = Object.freeze({
  TRIPS:         'Trips',
  SITES:         'Sites',
  USERS:         'Users',
  NOTIFICATIONS: 'Notifications',
});

/** Client-side page routes (relative paths from repo root) */
const ROUTES = Object.freeze({
  LOGIN:              'index.html',
  FLEET_DASHBOARD:    'pages/fleet/dashboard.html',
  FLEET_NEW_TRIP:     'pages/fleet/new-trip.html',
  FLEET_EDIT_TRIP:    'pages/fleet/edit-trip.html',
  FLEET_HISTORY:      'pages/fleet/history.html',
  PROJECT_DASHBOARD:  'pages/project/dashboard.html',
  PROJECT_PENDING_JC: 'pages/project/pending-jc.html',
  PROJECT_HISTORY:    'pages/project/history.html',
});

/** Apps Script action names (must match doPost switch cases in Code.gs) */
const ACTIONS = Object.freeze({
  LOGIN:                    'login',
  GET_TRIPS:                'getTrips',
  CREATE_TRIP:              'createTrip',
  UPDATE_TRIP:              'updateTrip',
  DELETE_TRIP:              'deleteTrip',
  GET_SITES_BY_TRIP:        'getSitesByTrip',
  UPDATE_JOB_CODE:          'updateJobCode',
  GET_COST_BREAKDOWN:       'getCostBreakdown',
  GET_UNREAD_NOTIFICATIONS: 'getUnreadNotifications',
  MARK_NOTIF_READ:          'markNotifRead',
});
