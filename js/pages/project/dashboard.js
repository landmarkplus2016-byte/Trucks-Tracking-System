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

  try {
    const trips = await getTrips({ email: user.email, role: ROLES.PROJECT });
    loadingEl.classList.add('hidden');

    // We need sites to know which have pending JCs
    // For dashboard simplicity, count trips where status !== complete
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
    loadingEl.classList.add('hidden');
    errorEl.textContent = err.message || 'Failed to load dashboard.';
    errorEl.classList.remove('hidden');
  }
})();
