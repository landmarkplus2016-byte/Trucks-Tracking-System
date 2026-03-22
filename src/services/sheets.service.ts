import type {
  Trip,
  Site,
  User,
  ApiResponse,
  CreateTripPayload,
  UpdateTripPayload,
  UpdateJobCodePayload,
  CostBreakdown,
} from '../types';

// The Apps Script Web App URL is stored in the .env file as VITE_APPS_SCRIPT_URL
const BASE_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string;

// ─── Internal helper ──────────────────────────────────────────────────────────

/**
 * Makes a POST request to the Apps Script Web App.
 * All mutations go through POST to avoid CORS pre-flight issues.
 */
async function post<T>(action: string, payload: object): Promise<ApiResponse<T>> {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
  });
  if (!res.ok) {
    return { success: false, error: `HTTP ${res.status}: ${res.statusText}` };
  }
  return res.json() as Promise<ApiResponse<T>>;
}

/**
 * Makes a GET request to the Apps Script Web App.
 * The action and params are passed as query parameters.
 */
async function get<T>(action: string, params: Record<string, string> = {}): Promise<ApiResponse<T>> {
  const url = new URL(BASE_URL);
  url.searchParams.set('action', action);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    return { success: false, error: `HTTP ${res.status}: ${res.statusText}` };
  }
  return res.json() as Promise<ApiResponse<T>>;
}

// ─── Trip operations ──────────────────────────────────────────────────────────

/** Fetch all trips (optionally filtered by coordinator email). */
export async function getTrips(createdBy?: string): Promise<ApiResponse<Trip[]>> {
  const params: Record<string, string> = {};
  if (createdBy) params.createdBy = createdBy;
  return get<Trip[]>('getTrips', params);
}

/** Create a new trip and its associated sites. */
export async function createTrip(payload: CreateTripPayload): Promise<ApiResponse<Trip>> {
  return post<Trip>('createTrip', payload);
}

/** Update an existing trip. */
export async function updateTrip(payload: UpdateTripPayload): Promise<ApiResponse<Trip>> {
  return post<Trip>('updateTrip', payload);
}

/** Delete a trip (and cascade-delete its sites). */
export async function deleteTrip(tripId: string): Promise<ApiResponse<void>> {
  return post<void>('deleteTrip', { tripId });
}

// ─── Site operations ──────────────────────────────────────────────────────────

/** Fetch all sites for a given trip. */
export async function getSitesByTrip(tripId: string): Promise<ApiResponse<Site[]>> {
  return get<Site[]>('getSitesByTrip', { tripId });
}

/** Fetch all sites belonging to a given coordinator. */
export async function getSitesByCoordinator(coordinatorEmail: string): Promise<ApiResponse<Site[]>> {
  return get<Site[]>('getSitesByCoordinator', { coordinatorEmail });
}

/** Update the Job Code for a site. */
export async function updateJobCode(payload: UpdateJobCodePayload): Promise<ApiResponse<Site>> {
  return post<Site>('updateJobCode', payload);
}

// ─── Cost operations ──────────────────────────────────────────────────────────

/** Get the full cost breakdown for a trip (computed on the server). */
export async function getCostBreakdown(tripId: string): Promise<ApiResponse<CostBreakdown>> {
  return get<CostBreakdown>('calculateCostBreakdown', { tripId });
}

// ─── User operations ──────────────────────────────────────────────────────────

/** Validate user credentials and return the User record. */
export async function validateUser(email: string, password: string): Promise<ApiResponse<User>> {
  return post<User>('validateUser', { email, password });
}

/** Get a list of all project coordinators (used when building a trip). */
export async function getProjectCoordinators(): Promise<ApiResponse<User[]>> {
  return get<User[]>('getProjectCoordinators');
}
