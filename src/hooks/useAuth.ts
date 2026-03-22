import { useState, useCallback } from 'react';
import type { User } from '../types';
import { login as loginService, logout as logoutService, getPersistedUser } from '../services/auth.service';
import { ROLES } from '../constants';

// ─── useAuth ──────────────────────────────────────────────────────────────────
// Manages the authenticated user state and exposes login/logout helpers.
// Hydrates from localStorage on first call.

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => getPersistedUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Attempt to log in. Throws on failure. */
  const login = useCallback(async (email: string, password: string): Promise<User> => {
    setLoading(true);
    setError(null);
    try {
      const loggedInUser = await loginService(email, password);
      setUser(loggedInUser);
      return loggedInUser;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /** Log out and clear user state. */
  const logout = useCallback(() => {
    logoutService();
    setUser(null);
  }, []);

  const isFleet = user?.role === ROLES.FLEET;
  const isProject = user?.role === ROLES.PROJECT;

  return {
    user,
    loading,
    error,
    isAuthenticated: user !== null,
    isFleet,
    isProject,
    login,
    logout,
  };
}
