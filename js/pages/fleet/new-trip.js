/**
 * pages/fleet/new-trip.js
 * ───────────────────────
 * Create a new trip with group-based site entries.
 * Each group = one coordinator + multiple site numbers (separated by / or -).
 * WH Rep and coordinator dropdowns are loaded from the API on page load.
 */

(async function () {
  const form           = document.getElementById('trip-form');
  const submitBtn      = document.getElementById('submit-btn');
  const errorEl        = document.getElementById('form-error');
  const sitesContainer = document.getElementById('sites-container');
  const whRepSelect    = document.getElementById('whRep');

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
    populateWhRep(FALLBACK_WH_REPS);
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

  let groupCount = 0;

  // Load WH reps and coordinators in parallel
  try {
    const [whRepsResult] = await Promise.all([
      fetchAPI(ACTIONS.GET_LIST, { listName: 'whRep' }),
    ]);
    clearTimeout(loadingTimeout);

    const whReps = (whRepsResult.success && whRepsResult.data && whRepsResult.data.length)
      ? whRepsResult.data
      : FALLBACK_WH_REPS;

    populateWhRep(whReps);
  } catch (err) {
    clearTimeout(loadingTimeout);
    populateWhRep(FALLBACK_WH_REPS);
  }

  submitBtn.disabled = false;

  // Add first group after dropdowns are ready
  addGroupEntry();

  document.getElementById('add-site-btn').addEventListener('click', () => addGroupEntry());

  function populateWhRep(options) {
    whRepSelect.innerHTML =
      '<option value="">Select WH Rep…</option>' +
      options.map(o => `<option value="${escapeHtml(String(o.value || o.label))}">${escapeHtml(String(o.label || o.value))}</option>`).join('');
    whRepSelect.disabled = false;
  }

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

  function addGroupEntry(group = null) {
    groupCount++;
    const idx = groupCount;
    const div = document.createElement('div');
    div.className = 'site-entry';
    div.dataset.groupIndex = idx;

    div.innerHTML = `
      <div class="site-entry-header">
        <span class="site-entry-label">Group ${idx}</span>
        ${idx > 1 ? `<button type="button" class="btn btn-sm btn-danger" onclick="removeGroupEntry(this)">Remove</button>` : ''}
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
    const entry = btn.closest('.site-entry');
    if (entry) {
      entry.remove();
      updateGroupLabels();
      updateCostPreview();
    }
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

    document.getElementById('preview-labor').textContent    = formatCurrency(labor);
    document.getElementById('preview-park').textContent     = formatCurrency(park);
    document.getElementById('preview-truck').textContent    = formatCurrency(truck);
    document.getElementById('preview-hotel').textContent    = formatCurrency(hotel);
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
      const rawSites        = el.querySelector('[name="groupSites"]')?.value || '';
      const coordinatorEmail = el.querySelector('[name="coordinatorEmail"]')?.value || '';
      parseSiteNumbers(rawSites).forEach(num => {
        sites.push({ siteNumber: num, coordinatorEmail });
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
        createdBy: user.email,
      },
      sites,
    };
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.classList.add('hidden');
    clearFormErrors(form);

    // Validate groups
    let hasGroupError = false;
    sitesContainer.querySelectorAll('.site-entry').forEach(el => {
      const sitesInput = el.querySelector('[name="groupSites"]');
      const coordSelect = el.querySelector('[name="coordinatorEmail"]');
      const sitesErr   = el.querySelector('.sites-field-error');
      const coordErr   = el.querySelector('.coord-field-error');

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
      showError('Please fix the errors above.');
      return;
    }

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
