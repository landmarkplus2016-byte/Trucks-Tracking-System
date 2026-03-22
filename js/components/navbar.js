/**
 * components/navbar.js
 * ────────────────────
 * Renders the top navbar into #navbar-placeholder.
 * Must be called after auth.service.js and constants are loaded.
 */

/**
 * Inject the navbar HTML and wire up logout.
 * @param {string} activePath - Current page path to highlight active link
 */
function renderNavbar(activePath) {
  const user = getCurrentUser();
  if (!user) return;

  const isFleet   = user.role === ROLES.FLEET;
  const isProject = user.role === ROLES.PROJECT;

  const fleetLinks = isFleet ? `
    <a href="${ROUTES.FLEET_DASHBOARD}"  class="${activePath === ROUTES.FLEET_DASHBOARD  ? 'active' : ''}">
      <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2H3V4zm0 4h14v8a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm5 3a1 1 0 000 2h4a1 1 0 000-2H8z"/></svg>
      <span>Dashboard</span>
    </a>
    <a href="${ROUTES.FLEET_NEW_TRIP}" class="${activePath === ROUTES.FLEET_NEW_TRIP ? 'active' : ''}">
      <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/></svg>
      <span>New Trip</span>
    </a>
    <a href="${ROUTES.FLEET_HISTORY}" class="${activePath === ROUTES.FLEET_HISTORY ? 'active' : ''}">
      <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/></svg>
      <span>History</span>
    </a>
  ` : '';

  const projectLinks = isProject ? `
    <a href="${ROUTES.PROJECT_DASHBOARD}" class="${activePath === ROUTES.PROJECT_DASHBOARD ? 'active' : ''}">
      <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2H3V4zm0 4h14v8a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm5 3a1 1 0 000 2h4a1 1 0 000-2H8z"/></svg>
      <span>Dashboard</span>
    </a>
    <a href="${ROUTES.PROJECT_PENDING_JC}" class="${activePath === ROUTES.PROJECT_PENDING_JC ? 'active' : ''}">
      <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
      <span>Pending JC</span>
    </a>
    <a href="${ROUTES.PROJECT_HISTORY}" class="${activePath === ROUTES.PROJECT_HISTORY ? 'active' : ''}">
      <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/></svg>
      <span>History</span>
    </a>
  ` : '';

  const html = `
    <nav class="navbar">
      <a class="navbar-brand" href="${isFleet ? ROUTES.FLEET_DASHBOARD : ROUTES.PROJECT_DASHBOARD}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="1" y="3" width="15" height="13" rx="1"/>
          <path d="M16 8h4l3 3v5h-7V8z"/>
          <circle cx="5.5" cy="18.5" r="2.5"/>
          <circle cx="18.5" cy="18.5" r="2.5"/>
        </svg>
        ${CONFIG.APP_NAME}
      </a>

      <div class="navbar-nav">
        ${fleetLinks}${projectLinks}
      </div>

      <div class="navbar-actions">
        <div id="notif-bell-container"></div>

        <div class="navbar-user">
          <div>
            <div class="navbar-user-name">${escapeHtml(user.name)}</div>
            <div class="navbar-user-role">${user.role === ROLES.FLEET ? 'Fleet Coordinator' : 'Project Coordinator'}</div>
          </div>
        </div>

        <button class="navbar-logout" onclick="logout()" title="Sign out">
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
            <path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clip-rule="evenodd"/>
          </svg>
          <span>Sign out</span>
        </button>
      </div>
    </nav>
  `;

  const placeholder = document.getElementById('navbar-placeholder');
  if (placeholder) placeholder.innerHTML = html;
}

/** Safely escape HTML to prevent XSS */
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
