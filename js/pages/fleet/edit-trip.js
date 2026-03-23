/**
 * pages/fleet/edit-trip.js
 * ────────────────────────
 * Edit an existing trip. Reads tripId from query string.
 */

(async function () {
  const user = requireRole(ROLES.FLEET);
  renderNavbar(ROUTES.FLEET_EDIT_TRIP);
  initNotificationBell();

  const params  = new URLSearchParams(window.location.search);
  const tripId  = params.get('tripId');

  const loadingEl     = document.getElementById('loading');
  const errorEl       = document.getElementById('page-error');
  const formSection   = document.getElementById('form-section');
  const form          = document.getElementById('trip-form');
  const submitBtn     = document.getElementById('submit-btn');
  const deleteBtn     = document.getElementById('delete-btn');
  const formErrorEl   = document.getElementById('form-error');
  const sitesContainer= document.getElementById('sites-container');

  if (!tripId) {
    errorEl.textContent = 'No trip ID specified.';
    errorEl.classList.remove('hidden');
    loadingEl.classList.add('hidden');
    return;
  }

  let currentSites = [];
  let siteCount    = 0;

  try {
    // Load trip + sites in parallel
    const [trips, sites] = await Promise.all([
      getTrips({ tripId }),
      getSitesByTrip(tripId),
    ]);

    const trip = trips.find(t => t.tripId === tripId) || trips[0];
    if (!trip) throw new Error('Trip not found.');

    currentSites = sites;
    loadingEl.classList.add('hidden');
    formSection.classList.remove('hidden');

    // Populate trip fields
    document.getElementById('trip-id-label').textContent = tripId;
    document.getElementById('trip-date').value   = trip.date     || '';
    document.getElementById('wh-rep').value      = trip.whRep    || '';
    document.getElementById('driver').value      = trip.driver   || '';
    document.getElementById('route').value       = trip.route    || '';
    document.getElementById('labor-cost').value  = trip.laborCost|| 0;
    document.getElementById('park-cost').value   = trip.parkCost || 0;
    document.getElementById('truck-cost').value  = trip.truckCost|| 0;
    document.getElementById('hotel-cost').value  = trip.hotelCost|| 0;

    // Populate site entries
    sites.forEach(s => addSiteEntry(s));
    if (sites.length === 0) addSiteEntry();

    updateCostPreview();
  } catch (err) {
    loadingEl.classList.add('hidden');
    errorEl.textContent = err.message || 'Failed to load trip.';
    errorEl.classList.remove('hidden');
    return;
  }

  document.getElementById('add-site-btn').addEventListener('click', () => addSiteEntry());

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
          <label class="form-label">Coordinator Email <span class="required">*</span></label>
          <input type="email" class="form-control" name="coordinatorEmail" value="${escapeHtml(site?.coordinatorEmail || '')}" placeholder="coordinator@example.com" />
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
        whRep:     document.getElementById('wh-rep').value.trim(),
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

    try {
      await updateTrip(tripId, payload);
      window.location.href = 'dashboard.html';
    } catch (err) {
      formErrorEl.textContent = err.message || 'Failed to save changes.';
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

    try {
      await deleteTrip(tripId);
      window.location.href = 'dashboard.html';
    } catch (err) {
      await showAlert({ title: 'Error', message: err.message || 'Failed to delete trip.' });
      deleteBtn.disabled = false;
      deleteBtn.textContent = 'Delete Trip';
    }
  });
})();
