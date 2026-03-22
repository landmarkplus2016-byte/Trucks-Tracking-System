/**
 * auth.gs — User authentication
 * ──────────────────────────────
 * Reads the Users sheet to validate credentials.
 *
 * Users sheet columns (in order):
 *   userId | name | email | role | password
 *
 * NOTE: Passwords are stored in plain text in this sheet.
 * For a production system, hash them (e.g. using SHA-256 via Utilities.computeDigest).
 */

/**
 * Validate login credentials.
 * @param {{ email: string, password: string }} data
 * @returns {{ success: boolean, data?: Object, error?: string }}
 */
function validateUser(data) {
  var email    = String(data.email    || '').trim().toLowerCase();
  var password = String(data.password || '');

  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' };
  }

  var users = sheetToObjects(getSheet(TABS.USERS));
  var user  = users.find(function (u) {
    return String(u.email || '').trim().toLowerCase() === email
        && String(u.password || '') === password;
  });

  if (!user) {
    return { success: false, error: 'Invalid email or password.' };
  }

  // Return user without the password field
  return {
    success: true,
    data: {
      userId: user.userId,
      name:   user.name,
      email:  user.email,
      role:   user.role,
    },
  };
}

/**
 * Get a user's role by email.
 * @param {string} email
 * @returns {string|null}
 */
function getUserRole(email) {
  var users = sheetToObjects(getSheet(TABS.USERS));
  var user  = users.find(function (u) {
    return String(u.email || '').trim().toLowerCase() === String(email || '').trim().toLowerCase();
  });
  return user ? user.role : null;
}
