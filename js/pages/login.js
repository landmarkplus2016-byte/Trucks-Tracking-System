/**
 * pages/login.js
 * ──────────────
 * Login form logic — validates, calls auth.service, redirects by role.
 */

(function () {
  // If already logged in, redirect to appropriate dashboard
  const existingUser = getCurrentUser();
  if (existingUser) {
    window.location.href = existingUser.role === ROLES.FLEET
      ? 'pages/fleet/dashboard.html'
      : 'pages/project/dashboard.html';
    return;
  }

  const form      = document.getElementById('login-form');
  const emailEl   = document.getElementById('login-email');
  const passwordEl= document.getElementById('login-password');
  const submitBtn = document.getElementById('login-submit');
  const errorEl   = document.getElementById('login-error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.classList.add('hidden');
    errorEl.textContent = '';

    const email    = emailEl.value.trim();
    const password = passwordEl.value;

    if (!email || !password) {
      errorEl.textContent = 'Please enter your email and password.';
      errorEl.classList.remove('hidden');
      return;
    }

    // Loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Signing in…';

    try {
      const result = await login(email, password);

      if (result.success && result.data) {
        const user = result.data;
        const dest = user.role === ROLES.FLEET
          ? 'pages/fleet/dashboard.html'
          : 'pages/project/dashboard.html';
        window.location.href = dest;
      } else {
        throw new Error(result.error || 'Invalid email or password.');
      }
    } catch (err) {
      errorEl.textContent = err.message || 'Sign in failed. Please try again.';
      errorEl.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Sign In';
    }
  });
})();
