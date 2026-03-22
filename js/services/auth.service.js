/**
 * services/auth.service.js
 * ────────────────────────
 * Login, logout, session management via sessionStorage.
 */

/**
 * Attempt to log the user in.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import('../types/schemas.js').ApiResponse>}
 */
async function login(email, password) {
  const result = await fetchAPI(ACTIONS.LOGIN, { email, password });
  if (result.success && result.data) {
    saveUserToSession(result.data);
  }
  return result;
}

/**
 * Log the current user out and redirect to login page.
 */
function logout() {
  clearSession();
  window.location.href = ROUTES.LOGIN;
}

/**
 * Get the currently logged-in user from sessionStorage.
 * @returns {import('../types/schemas.js').User|null}
 */
function getCurrentUser() {
  try {
    const raw = sessionStorage.getItem(CONFIG.SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Save user object to sessionStorage.
 * @param {import('../types/schemas.js').User} user
 */
function saveUserToSession(user) {
  sessionStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify(user));
}

/**
 * Remove user from sessionStorage.
 */
function clearSession() {
  sessionStorage.removeItem(CONFIG.SESSION_KEY);
}

/**
 * Guard: redirect to login if not authenticated.
 * Call at the top of every protected page's script.
 * @returns {import('../types/schemas.js').User} Current user (or never returns — redirects)
 */
function requireAuth() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = ROUTES.LOGIN;
    throw new Error('Not authenticated'); // stops page script execution
  }
  return user;
}

/**
 * Guard: redirect away if the user's role doesn't match.
 * @param {string} requiredRole - ROLES.FLEET or ROLES.PROJECT
 */
function requireRole(requiredRole) {
  const user = requireAuth();
  if (user.role !== requiredRole) {
    // Send each role to their own home
    const home = user.role === ROLES.FLEET
      ? ROUTES.FLEET_DASHBOARD
      : ROUTES.PROJECT_DASHBOARD;
    window.location.href = home;
    throw new Error(`Wrong role: need ${requiredRole}, have ${user.role}`);
  }
  return user;
}
