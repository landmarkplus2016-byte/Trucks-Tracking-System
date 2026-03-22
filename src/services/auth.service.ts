import type { User } from '../types';
import { STORAGE_KEYS } from '../constants';
import { validateUser } from './sheets.service';

// ─── Auth Service ─────────────────────────────────────────────────────────────
// Manages login/logout and persists the current user in localStorage.
// Components must NOT call this service directly — use the useAuth hook.

/**
 * Attempts to log in with the given credentials.
 * On success, persists the user to localStorage and returns the User.
 * On failure, throws an Error with a human-readable message.
 */
export async function login(email: string, password: string): Promise<User> {
  const response = await validateUser(email, password);
  if (!response.success || !response.data) {
    throw new Error(response.error ?? 'Invalid email or password.');
  }
  persistUser(response.data);
  return response.data;
}

/**
 * Clears the persisted user from localStorage, effectively logging out.
 */
export function logout(): void {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}

/**
 * Returns the currently persisted user, or null if no user is logged in.
 */
export function getPersistedUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

/**
 * Persists a user object to localStorage.
 */
function persistUser(user: User): void {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
}
