// ─── Roles ───────────────────────────────────────────────────────────────────

export const ROLES = {
  FLEET: 'fleet',
  PROJECT: 'project',
} as const;

// ─── Trip Statuses ────────────────────────────────────────────────────────────

export const TRIP_STATUS = {
  DRAFT: 'DRAFT',
  PENDING_JC: 'PENDING_JC',
  COMPLETE: 'COMPLETE',
} as const;

// ─── Job Code Statuses ────────────────────────────────────────────────────────

export const JC_STATUS = {
  PENDING: 'PENDING',
  ENTERED: 'ENTERED',
} as const;

// ─── Google Sheets Tab Names ──────────────────────────────────────────────────

export const SHEET_TABS = {
  TRIPS: 'Trips',
  SITES: 'Sites',
  USERS: 'Users',
  NOTIFICATIONS: 'Notifications',
} as const;

// ─── App Routes ───────────────────────────────────────────────────────────────

export const ROUTES = {
  LOGIN: '/login',
  FLEET_DASHBOARD: '/fleet/dashboard',
  FLEET_NEW_TRIP: '/fleet/new-trip',
  FLEET_HISTORY: '/fleet/history',
  PROJECT_DASHBOARD: '/project/dashboard',
  PROJECT_PENDING_JC: '/project/pending-jc',
  PROJECT_HISTORY: '/project/history',
} as const;

// ─── Local Storage Keys ───────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  CURRENT_USER: 'tts_current_user',
} as const;

// ─── Polling Interval (ms) ────────────────────────────────────────────────────

export const NOTIFICATION_POLL_INTERVAL = 30_000; // 30 seconds
