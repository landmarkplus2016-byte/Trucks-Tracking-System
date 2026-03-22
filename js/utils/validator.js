/**
 * utils/validator.js
 * ──────────────────
 * Form validation helpers.
 * Each function returns { valid: boolean, message: string }.
 */

/**
 * Assert a field is not empty.
 * @param {string} value
 * @param {string} fieldName
 * @returns {{ valid: boolean, message: string }}
 */
function requireField(value, fieldName) {
  const trimmed = String(value ?? '').trim();
  return trimmed.length > 0
    ? { valid: true, message: '' }
    : { valid: false, message: `${fieldName} is required.` };
}

/**
 * Assert a value is a non-negative number.
 * @param {*}      value
 * @param {string} fieldName
 * @returns {{ valid: boolean, message: string }}
 */
function requireNonNegativeNumber(value, fieldName) {
  const n = Number(value);
  if (isNaN(n))  return { valid: false, message: `${fieldName} must be a number.` };
  if (n < 0)     return { valid: false, message: `${fieldName} cannot be negative.` };
  return { valid: true, message: '' };
}

/**
 * Assert a string is a valid email address.
 * @param {string} value
 * @returns {{ valid: boolean, message: string }}
 */
function requireEmail(value) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(value ?? '').trim())
    ? { valid: true,  message: '' }
    : { valid: false, message: 'Please enter a valid email address.' };
}

/**
 * Validate an entire trip form object.
 * Returns an object mapping field names to error strings.
 * An empty object means no errors.
 *
 * @param {{ date, whRep, driver, route, laborCost, parkCost, truckCost, hotelCost, sites }} form
 * @returns {Object.<string, string>}
 */
function validateTripForm(form) {
  const errors = {};

  const checks = [
    ['date',      requireField(form.date,      'Date')],
    ['whRep',     requireField(form.whRep,     'WH Representative')],
    ['driver',    requireField(form.driver,    'Driver')],
    ['route',     requireField(form.route,     'Route')],
    ['laborCost', requireNonNegativeNumber(form.laborCost, 'Labor Cost')],
    ['parkCost',  requireNonNegativeNumber(form.parkCost,  'Park Cost')],
    ['truckCost', requireNonNegativeNumber(form.truckCost, 'Truck Cost')],
    ['hotelCost', requireNonNegativeNumber(form.hotelCost, 'Hotel Cost')],
  ];

  checks.forEach(([field, result]) => {
    if (!result.valid) errors[field] = result.message;
  });

  // Validate sites
  if (!form.sites || form.sites.length === 0) {
    errors['sites'] = 'At least one site is required.';
  } else {
    form.sites.forEach((site, i) => {
      if (!String(site.siteNumber ?? '').trim()) {
        errors[`site_${i}_siteNumber`] = `Site ${i + 1}: site number is required.`;
      }
      if (!String(site.coordinatorEmail ?? '').trim()) {
        errors[`site_${i}_email`] = `Site ${i + 1}: coordinator email is required.`;
      } else {
        const emailCheck = requireEmail(site.coordinatorEmail);
        if (!emailCheck.valid) {
          errors[`site_${i}_email`] = `Site ${i + 1}: ${emailCheck.message}`;
        }
      }
    });
  }

  return errors;
}

/**
 * Show validation errors on form fields.
 * Expects elements with data-field="fieldName" and
 * sibling .form-error elements with data-error="fieldName".
 *
 * @param {HTMLElement} formEl
 * @param {Object.<string, string>} errors
 */
function displayFormErrors(formEl, errors) {
  // Clear previous errors
  formEl.querySelectorAll('.form-control').forEach(el => el.classList.remove('is-invalid'));
  formEl.querySelectorAll('.form-error').forEach(el => { el.textContent = ''; el.classList.add('hidden'); });

  Object.entries(errors).forEach(([field, msg]) => {
    const input = formEl.querySelector(`[data-field="${field}"]`);
    const errEl = formEl.querySelector(`[data-error="${field}"]`);
    if (input) input.classList.add('is-invalid');
    if (errEl) { errEl.textContent = msg; errEl.classList.remove('hidden'); }
  });
}

/**
 * Clear all validation state from a form.
 * @param {HTMLElement} formEl
 */
function clearFormErrors(formEl) {
  formEl.querySelectorAll('.form-control').forEach(el => el.classList.remove('is-invalid'));
  formEl.querySelectorAll('.form-error').forEach(el => { el.textContent = ''; el.classList.add('hidden'); });
}
