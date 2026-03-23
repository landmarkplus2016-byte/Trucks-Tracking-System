/**
 * pages/project/dashboard.js
 * ──────────────────────────
 * Project coordinator dashboard — pending JC count + stats.
 */

(async function () {
  const loadingEl  = document.getElementById('loading');
  const errorEl    = document.getElementById('page-error');
  const statsEl    = document.getElementById('coordinator-stats');
  const bannerEl   = document.getElementById('pending-banner');
  const bannerNumEl= document.getElementById('pending-banner-count');

  function hideLoading() {
    loadingEl?.remove();
  }

  function showError(msg) {
    hideLoading();
    errorEl.textContent = msg;
    errorEl.classList.remove('hidden');
  }

  const loadingTimeout = setTimeout(() => {
    showError('Could not reach the server. Please refresh the page.');
  }, 10000);

  let user;
  try {
    user = requireRole(ROLES.PROJECT);
  } catch (err) {
    clearTimeout(loadingTimeout);
    window.location.href = '../../index.html';
    return;
  }

  renderNavbar(ROUTES.PROJECT_DASHBOARD);
  initNotificationBell();

  try {
    const result = await fetchAPI(ACTIONS.GET_TRIPS, { email: user.email, role: ROLES.PROJECT });
    clearTimeout(loadingTimeout);

    if (!result.success) {
      showError('Something went wrong. Please refresh the page or contact your administrator.');
      return;
    }

    hideLoading();
    const trips = result.data || [];

    if (!trips.length) {
      statsEl.innerHTML = `<p class="text-muted">No trips assigned to you yet. You will be notified when new trips are assigned.</p>`;
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
    clearTimeout(loadingTimeout);
    showError('Something went wrong. Please refresh the page or contact your administrator.');
  }
})();
