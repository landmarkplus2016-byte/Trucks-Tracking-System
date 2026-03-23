/**
 * pages/project/dashboard.js
 * ──────────────────────────
 * Project coordinator dashboard — pending JC count + stats.
 */

(async function () {
  const user = requireRole(ROLES.PROJECT);
  renderNavbar(ROUTES.PROJECT_DASHBOARD);
  initNotificationBell();

  const loadingEl  = document.getElementById('loading');
  const errorEl    = document.getElementById('page-error');
  const statsEl    = document.getElementById('coordinator-stats');
  const bannerEl   = document.getElementById('pending-banner');
  const bannerNumEl= document.getElementById('pending-banner-count');

  function showError(msg) {
    loadingEl.classList.add('hidden');
    errorEl.textContent = msg;
    errorEl.classList.remove('hidden');
  }

  const timeoutId = setTimeout(() => {
    showError('Could not reach the server. Please check your connection.');
  }, 10000);

  try {
    const trips = await getTrips({ email: user.email, role: ROLES.PROJECT });
    clearTimeout(timeoutId);
    loadingEl.classList.add('hidden');

    if (!trips.length) {
      statsEl.innerHTML = `<p class="text-muted">No trips assigned to you yet. You will be notified when a fleet coordinator assigns sites to you.</p>`;
      return;
    }

    const totalTrips  = trips.length;
    const pendingTrips= trips.filter(t => t.status !== TRIP_STATUS.COMPLETE).length;
    const totalCost   = trips.reduce((s, t) => s + (Number(t.totalCost) || 0), 0);

    if (pendingTrips > 0) {
      bannerNumEl.textContent = pendingTrips;
      bannerEl.classList.remove('hidden');
    }

    statsEl.innerHTML = `
      <div class="stat-card accent-primary">
        <div class="stat-card-label">Total Trips</div>
        <div class="stat-card-value">${totalTrips}</div>
      </div>
      <div class="stat-card accent-warning">
        <div class="stat-card-label">Pending JC Entry</div>
        <div class="stat-card-value">${pendingTrips}</div>
      </div>
      <div class="stat-card accent-success">
        <div class="stat-card-label">Total Cost (your sites)</div>
        <div class="stat-card-value">${formatCurrency(totalCost)}</div>
      </div>
    `;
  } catch (err) {
    clearTimeout(timeoutId);
    showError('Could not load your dashboard. Please refresh the page.');
  }
})();
