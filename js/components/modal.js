/**
 * components/modal.js
 * ───────────────────
 * Reusable confirm and alert modals (promise-based).
 * Injects its own overlay into document.body — no placeholder needed.
 */

/**
 * Show a confirmation dialog.
 * @param {{ title?: string, message: string, confirmText?: string, cancelText?: string, danger?: boolean }} opts
 * @returns {Promise<boolean>} Resolves true if confirmed, false if cancelled
 */
function showConfirm(opts = {}) {
  return new Promise(resolve => {
    const {
      title       = 'Confirm',
      message     = 'Are you sure?',
      confirmText = 'Confirm',
      cancelText  = 'Cancel',
      danger      = false,
    } = opts;

    const overlayId = 'modal-overlay-' + Date.now();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = overlayId;
    overlay.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="${overlayId}-title">
        <div class="modal-header">
          <h2 class="modal-title" id="${overlayId}-title">${escapeHtml(title)}</h2>
          <button class="modal-close" aria-label="Close" data-action="cancel">
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">${escapeHtml(message)}</div>
        <div class="modal-footer">
          <button class="btn btn-secondary" data-action="cancel">${escapeHtml(cancelText)}</button>
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-action="confirm">${escapeHtml(confirmText)}</button>
        </div>
      </div>
    `;

    function cleanup(result) {
      overlay.remove();
      resolve(result);
    }

    overlay.addEventListener('click', e => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (action === 'confirm') cleanup(true);
      if (action === 'cancel')  cleanup(false);
      if (e.target === overlay) cleanup(false); // click outside
    });

    document.body.appendChild(overlay);
    // Focus confirm button
    overlay.querySelector('[data-action="confirm"]')?.focus();
  });
}

/**
 * Show an alert dialog (informational, one button).
 * @param {{ title?: string, message: string, buttonText?: string }} opts
 * @returns {Promise<void>}
 */
function showAlert(opts = {}) {
  return new Promise(resolve => {
    const {
      title      = 'Notice',
      message    = '',
      buttonText = 'OK',
    } = opts;

    const overlayId = 'modal-overlay-' + Date.now();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = overlayId;
    overlay.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="${overlayId}-title">
        <div class="modal-header">
          <h2 class="modal-title" id="${overlayId}-title">${escapeHtml(title)}</h2>
          <button class="modal-close" aria-label="Close" data-action="ok">
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">${escapeHtml(message)}</div>
        <div class="modal-footer">
          <button class="btn btn-primary" data-action="ok">${escapeHtml(buttonText)}</button>
        </div>
      </div>
    `;

    overlay.addEventListener('click', e => {
      if (e.target.closest('[data-action="ok"]') || e.target === overlay) {
        overlay.remove();
        resolve();
      }
    });

    document.body.appendChild(overlay);
    overlay.querySelector('[data-action="ok"]')?.focus();
  });
}
