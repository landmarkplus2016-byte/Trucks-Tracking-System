/**
 * pages/fleet/edit-trip.js
 * ────────────────────────
 * Edit an existing trip. Reads tripId from query string.
 * Sites are displayed as groups: one group per coordinator,
 * with multiple site numbers in a single text field (/ or - separated).
 */

(async function () {
  const loadingEl      = document.getElementById('loading');
  const errorEl        = document.getElementById('page-error');
  const formSection    = document.getElementById('form-section');
  const form           = document.getElementById('trip-form');
  const submitBtn      = document.getElementById('submit-btn');
  const deleteBtn      = document.getElementById('delete-btn');
  const formErrorEl    = document.getElementById('form-error');
  const sitesContainer = document.getElementById('sites-container');
  const whRepSelect    = document.getElementById('whRep');

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

  let groupCount = 0;

  async function loadCoordinatorOptions(selectEl, selectedEmail) {
    try {
      const items = await getListValues('coordinator');
      const list = (items && items.length) ? items : await getCoordinators();
      selectEl.innerHTML = '<option value="">Select Coordinator…</option>';
      list.forEach(function (item) {
        const opt = document.createElement('option');
        opt.value = item.value;
        opt.textContent = item.label;
        selectEl.appendChild(opt);
      });
      if (selectedEmail) selectEl.value = selectedEmail;
    } catch (err) {
      selectEl.innerHTML = '<option value="">Could not load coordinators</option>';
    }
  }

  try {
    const [tripResult, sitesResult, whRepsResult] = await Promise.all([
      fetchAPI(ACTIONS.GET_TRIPS,         { tripId }),
      fetchAPI(ACTIONS.GET_SITES_BY_TRIP, { tripId }),
      fetchAPI(ACTIONS.GET_LIST,          { listName: 'whRep' }),
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
        const val      = escapeHtml(String(o.value || o.label));
        const lbl      = escapeHtml(String(o.label || o.value));
        const selected = (o.value === trip.whRep || o.label === trip.whRep) ? 'selected' : '';
        return `<option value="${val}" ${selected}>${lbl}</option>`;
      }).join('');

    if (trip.whRep && !whReps.some(o => o.value === trip.whRep || o.label === trip.whRep)) {
      whRepSelect.innerHTML += `<option value="${escapeHtml(trip.whRep)}" selected>${escapeHtml(trip.whRep)}</option>`;
    }

    hideLoading();
    formSection.classList.remove('hidden');

    // Populate trip fields
    document.getElementById('trip-id-label').textContent = tripId;
    document.getElementById('trip-date').value  = trip.date      || '';
    document.getElementById('driver').value     = trip.driver    || '';
    document.getElementById('route').value      = trip.route     || '';
    document.getElementById('laborCost').value  = trip.laborCost || '';
    document.getElementById('parkCost').value   = trip.parkCost  || '';
    document.getElementById('truckCost').value  = trip.truckCost || '';
    document.getElementById('hotelCost').value  = trip.hotelCost || '';

    // Group existing sites by coordinator email
    const groupMap = {};
    sites.forEach(s => {
      const email = String(s.coordinatorEmail || '').toLowerCase().trim();
      if (!groupMap[email]) groupMap[email] = { coordinatorEmail: s.coordinatorEmail || '', originals: [] };
      groupMap[email].originals.push(s);
    });

    const groups = Object.values(groupMap).map(g => ({
      coordinatorEmail: g.coordinatorEmail,
      rawSites: g.originals.map(s => s.siteNumber).join('/'),
      originals: g.originals,
    }));

    if (groups.length === 0) {
      addGroupEntry();
    } else {
      groups.forEach(g => addGroupEntry(g));
    }

    updateCostPreview();
  } catch (err) {
    clearTimeout(loadingTimeout);
    showPageError('Could not load trip details. Please go back and try again.');
    return;
  }

  document.getElementById('add-site-btn').addEventListener('click', () => addGroupEntry());

  function addGroupEntry(group = null) {
    groupCount++;
    const idx = groupCount;
    const div = document.createElement('div');
    div.className = 'site-entry';
    div.dataset.groupIndex = idx;
    if (group?.originals) div.dataset.originals = JSON.stringify(group.originals);

    div.innerHTML = `
      <div class="site-entry-header">
        <span class="site-entry-label">Group ${idx}</span>
        <button type="button" class="btn btn-sm btn-danger" onclick="removeGroupEntry(this)">Remove</button>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Sites <span class="required">*</span></label>
          <input type="text" class="form-control" name="groupSites"
                 placeholder="e.g. 1234/5678/8907 or 1234-5678-8907"
                 value="${escapeHtml(group?.rawSites || '')}" />
          <span class="form-error hidden sites-field-error"></span>
        </div>
        <div class="form-group">
          <label class="form-label">Coordinator <span class="required">*</span></label>
          <select class="form-control coordinator-select" name="coordinatorEmail">
            <option value="">Loading…</option>
          </select>
          <span class="form-error hidden coord-field-error"></span>
        </div>
      </div>
    `;
    sitesContainer.appendChild(div);

    div.querySelector('[name="groupSites"]').addEventListener('input', updateCostPreview);

    const selectEl = div.querySelector('.coordinator-select');
    loadCoordinatorOptions(selectEl, group?.coordinatorEmail || '');

    updateCostPreview();
  }

  window.removeGroupEntry = function (btn) {
    btn.closest('.site-entry')?.remove();
    updateGroupLabels();
    updateCostPreview();
  };

  function updateGroupLabels() {
    sitesContainer.querySelectorAll('.site-entry').forEach((el, i) => {
      const label = el.querySelector('.site-entry-label');
      if (label) label.textContent = `Group ${i + 1}`;
    });
  }

  function updateCostPreview() {
    const labor = Number(document.getElementById('laborCost').value) || 0;
    const park  = Number(document.getElementById('parkCost').value)  || 0;
    const truck = Number(document.getElementById('truckCost').value) || 0;
    const hotel = Number(document.getElementById('hotelCost').value) || 0;
    const total = sumTripCosts({ laborCost: labor, parkCost: park, truckCost: truck, hotelCost: hotel });

    const groups = [];
    sitesContainer.querySelectorAll('.site-entry').forEach(el => {
      groups.push({ sites: el.querySelector('[name="groupSites"]')?.value || '' });
    });
    const totalSiteCount = groups.reduce((sum, g) => sum + parseSiteNumbers(g.sites).length, 0);
    const perSite = totalSiteCount > 0 ? splitCostPerSite(total, totalSiteCount) : 0;

    document.getElementById('preview-total').textContent    = formatCurrency(total);
    document.getElementById('preview-per-site').textContent = totalSiteCount > 0
      ? `${formatCurrency(perSite)} × ${totalSiteCount} site(s)`
      : '—';
  }

  ['laborCost','parkCost','truckCost','hotelCost'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updateCostPreview);
  });

  function collectFormData() {
    const sites = [];
    sitesContainer.querySelectorAll('.site-entry').forEach(el => {
      const rawSites         = el.querySelector('[name="groupSites"]')?.value || '';
      const coordinatorEmail = el.querySelector('[name="coordinatorEmail"]')?.value || '';
      const originals        = JSON.parse(el.dataset.originals || '[]');

      parseSiteNumbers(rawSites).forEach(num => {
        const orig = originals.find(s => s.siteNumber === num);
        const site = { siteNumber: num, coordinatorEmail };
        if (orig) {
          if (orig.siteId)   site.siteId   = orig.siteId;
          if (orig.jobCode)  site.jobCode  = orig.jobCode;
          if (orig.jcStatus) site.jcStatus = orig.jcStatus;
        }
        sites.push(site);
      });
    });

    return {
      trip: {
        date:      document.getElementById('trip-date').value,
        whRep:     whRepSelect.value,
        driver:    document.getElementById('driver').value.trim(),
        route:     document.getElementById('route').value.trim(),
        laborCost: Number(document.getElementById('laborCost').value) || 0,
        parkCost:  Number(document.getElementById('parkCost').value)  || 0,
        truckCost: Number(document.getElementById('truckCost').value) || 0,
        hotelCost: Number(document.getElementById('hotelCost').value) || 0,
      },
      sites,
    };
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formErrorEl.classList.add('hidden');
    clearFormErrors(form);

    // Validate groups
    let hasGroupError = false;
    sitesContainer.querySelectorAll('.site-entry').forEach(el => {
      const sitesInput  = el.querySelector('[name="groupSites"]');
      const coordSelect = el.querySelector('[name="coordinatorEmail"]');
      const sitesErr    = el.querySelector('.sites-field-error');
      const coordErr    = el.querySelector('.coord-field-error');

      const nums = parseSiteNumbers(sitesInput?.value || '');
      if (nums.length === 0) {
        sitesInput?.classList.add('is-invalid');
        if (sitesErr) { sitesErr.textContent = 'Enter at least one site number.'; sitesErr.classList.remove('hidden'); }
        hasGroupError = true;
      } else {
        sitesInput?.classList.remove('is-invalid');
        if (sitesErr) sitesErr.classList.add('hidden');
      }

      if (!coordSelect?.value) {
        coordSelect?.classList.add('is-invalid');
        if (coordErr) { coordErr.textContent = 'Coordinator is required.'; coordErr.classList.remove('hidden'); }
        hasGroupError = true;
      } else {
        coordSelect?.classList.remove('is-invalid');
        if (coordErr) coordErr.classList.add('hidden');
      }
    });

    if (hasGroupError) {
      formErrorEl.textContent = 'Please fix the errors above.';
      formErrorEl.classList.remove('hidden');
      return;
    }

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
