import type { Notification, ApiResponse } from '../types';

const BASE_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string;

// ─── Notification Service ─────────────────────────────────────────────────────
// Handles reading notifications from Sheets and triggering email via Apps Script.

/** Helper: POST to the Apps Script Web App */
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

/** Helper: GET from the Apps Script Web App */
async function get<T>(action: string, params: Record<string, string> = {}): Promise<ApiResponse<T>> {
  const url = new URL(BASE_URL);
  url.searchParams.set('action', action);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString());
  if (!res.ok) {
    return { success: false, error: `HTTP ${res.status}: ${res.statusText}` };
  }
  return res.json() as Promise<ApiResponse<T>>;
}

/**
 * Fetches all unread notifications for the given email address.
 */
export async function getUnreadNotifications(toEmail: string): Promise<ApiResponse<Notification[]>> {
  return get<Notification[]>('getUnreadNotifications', { toEmail });
}

/**
 * Marks a single notification as read by its ID.
 */
export async function markAsRead(notifId: string): Promise<ApiResponse<void>> {
  return post<void>('markAsRead', { notifId });
}

/**
 * Marks all notifications for an email as read.
 */
export async function markAllAsRead(toEmail: string): Promise<ApiResponse<void>> {
  return post<void>('markAllAsRead', { toEmail });
}

/**
 * Triggers an email notification for a trip.
 * Called after a trip is successfully created.
 */
export async function sendTripNotification(tripId: string): Promise<ApiResponse<void>> {
  return post<void>('sendEmailNotification', { tripId });
}
