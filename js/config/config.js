/**
 * config.js
 * ─────────
 * Single source of truth for the Apps Script Web App URL and
 * any environment-level constants.
 *
 * HOW TO UPDATE:
 *   1. Deploy your Apps Script project as a Web App.
 *   2. Copy the URL.
 *   3. Replace the placeholder below — this is the ONLY file
 *      where the URL should ever appear.
 */

const CONFIG = Object.freeze({
  /** Replace with your deployed Apps Script Web App URL */
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',

  /** App display name */
  APP_NAME: 'Trucks Tracking System',

  /** How often (ms) the notification bell polls for new unread items */
  NOTIF_POLL_INTERVAL: 60_000,

  /** Session storage key for the logged-in user object */
  SESSION_KEY: 'tts_user',
});
