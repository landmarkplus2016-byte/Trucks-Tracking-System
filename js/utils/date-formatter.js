/**
 * utils/date-formatter.js
 * ───────────────────────
 * Date display and formatting helpers.
 */

/**
 * Format a date string or Date object for display.
 * @param {string|Date} value
 * @returns {string} e.g. "Mar 22, 2026"
 */
function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Format a datetime string for display.
 * @param {string|Date} value
 * @returns {string} e.g. "Mar 22, 2026 at 3:45 PM"
 */
function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

/**
 * Format a date for sending to Google Sheets (YYYY-MM-DD).
 * @param {string|Date} value
 * @returns {string} "2026-03-22"
 */
function formatDateForSheets(value) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Get today's date as a YYYY-MM-DD string (for date input default values).
 * @returns {string}
 */
function todayForInput() {
  return formatDateForSheets(new Date());
}

/**
 * Format a currency number.
 * @param {number} value
 * @returns {string} e.g. "$1,234.56"
 */
function formatCurrency(value) {
  const n = Number(value);
  if (isNaN(n)) return '$0.00';
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}
