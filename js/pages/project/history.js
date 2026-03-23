/**
 * pages/project/history.js
 * ────────────────────────
 * Project coordinator trip history with cost breakdown.
 */

(async function () {
  const loadingEl    = document.getElementById('loading');
  const errorEl      = document.getElementById('page-error');
  const tbody        = document.getElementById('history-tbody');
  const filterDate   = document.getElementById('filter-date');
  const filterStatus = document.getElementById('filter-status');

  let allTrips = [];

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
    showError('Could not reach the server. Please refresh the page.');
    return;
  }

  renderNavbar(ROUTES.PROJECT_HISTORY);
  initNotificationBell();

  try {
    const result = await fetchAPI(ACTIONS.GET_TRIPS, { email: user.email, role: ROLES.PROJECT });
    clearTimeout(loadingTimeout);

    if (!result.success) {
      showError('Something went wrong. Please refresh the page or contact your administrator.');
      return;
    }

    hideLoading();
    allTrips = result.data || [];
    renderTable(allTrips);
  } catch (err) {
    clearTimeout(loadingTimeout);
    showError('Something went wrong. Please refresh the page or contact your administrator.');
  }

  [filterDate, filterStatus].forEach(el => el?.addEventListener('input', applyFilters));

  function applyFilters() {
    const date   = filterDate?.value   || '';
    const status = filterStatus?.value || '';
    const filtered = allTrips.filter(t => {
      if (date   && !t.date?.startsWith(date)) return false;
      if (status && t.status !== status)       return false;
      return true;
    });
    renderTable(filtered);
  }

  function renderTable(trips) {
    if (!trips.length) {
      const msg = allTrips.length === 0
        ? 'No trip history found.'
        : 'No trips match your filters.';
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">${msg}</td></tr>`;
      return;
    }
    const sorted = [...trips].sort((a, b) => new Date(b.date) - new Date(a.date));
    tbody.innerHTML = sorted.map(t => `
      <tr>
        <td>${escapeHtml(t.tripId)}</td>
        <td>${formatDate(t.date)}</td>
        <td>${escapeHtml(t.route)}</td>
        <td class="num">${formatCurrency(t.totalCost)}</td>
        <td><span class="status-pill ${t.status}">${t.status}</span></td>
        <td>
          <button class="trip-expand-btn" onclick="toggleDetail(this, '${escapeHtml(t.tripId)}')">
            View Cost Breakdown ▸
          </button>
        </td>
      </tr>
      <tr class="detail-row hidden" id="detail-${escapeHtml(t.tripId)}">
        <td colspan="6">
          <div class="trip-detail-panel" id="breakdown-${escapeHtml(t.tripId)}">
            <span class="spinner"></span> Loading…
          </div>
        </td>
      </tr>
    `).join('');
  }

  window.toggleDetail = async function (btn, tripId) {
    const detailRow   = document.getElementById(`detail-${tripId}`);
    const breakdownEl = document.getElementById(`breakdown-${tripId}`);
    const isOpen = !detailRow.classList.contains('hidden');

    if (isOpen) {
      detailRow.classList.add('hidden');
      btn.textContent = 'View Cost Breakdown ▸';
      return;
    }

    detailRow.classList.remove('hidden');
    btn.textContent = 'Hide ▾';

    const detailTimeoutId = setTimeout(() => {
      breakdownEl.innerHTML = `<span class="text-danger">Could not reach the server. Please check your connection.</span>`;
    }, 10000);

    try {
      const result = await fetchAPI(ACTIONS.GET_SITES_BY_TRIP, { tripId });
      clearTimeout(detailTimeoutId);

      if (!result.success) {
        breakdownEl.innerHTML = `<span class="text-danger">Something went wrong loading the breakdown.</span>`;
        return;
      }

      const sites = result.data || [];
      const trip  = allTrips.find(t => t.tripId === tripId);
      if (!trip) return;
      const breakdown = buildCostBreakdown(trip, sites);
      breakdown.laborCost  = trip.laborCost;
      breakdown.parkCost   = trip.parkCost;
      breakdown.truckCost  = trip.truckCost;
      breakdown.hotelCost  = trip.hotelCost;
      renderCostSummary(breakdownEl, breakdown);
    } catch (err) {
      clearTimeout(detailTimeoutId);
      breakdownEl.innerHTML = `<span class="text-danger">${escapeHtml(err.message || 'Failed to load breakdown.')}</span>`;
    }
  };
})();
