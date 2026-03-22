/**
 * pages/fleet/new-trip.js
 * ───────────────────────
 * Create a new trip with dynamic site entries.
 */

(function () {
  const user = requireRole(ROLES.FLEET);
  renderNavbar(ROUTES.FLEET_NEW_TRIP);
  initNotificationBell();

  let siteCount = 0;
  const sitesContainer = document.getElementById('sites-container');
  const form           = document.getElementById('trip-form');
  const submitBtn      = document.getElementById('submit-btn');
  const errorEl        = document.getElementById('form-error');

  // Set default date to today
  document.getElementById('trip-date').value = todayForInput();

  // Add first site automatically
  addSiteEntry();

  document.getElementById('add-site-btn').addEventListener('click', addSiteEntry);

  /** Append a new site entry row */
  function addSiteEntry() {
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
          <label class="form-label">Coordinator Email <span class="required">*</span></label>
          <input type="email" class="form-control" name="coordinatorEmail" data-field="site_${idx-1}_email" placeholder="coordinator@example.com" required />
          <span class="form-error hidden" data-error="site_${idx-1}_email"></span>
        </div>
      </div>
    `;
    sitesContainer.appendChild(div);
    updateCostPreview();
  }

  /** Remove a site entry row */
  window.removeSiteEntry = function (btn) {
    const entry = btn.closest('.site-entry');
    if (entry) {
      entry.remove();
      updateSiteLabels();
      updateCostPreview();
    }
  };

  /** Re-number site labels after removal */
  function updateSiteLabels() {
    sitesContainer.querySelectorAll('.site-entry').forEach((el, i) => {
      const label = el.querySelector('.site-entry-label');
      if (label) label.textContent = `Site ${i + 1}`;
    });
  }

  /** Live cost preview */
  function updateCostPreview() {
    const labor = Number(document.getElementById('labor-cost').value) || 0;
    const park  = Number(document.getElementById('park-cost').value)  || 0;
    const truck = Number(document.getElementById('truck-cost').value) || 0;
    const hotel = Number(document.getElementById('hotel-cost').value) || 0;
    const siteEntries = sitesContainer.querySelectorAll('.site-entry');

    const total       = sumTripCosts({ laborCost: labor, parkCost: park, truckCost: truck, hotelCost: hotel });
    const perSite     = splitCostPerSite(total, siteEntries.length);

    document.getElementById('preview-labor').textContent = formatCurrency(labor);
    document.getElementById('preview-park').textContent  = formatCurrency(park);
    document.getElementById('preview-truck').textContent = formatCurrency(truck);
    document.getElementById('preview-hotel').textContent = formatCurrency(hotel);
    document.getElementById('preview-total').textContent = formatCurrency(total);
    document.getElementById('preview-per-site').textContent = `${formatCurrency(perSite)} × ${siteEntries.length} site(s)`;
  }

  ['labor-cost','park-cost','truck-cost','hotel-cost'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updateCostPreview);
  });

  /** Collect form data */
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
        whRep:     document.getElementById('wh-rep').value.trim(),
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
      errorEl.textContent = 'Please fix the errors above.';
      errorEl.classList.remove('hidden');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Submitting…';

    try {
      await createTrip(payload);
      window.location.href = ROUTES.FLEET_DASHBOARD;
    } catch (err) {
      errorEl.textContent = err.message || 'Failed to create trip. Please try again.';
      errorEl.classList.remove('hidden');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Submit Trip';
    }
  });
})();
