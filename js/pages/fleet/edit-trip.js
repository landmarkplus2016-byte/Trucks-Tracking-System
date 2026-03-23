/**
 * pages/fleet/edit-trip.js
 * ────────────────────────
 * Edit an existing trip. Reads tripId from query string.
 * WH Rep and coordinator dropdowns are loaded from the API on page load.
 */

(async function () {
  const loadingEl     = document.getElementById('loading');
  const errorEl       = document.getElementById('page-error');
  const formSection   = document.getElementById('form-section');
  const form          = document.getElementById('trip-form');
  const submitBtn     = document.getElementById('submit-btn');
  const deleteBtn     = document.getElementById('delete-btn');
  const formErrorEl   = document.getElementById('form-error');
  const sitesContainer= document.getElementById('sites-container');
  const whRepSelect   = document.getElementById('wh-rep');

  const FALLBACK_WH_REPS = [
    { value: 'Ehab',  label: 'Ehab' },
    { value: 'Karam', label: 'Karam' },
  ];

  function hideLoading() { loadingEl?.remove(); }

  function showPageError(msg) {
    hideLoading();
    errorEl.textContent = msg;
    errorEl.classList.remove('hidden');
  }

  const loadingTimeout = setTimeout(() => {
    showPageError('Could not reach the server. Please refresh the page.');
  }, 10000);

  let user;
  try {
    user = requireRole(ROLES.FLEET);
  } catch (err) {
    clearTimeout(loadingTimeout);
    showPageError('Could not reach the server. Please refresh the page.');
    return;
  }

  renderNavbar(ROUTES.FLEET_EDIT_TRIP);
  initNotificationBell();

  const params = new URLSearchParams(window.location.search);
  const tripId = params.get('tripId');

  if (!tripId) {
    clearTimeout(loadingTimeout);
    showPageError('No trip ID specified.');
    return;
  }

  let siteCount    = 0;
  let coordinators = [];

  try {
    const [tripResult, sitesResult, whRepsResult, coordResult] = await Promise.all([
      fetchAPI(ACTIONS.GET_TRIPS,         { tripId }),
      fetchAPI(ACTIONS.GET_SITES_BY_TRIP, { tripId }),
      fetchAPI(ACTIONS.GET_LIST,          { listName: 'whRep' }),
      fetchAPI(ACTIONS.GET_COORDINATORS,  {}),
    ]);
    clearTimeout(loadingTimeout);

    if (!tripResult.success || !sitesResult.success) {
      showPageError('Something went wrong. Please refresh the page or contact your administrator.');
      return;
    }

    const trips = tripResult.data  || [];
    const sites = sitesResult.data || [];
    const trip  = trips.find(t => t.tripId === tripId) || trips[0];

    if (!trip) {
      showPageError('Could not load trip details. Please go back and try again.');
      return;
    }

    // Populate WH rep dropdown
    const whReps = (whRepsResult.success && whRepsResult.data && whRepsResult.data.length)
      ? whRepsResult.data
      : FALLBACK_WH_REPS;

    whRepSelect.innerHTML =
      '<option value="">Select WH Rep…</option>' +
      whReps.map(o => {
        const val = escapeHtml(String(o.value || o.label));
        const lbl = escapeHtml(String(o.label || o.value));
        const selected = (o.value === trip.whRep || o.label === trip.whRep) ? 'selected' : '';
        return `<option value="${val}" ${selected}>${lbl}</option>`;
      }).join('');

    // If the stored value isn't in the list, add it so it stays selected
    if (trip.whRep && !whReps.some(o => o.value === trip.whRep || o.label === trip.whRep)) {
      whRepSelect.innerHTML += `<option value="${escapeHtml(trip.whRep)}" selected>${escapeHtml(trip.whRep)}</option>`;
    }

    coordinators = (coordResult.success && coordResult.data) ? coordResult.data : [];

    hideLoading();
    formSection.classList.remove('hidden');

    // Populate trip fields
    document.getElementById('trip-id-label').textContent = tripId;
    document.getElementById('trip-date').value   = trip.date      || '';
    document.getElementById('driver').value      = trip.driver    || '';
    document.getElementById('route').value       = trip.route     || '';
    document.getElementById('labor-cost').value  = trip.laborCost || '';
    document.getElementById('park-cost').value   = trip.parkCost  || '';
    document.getElementById('truck-cost').value  = trip.truckCost || '';
    document.getElementById('hotel-cost').value  = trip.hotelCost || '';

    // Populate site entries
    sites.forEach(s => addSiteEntry(s));
    if (sites.length === 0) addSiteEntry();

    updateCostPreview();
  } catch (err) {
    clearTimeout(loadingTimeout);
    showPageError('Could not load trip details. Please go back and try again.');
    return;
  }

  document.getElementById('add-site-btn').addEventListener('click', () => addSiteEntry());

  function buildCoordinatorSelect(selectedEmail) {
    if (!coordinators.length) {
      return `<input type="email" class="form-control" name="coordinatorEmail" placeholder="coordinator@example.com" value="${escapeHtml(selectedEmail || '')}" />`;
    }
    const options = coordinators.map(c =>
      `<option value="${escapeHtml(c.email)}" ${c.email === selectedEmail ? 'selected' : ''}>${escapeHtml(c.name)}</option>`
    ).join('');
    return `<select class="form-control" name="coordinatorEmail"><option value="">Select coordinator…</option>${options}</select>`;
  }

  function addSiteEntry(site = null) {
    siteCount++;
    const idx = siteCount;
    const div = document.createElement('div');
    div.className = 'site-entry';
    div.dataset.siteIndex = idx;
    if (site?.siteId) div.dataset.siteId = site.siteId;

    div.innerHTML = `
      <div class="site-entry-header">
        <span class="site-entry-label">Site ${idx}</span>
        <button type="button" class="btn btn-sm btn-danger" onclick="removeSiteEntry(this)">Remove</button>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Site Number <span class="required">*</span></label>
          <input type="text" class="form-control" name="siteNumber" value="${escapeHtml(site?.siteNumber || '')}" placeholder="e.g. SITE-042" />
        </div>
        <div class="form-group">
          <label class="form-label">Coordinator <span class="required">*</span></label>
          ${buildCoordinatorSelect(site?.coordinatorEmail || '')}
        </div>
      </div>
    `;
    sitesContainer.appendChild(div);
  }

  window.removeSiteEntry = function (btn) {
    btn.closest('.site-entry')?.remove();
    updateSiteLabels();
    updateCostPreview();
  };

  function updateSiteLabels() {
    sitesContainer.querySelectorAll('.site-entry').forEach((el, i) => {
      const label = el.querySelector('.site-entry-label');
      if (label) label.textContent = `Site ${i + 1}`;
    });
  }

  function updateCostPreview() {
    const labor = Number(document.getElementById('labor-cost').value) || 0;
    const park  = Number(document.getElementById('park-cost').value)  || 0;
    const truck = Number(document.getElementById('truck-cost').value) || 0;
    const hotel = Number(document.getElementById('hotel-cost').value) || 0;
    const siteEntries = sitesContainer.querySelectorAll('.site-entry');
    const total   = sumTripCosts({ laborCost: labor, parkCost: park, truckCost: truck, hotelCost: hotel });
    const perSite = splitCostPerSite(total, siteEntries.length);
    document.getElementById('preview-total').textContent    = formatCurrency(total);
    document.getElementById('preview-per-site').textContent = `${formatCurrency(perSite)} × ${siteEntries.length} site(s)`;
  }

  ['labor-cost','park-cost','truck-cost','hotel-cost'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updateCostPreview);
  });

  function collectFormData() {
    const sites = [];
    sitesContainer.querySelectorAll('.site-entry').forEach(el => {
      const entry = {
        siteNumber:       el.querySelector('[name="siteNumber"]')?.value.trim()       || '',
        coordinatorEmail: el.querySelector('[name="coordinatorEmail"]')?.value.trim() || '',
      };
      if (el.dataset.siteId) entry.siteId = el.dataset.siteId;
      sites.push(entry);
    });

    return {
      trip: {
        date:      document.getElementById('trip-date').value,
        whRep:     whRepSelect.value,
        driver:    document.getElementById('driver').value.trim(),
        route:     document.getElementById('route').value.trim(),
        laborCost: Number(document.getElementById('labor-cost').value) || 0,
        parkCost:  Number(document.getElementById('park-cost').value)  || 0,
        truckCost: Number(document.getElementById('truck-cost').value) || 0,
        hotelCost: Number(document.getElementById('hotel-cost').value) || 0,
      },
      sites,
    };
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formErrorEl.classList.add('hidden');
    const payload = collectFormData();
    const errors  = validateTripForm({ ...payload.trip, sites: payload.sites });
    if (Object.keys(errors).length > 0) {
      displayFormErrors(form, errors);
      formErrorEl.textContent = 'Please fix the errors above.';
      formErrorEl.classList.remove('hidden');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Saving…';

    const saveTimeoutId = setTimeout(() => {
      formErrorEl.textContent = 'Could not reach the server. Please check your connection.';
      formErrorEl.classList.remove('hidden');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Save Changes';
    }, 10000);

    try {
      await updateTrip(tripId, payload);
      clearTimeout(saveTimeoutId);
      window.location.href = 'dashboard.html';
    } catch (err) {
      clearTimeout(saveTimeoutId);
      formErrorEl.textContent = 'Could not save changes. Please try again.';
      formErrorEl.classList.remove('hidden');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Save Changes';
    }
  });

  deleteBtn.addEventListener('click', async () => {
    const confirmed = await showConfirm({
      title:       'Delete Trip',
      message:     `Are you sure you want to delete trip ${tripId}? This cannot be undone.`,
      confirmText: 'Delete',
      danger:      true,
    });
    if (!confirmed) return;

    deleteBtn.disabled = true;
    deleteBtn.innerHTML = '<span class="spinner"></span>';

    const deleteTimeoutId = setTimeout(() => {
      showAlert({ title: 'Error', message: 'Could not reach the server. Please check your connection.' });
      deleteBtn.disabled = false;
      deleteBtn.textContent = 'Delete Trip';
    }, 10000);

    try {
      await deleteTrip(tripId);
      clearTimeout(deleteTimeoutId);
      window.location.href = 'dashboard.html';
    } catch (err) {
      clearTimeout(deleteTimeoutId);
      await showAlert({ title: 'Error', message: err.message || 'Failed to delete trip.' });
      deleteBtn.disabled = false;
      deleteBtn.textContent = 'Delete Trip';
    }
  });
})();
