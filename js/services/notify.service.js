/**
 * services/notify.service.js
 * ──────────────────────────
 * Notification operations.
 */

/**
 * Get unread notifications for the current user.
 * @param {string} email - Current user email
 * @returns {Promise<import('../types/schemas.js').Notification[]>}
 */
async function getUnread(email) {
  const result = await fetchAPI(ACTIONS.GET_UNREAD_NOTIFICATIONS, { email });
  if (!result.success) throw new Error(result.error);
  return result.data || [];
}

/**
 * Mark a notification as read.
 * @param {string} notifId
 * @returns {Promise<void>}
 */
async function markAsRead(notifId) {
  const result = await fetchAPI(ACTIONS.MARK_NOTIF_READ, { notifId });
  if (!result.success) throw new Error(result.error);
}

/**
 * Mark all notifications as read for a user.
 * @param {string[]} notifIds
 * @returns {Promise<void>}
 */
async function markAllAsRead(notifIds) {
  await Promise.all(notifIds.map(id => markAsRead(id)));
}
