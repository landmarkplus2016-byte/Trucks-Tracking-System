/**
 * services/api.service.js
 * ───────────────────────
 * Single fetch gateway to the Apps Script Web App.
 * All other service files call fetchAPI() — never fetch directly.
 *
 * Uses GET with URL parameters to avoid CORS redirect issues that occur
 * with POST requests from GitHub Pages to Apps Script.
 */

/**
 * Call the Apps Script Web App.
 *
 * @param {string} action  - Action name (from ACTIONS constants)
 * @param {Object} [data]  - Payload to send (will be JSON-stringified as query param)
 * @returns {Promise<import('../types/schemas.js').ApiResponse>}
 * @throws {Error} Network or parsing errors
 */
async function fetchAPI(action, data = {}) {
  const baseUrl = CONFIG.APPS_SCRIPT_URL;

  if (!baseUrl || baseUrl.includes('YOUR_DEPLOYMENT_ID')) {
    console.error('[API] Apps Script URL is not configured in js/config/config.js');
    return { success: false, error: 'App is not configured yet. Please contact the administrator.' };
  }

  const params = new URLSearchParams({
    action: action,
    data: JSON.stringify(data),
  });
  const url = baseUrl + '?' + params.toString();

  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();
    return json;
  } catch (err) {
    console.error(`[API] fetchAPI("${action}") failed:`, err);
    return {
      success: false,
      error: 'Could not reach the server. Please check your connection and try again.',
    };
  }
}
