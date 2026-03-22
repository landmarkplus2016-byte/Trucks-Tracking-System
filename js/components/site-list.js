/**
 * components/site-list.js
 * ───────────────────────
 * Renders a list of sites with inline JC input fields
 * (used on the project coordinator's Pending JC page).
 */

/**
 * Render sites with JC input fields.
 * @param {HTMLElement}                            containerEl
 * @param {import('../types/schemas.js').Site[]}   sites        - Sites belonging to the current coordinator
 * @param {function(string, string): void}         onSave       - Callback(siteId, jobCode)
 */
function renderSiteList(containerEl, sites, onSave) {
  if (!containerEl) return;

  if (!sites || sites.length === 0) {
    containerEl.innerHTML = '<p class="text-sm text-muted">No sites found for this trip.</p>';
    return;
  }

  containerEl.innerHTML = `
    <div class="table-wrapper my-sites-table">
      <table class="table">
        <thead>
          <tr>
            <th>Site #</th>
            <th class="num">Cost Share</th>
            <th>Job Code (JC)</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${sites.map(site => `
            <tr data-site-id="${escapeHtml(site.siteId)}">
              <td>${escapeHtml(site.siteNumber)}</td>
              <td class="num">${formatCurrency(site.costShare)}</td>
              <td>
                <div class="jc-input-row">
                  <input
                    type="text"
                    class="form-control"
                    data-field="jc-${escapeHtml(site.siteId)}"
                    value="${escapeHtml(site.jobCode || '')}"
                    placeholder="Enter JC number"
                    maxlength="50"
                  />
                </div>
              </td>
              <td>
                <span class="status-pill ${site.jcStatus === JC_STATUS.ENTERED ? 'complete' : 'pending'}">
                  ${site.jcStatus === JC_STATUS.ENTERED ? 'Entered' : 'Pending'}
                </span>
              </td>
              <td>
                <button
                  class="btn btn-sm btn-primary"
                  onclick="handleSaveJC(this, '${escapeHtml(site.siteId)}')"
                >
                  Save
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  // Expose callback for button onclick handlers in this component
  window._siteListOnSave = onSave;
}

/**
 * Called by the Save button in renderSiteList rows.
 * @param {HTMLButtonElement} btn
 * @param {string} siteId
 */
async function handleSaveJC(btn, siteId) {
  const row   = btn.closest('tr[data-site-id]');
  const input = row?.querySelector(`[data-field="jc-${siteId}"]`);
  if (!input) return;

  const jobCode = input.value.trim();
  if (!jobCode) {
    input.classList.add('is-invalid');
    input.focus();
    return;
  }
  input.classList.remove('is-invalid');

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';

  try {
    if (typeof window._siteListOnSave === 'function') {
      await window._siteListOnSave(siteId, jobCode);
    }
    // Update status pill
    const pill = row.querySelector('.status-pill');
    if (pill) {
      pill.textContent = 'Entered';
      pill.className = 'status-pill complete';
    }
    btn.textContent = 'Saved';
    btn.classList.replace('btn-primary', 'btn-success');
  } catch (err) {
    btn.disabled = false;
    btn.textContent = 'Save';
    await showAlert({ title: 'Error', message: err.message || 'Could not save job code.' });
  }
}
