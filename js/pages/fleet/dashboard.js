/**
 * pages/fleet/dashboard.js
 * ────────────────────────
 * Fleet coordinator dashboard — shows stats and recent trips.
 */

(async function () {
  const user = requireRole(ROLES.FLEET);
  renderNavbar(ROUTES.FLEET_DASHBOARD);
  initNotificationBell();

  const statsEl       = document.getElementById('dashboard-stats');
  const recentTableEl = document.getElementById('recent-trips-tbody');
  const loadingEl     = document.getElementById('loading');
  const errorEl       = document.getElementById('page-error');

  function showError(msg) {
    loadingEl.classList.add('hidden');
    errorEl.textContent = msg;
    errorEl.classList.remove('hidden');
  }

  const timeoutId = setTimeout(() => {
    showError('Could not reach the server. Please check your connection.');
  }, 10000);

  try {
    const trips = await getTrips({ email: user.email });
    clearTimeout(timeoutId);
    loadingEl.classList.add('hidden');

    // Stats
    const totalTrips = trips.length;
    const totalCost  = trips.reduce((s, t) => s + (Number(t.totalCost) || 0), 0);
    const pending    = trips.filter(t => t.status !== TRIP_STATUS.COMPLETE).length;

    statsEl.innerHTML = `
      <div class="stat-card accent-primary">
        <div class="stat-card-label">Total Trips</div>
        <div class="stat-card-value">${totalTrips}</div>
      </div>
      <div class="stat-card accent-success">
        <div class="stat-card-label">Total Cost</div>
        <div class="stat-card-value">${formatCurrency(totalCost)}</div>
      </div>
      <div class="stat-card accent-warning">
        <div class="stat-card-label">Pending JC</div>
        <div class="stat-card-value">${pending}</div>
      </div>
    `;

    // Recent trips (last 10)
    const recent = [...trips].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);

    if (recent.length === 0) {
      recentTableEl.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No trips yet. Click '+ New Trip' to create your first trip.</td></tr>`;
    } else {
      recentTableEl.innerHTML = recent.map(t => `
        <tr>
          <td>${escapeHtml(t.tripId)}</td>
          <td>${formatDate(t.date)}</td>
          <td>${escapeHtml(t.driver)}</td>
          <td>${escapeHtml(t.route)}</td>
          <td class="num">${formatCurrency(t.totalCost)}</td>
          <td>
            <span class="status-pill ${t.status}">${t.status}</span>
          </td>
          <td>
            <div class="trip-actions">
              <a href="edit-trip.html?tripId=${encodeURIComponent(t.tripId)}" class="btn btn-sm btn-secondary">Edit</a>
            </div>
          </td>
        </tr>
      `).join('');
    }

  } catch (err) {
    clearTimeout(timeoutId);
    showError('Could not load trips. Please refresh the page.');
  }
})();
