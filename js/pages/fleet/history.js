/**
 * pages/fleet/history.js
 * ──────────────────────
 * Fleet coordinator trip history with filtering.
 */

(async function () {
  const user = requireRole(ROLES.FLEET);
  renderNavbar(ROUTES.FLEET_HISTORY);
  initNotificationBell();

  const tbody    = document.getElementById('history-tbody');
  const loadingEl= document.getElementById('loading');
  const errorEl  = document.getElementById('page-error');
  const filterDate   = document.getElementById('filter-date');
  const filterStatus = document.getElementById('filter-status');
  const filterSearch = document.getElementById('filter-search');

  let allTrips = [];

  try {
    allTrips = await getTrips({ email: user.email });
    loadingEl.classList.add('hidden');
    renderTable(allTrips);
  } catch (err) {
    loadingEl.classList.add('hidden');
    errorEl.textContent = err.message || 'Failed to load history.';
    errorEl.classList.remove('hidden');
  }

  [filterDate, filterStatus, filterSearch].forEach(el => {
    el?.addEventListener('input', applyFilters);
  });

  function applyFilters() {
    const date   = filterDate?.value   || '';
    const status = filterStatus?.value || '';
    const search = (filterSearch?.value || '').toLowerCase();

    const filtered = allTrips.filter(t => {
      if (date   && !t.date?.startsWith(date))              return false;
      if (status && t.status !== status)                    return false;
      if (search && !JSON.stringify(t).toLowerCase().includes(search)) return false;
      return true;
    });
    renderTable(filtered);
  }

  function renderTable(trips) {
    if (!trips.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No trips match your filters.</td></tr>';
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
