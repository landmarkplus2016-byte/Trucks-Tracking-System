/**
 * Formats an ISO date string (YYYY-MM-DD or full ISO datetime)
 * into a human-readable locale string.
 *
 * @param isoDate - ISO date string, e.g. "2025-03-15" or "2025-03-15T10:30:00Z"
 * @returns formatted string, e.g. "Mar 15, 2025"
 */
export function formatDate(isoDate: string): string {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Formats a Date object or ISO string into the format expected by
 * Google Sheets (MM/DD/YYYY).
 *
 * @param date - Date object or ISO date string
 * @returns formatted string, e.g. "03/15/2025"
 */
export function formatDateForSheets(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

/**
 * Returns today's date as an ISO date string (YYYY-MM-DD),
 * suitable for use in <input type="date"> fields.
 */
export function todayISO(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Formats a full ISO datetime string into a readable datetime string.
 *
 * @param isoDatetime - ISO datetime string, e.g. "2025-03-15T10:30:00Z"
 * @returns formatted string, e.g. "Mar 15, 2025, 10:30 AM"
 */
export function formatDateTime(isoDatetime: string): string {
  if (!isoDatetime) return '';
  const date = new Date(isoDatetime);
  if (isNaN(date.getTime())) return isoDatetime;
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
