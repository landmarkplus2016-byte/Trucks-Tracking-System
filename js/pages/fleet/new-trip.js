/**
 * pages/fleet/new-trip.js
 * ───────────────────────
 * Create a new trip with dynamic site entries.
 * WH Rep and coordinator dropdowns are loaded from the API on page load.
 */

(async function () {
  const form           = document.getElementById('trip-form');
  const submitBtn      = document.getElementById('submit-btn');
  const errorEl        = document.getElementById('form-error');
  const sitesContainer = document.getElementById('sites-container');
  const whRepSelect    = document.getElementById('wh-rep');

  const FALLBACK_WH_REPS = [
    { value: 'Ehab',  label: 'Ehab' },
    { value: 'Karam', label: 'Karam' },
  ];

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.remove('hidden');
  }

  // Disable form while dropdowns load
  whRepSelect.disabled = true;
  submitBtn.disabled   = true;

  const loadingTimeout = setTimeout(() => {
    // Fallback — let the user proceed with hardcoded options
    populateWhRep(FALLBACK_WH_REPS);
    coordinators = [];
    submitBtn.disabled = false;
  }, 10000);

  let user;
  try {
    user = requireRole(ROLES.FLEET);
  } catch (err) {
    clearTimeout(loadingTimeout);
    showError('Session expired. Please sign in again.');
    return;
  }

  renderNavbar(ROUTES.FLEET_NEW_TRIP);
  initNotificationBell();

  document.getElementById('trip-date').value = todayForInput();

  let siteCount    = 0;
  let coordinators = [];

  // Load WH reps and coordinators in parallel
  try {
    const [whRepsResult, coordResult] = await Promise.all([
      fetchAPI(ACTIONS.GET_LIST, { listName: 'whRep' }),
      fetchAPI(ACTIONS.GET_COORDINATORS, {}),
    ]);
    clearTimeout(loadingTimeout);

    const whReps = (whRepsResult.success && whRepsResult.data && whRepsResult.data.length)
      ? whRepsResult.data
      : FALLBACK_WH_REPS;

    coordinators = (coordResult.success && coordResult.data) ? coordResult.data : [];

    populateWhRep(whReps);
  } catch (err) {
    clearTimeout(loadingTimeout);
    populateWhRep(FALLBACK_WH_REPS);
    coordinators = [];
  }

  submitBtn.disabled = false;

  // Add first site entry after coordinators are loaded
  addSiteEntry();

  document.getElementById('add-site-btn').addEventListener('click', addSiteEntry);

  function populateWhRep(options) {
    whRepSelect.innerHTML =
      '<option value="">Select WH Rep…</option>' +
      options.map(o => `<option value="${escapeHtml(String(o.value || o.label))}">${escapeHtml(String(o.label || o.value))}</option>`).join('');
    whRepSelect.disabled = false;
  }

  function buildCoordinatorSelect(selectedEmail) {
    if (!coordinators.length) {
      // Fallback to email text input if no coordinators loaded
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
    div.innerHTML = `
      <div class="site-entry-header">
        <span class="site-entry-label">Site ${idx}</span>
        ${idx > 1 ? `<button type="button" class="btn btn-sm btn-danger" onclick="removeSiteEntry(this)">Remove</button>` : ''}
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Site Number <span class="required">*</span></label>
          <input type="text" class="form-control" name="siteNumber" data-field="site_${idx-1}_siteNumber" placeholder="e.g. SITE-042" required />
          <span class="form-error hidden" data-error="site_${idx-1}_siteNumber"></span>
        </div>
        <div class="form-group">
          <label class="form-label">Coordinator <span class="required">*</span></label>
          ${buildCoordinatorSelect(site?.coordinatorEmail || '')}
          <span class="form-error hidden" data-error="site_${idx-1}_email"></span>
        </div>
      </div>
    `;
    sitesContainer.appendChild(div);
    updateCostPreview();
  }

  window.removeSiteEntry = function (btn) {
    const entry = btn.closest('.site-entry');
    if (entry) {
      entry.remove();
      updateSiteLabels();
      updateCostPreview();
    }
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

    document.getElementById('preview-labor').textContent    = formatCurrency(labor);
    document.getElementById('preview-park').textContent     = formatCurrency(park);
    document.getElementById('preview-truck').textContent    = formatCurrency(truck);
    document.getElementById('preview-hotel').textContent    = formatCurrency(hotel);
    document.getElementById('preview-total').textContent    = formatCurrency(total);
    document.getElementById('preview-per-site').textContent = `${formatCurrency(perSite)} × ${siteEntries.length} site(s)`;
  }

  ['labor-cost','park-cost','truck-cost','hotel-cost'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updateCostPreview);
  });

  function collectFormData() {
    const sites = [];
    sitesContainer.querySelectorAll('.site-entry').forEach(el => {
      sites.push({
        siteNumber:       el.querySelector('[name="siteNumber"]')?.value.trim()       || '',
        coordinatorEmail: el.querySelector('[name="coordinatorEmail"]')?.value.trim() || '',
      });
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
        createdBy: user.email,
      },
      sites,
    };
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.classList.add('hidden');

    const payload = collectFormData();
    const errors  = validateTripForm({ ...payload.trip, sites: payload.sites });

    if (Object.keys(errors).length > 0) {
      displayFormErrors(form, errors);
      showError('Please fix the errors above.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Submitting…';

    const submitTimeout = setTimeout(() => {
      showError('Could not reach the server. Please check your connection.');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Submit Trip';
    }, 10000);

    try {
      await createTrip(payload);
      clearTimeout(submitTimeout);
      window.location.href = 'dashboard.html';
    } catch (err) {
      clearTimeout(submitTimeout);
      showError(err.message || 'Failed to create trip. Please try again.');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Submit Trip';
    }
  });
})();
