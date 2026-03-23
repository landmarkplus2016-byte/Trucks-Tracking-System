/**
 * pages/fleet/history.js
 * ──────────────────────
 * Fleet coordinator trip history with filtering.
 */

(async function () {
  const user = requireRole(ROLES.FLEET);
  renderNavbar(ROUTES.FLEET_HISTORY);
  initNotificationBell();

  const tbody        = document.getElementById('history-tbody');
  const loadingEl    = document.getElementById('loading');
  const errorEl      = document.getElementById('page-error');
  const filterDate   = document.getElementById('filter-date');
  const filterStatus = document.getElementById('filter-status');
  const filterSearch = document.getElementById('filter-search');

  let allTrips = [];

  function showError(msg) {
    loadingEl.classList.add('hidden');
    errorEl.textContent = msg;
    errorEl.classList.remove('hidden');
  }

  const timeoutId = setTimeout(() => {
    showError('Could not reach the server. Please check your connection.');
  }, 10000);

  try {
    allTrips = await getTrips({ email: user.email });
    clearTimeout(timeoutId);
    loadingEl.classList.add('hidden');
    renderTable(allTrips);
  } catch (err) {
    clearTimeout(timeoutId);
    showError('Could not load trip history. Please refresh the page.');
  }

  [filterDate, filterStatus, filterSearch].forEach(el => {
    el?.addEventListener('input', applyFilters);
  });

  function applyFilters() {
    const date   = filterDate?.value   || '';
    const status = filterStatus?.value || '';
    const search = (filterSearch?.value || '').toLowerCase();

    const filtered = allTrips.filter(t => {
      if (date   && !t.date?.startsWith(date))                          return false;
      if (status && t.status !== status)                                return false;
      if (search && !JSON.stringify(t).toLowerCase().includes(search)) return false;
      return true;
    });
    renderTable(filtered);
  }

  function renderTable(trips) {
    if (!trips.length) {
      const msg = allTrips.length === 0
        ? 'No trip history found.'
        : 'No trips match your filters.';
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">${msg}</td></tr>`;
      return;
    }
    const sorted = [...trips].sort((a, b) => new Date(b.date) - new Date(a.date));
    tbody.innerHTML = sorted.map(t => `
      <tr>
        <td>${escapeHtml(t.tripId)}</td>
        <td>${formatDate(t.date)}</td>
        <td>${escapeHtml(t.driver)}</td>
        <td>${escapeHtml(t.route)}</td>
        <td class="num">${formatCurrency(t.totalCost)}</td>
        <td><span class="status-pill ${t.status}">${t.status}</span></td>
        <td>
          <a href="edit-trip.html?tripId=${encodeURIComponent(t.tripId)}" class="btn btn-sm btn-secondary">Edit</a>
        </td>
      </tr>
    `).join('');
  }
})();
