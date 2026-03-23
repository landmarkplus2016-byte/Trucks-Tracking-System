/**
 * pages/project/pending-jc.js
 * ───────────────────────────
 * Project coordinator: view pending trips and enter JC numbers.
 */

(async function () {
  const user = requireRole(ROLES.PROJECT);
  renderNavbar(ROUTES.PROJECT_PENDING_JC);
  initNotificationBell();

  const loadingEl = document.getElementById('loading');
  const errorEl   = document.getElementById('page-error');
  const contentEl = document.getElementById('pending-content');
  const emptyEl   = document.getElementById('empty-state');

  function showError(msg) {
    loadingEl.classList.add('hidden');
    errorEl.textContent = msg;
    errorEl.classList.remove('hidden');
  }

  const timeoutId = setTimeout(() => {
    showError('Could not reach the server. Please check your connection.');
  }, 10000);

  try {
    // Get trips where this coordinator has pending sites
    const trips = await getTrips({ email: user.email, role: ROLES.PROJECT, jcStatus: JC_STATUS.PENDING });
    clearTimeout(timeoutId);
    loadingEl.classList.add('hidden');

    if (!trips.length) {
      emptyEl.textContent = 'No pending job codes. All your sites are up to date.';
      emptyEl.classList.remove('hidden');
      return;
    }

    contentEl.classList.remove('hidden');

    // For each trip load its sites, render a card
    for (const trip of trips) {
      let sites = [];
      try {
        const allSites = await getSitesByTrip(trip.tripId);
        // Only show this coordinator's sites
        sites = allSites.filter(s => s.coordinatorEmail === user.email && s.jcStatus === JC_STATUS.PENDING);
      } catch { /* skip */ }

      if (!sites.length) continue;

      const card = document.createElement('div');
      card.className = 'card pending-trip-card';
      card.innerHTML = `
        <div class="card-header">
          <span class="card-title">Trip ${escapeHtml(trip.tripId)}</span>
          <span class="status-pill pending">Pending JC</span>
        </div>
        <div class="card-body">
          <div class="trip-info-grid">
            <div class="trip-info-item">
              <span class="trip-info-label">Date</span>
              <span class="trip-info-value">${formatDate(trip.date)}</span>
            </div>
            <div class="trip-info-item">
              <span class="trip-info-label">Driver</span>
              <span class="trip-info-value">${escapeHtml(trip.driver)}</span>
            </div>
            <div class="trip-info-item">
              <span class="trip-info-label">Route</span>
              <span class="trip-info-value">${escapeHtml(trip.route)}</span>
            </div>
            <div class="trip-info-item">
              <span class="trip-info-label">Cost / Site</span>
              <span class="trip-info-value">${formatCurrency(splitCostPerSite(trip.totalCost, sites.length))}</span>
            </div>
          </div>
          <div id="sites-${escapeHtml(trip.tripId)}"></div>
        </div>
      `;
      contentEl.appendChild(card);

      // Render the site list with JC inputs
      renderSiteList(
        document.getElementById(`sites-${trip.tripId}`),
        sites,
        async (siteId, jobCode) => {
          await updateJobCode(siteId, jobCode);
        }
      );
    }

  } catch (err) {
    clearTimeout(timeoutId);
    showError('Could not load pending items. Please refresh the page.');
  }
})();
