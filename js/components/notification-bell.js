/**
 * components/notification-bell.js
 * ────────────────────────────────
 * Renders the notification bell into #notif-bell-container,
 * polls for unread count, and shows a dropdown panel.
 */

let _notifPollTimer = null;
let _notifPanelOpen = false;

/**
 * Initialize the notification bell for the current user.
 * Must be called after renderNavbar().
 */
function initNotificationBell() {
  const user = getCurrentUser();
  if (!user) return;

  const container = document.getElementById('notif-bell-container');
  if (!container) return;

  container.innerHTML = `
    <div class="notif-bell" id="notif-bell" title="Notifications" aria-label="Notifications">
      <svg viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-2.83-2h5.66A3 3 0 0110 18z"/>
      </svg>
      <span class="notif-count hidden" id="notif-count">0</span>
    </div>
    <div class="notif-panel hidden" id="notif-panel">
      <div class="notif-panel-header">Notifications</div>
      <div id="notif-list"><div class="notif-panel-empty">No new notifications</div></div>
    </div>
  `;

  document.getElementById('notif-bell').addEventListener('click', toggleNotifPanel);
  document.addEventListener('click', closeNotifPanelOutside);

  // Initial fetch + polling
  fetchAndRenderNotifications(user.email);
  _notifPollTimer = setInterval(() => fetchAndRenderNotifications(user.email), CONFIG.NOTIF_POLL_INTERVAL);
}

/** Stop the polling timer (call on page unload if needed) */
function destroyNotificationBell() {
  if (_notifPollTimer) clearInterval(_notifPollTimer);
  document.removeEventListener('click', closeNotifPanelOutside);
}

async function fetchAndRenderNotifications(email) {
  try {
    const notifs = await getUnread(email);
    updateBellCount(notifs.length);
    renderNotifList(notifs);
  } catch {
    // Silently fail — don't disturb the page UI
  }
}

function updateBellCount(count) {
  const badge = document.getElementById('notif-count');
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count > 99 ? '99+' : count;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

function renderNotifList(notifs) {
  const listEl = document.getElementById('notif-list');
  if (!listEl) return;

  if (!notifs || notifs.length === 0) {
    listEl.innerHTML = '<div class="notif-panel-empty">No new notifications</div>';
    return;
  }

  listEl.innerHTML = notifs.map(n => `
    <div class="notif-item unread" data-notif-id="${escapeHtml(n.notifId)}" onclick="handleNotifClick('${escapeHtml(n.notifId)}', '${escapeHtml(n.tripId)}')">
      <div>${escapeHtml(n.message)}</div>
      <div class="notif-item-time">${formatDateTime(n.createdAt)}</div>
    </div>
  `).join('');
}

async function handleNotifClick(notifId, tripId) {
  try { await markAsRead(notifId); } catch { /* ignore */ }
  closeNotifPanel();
  // Re-fetch to update badge
  const user = getCurrentUser();
  if (user) fetchAndRenderNotifications(user.email);
}

function toggleNotifPanel(e) {
  e.stopPropagation();
  const panel = document.getElementById('notif-panel');
  if (!panel) return;
  _notifPanelOpen = !_notifPanelOpen;
  panel.classList.toggle('hidden', !_notifPanelOpen);
}

function closeNotifPanel() {
  _notifPanelOpen = false;
  const panel = document.getElementById('notif-panel');
  if (panel) panel.classList.add('hidden');
}

function closeNotifPanelOutside(e) {
  const bell = document.getElementById('notif-bell');
  const panel = document.getElementById('notif-panel');
  if (bell && !bell.contains(e.target) && panel && !panel.contains(e.target)) {
    closeNotifPanel();
  }
}
