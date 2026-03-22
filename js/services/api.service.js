/**
 * services/api.service.js
 * ───────────────────────
 * Single fetch gateway to the Apps Script Web App.
 * All other service files call fetchAPI() — never fetch directly.
 *
 * Apps Script only supports GET with query params or POST with form data
 * when accessed cross-origin from GitHub Pages, so we use POST + URLSearchParams.
 */

/**
 * Call the Apps Script Web App.
 *
 * @param {string} action  - Action name (from ACTIONS constants)
 * @param {Object} [data]  - Payload to send (will be JSON-stringified in body)
 * @returns {Promise<import('../types/schemas.js').ApiResponse>}
 * @throws {Error} Network or parsing errors
 */
async function fetchAPI(action, data = {}) {
  const url = CONFIG.APPS_SCRIPT_URL;

  if (!url || url.includes('YOUR_DEPLOYMENT_ID')) {
    console.error('[API] Apps Script URL is not configured in js/config/config.js');
    return { success: false, error: 'App is not configured yet. Please contact the administrator.' };
  }

  const params = new URLSearchParams();
  params.append('action', action);
  params.append('data', JSON.stringify(data));

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: params,
      // Apps Script Web App requires no-cors only when not using JSONP;
      // with ContentService + CORS headers it works in cors mode.
      mode: 'cors',
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
