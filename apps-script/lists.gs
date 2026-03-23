/**
 * lists.gs — Dynamic dropdown lists and coordinator lookups
 * ──────────────────────────────────────────────────────────
 * Lists sheet columns (in order):
 *   listName | value | label | sortOrder
 *
 * Example rows for WH Representatives:
 *   whRep | Ehab  | Ehab  | 1
 *   whRep | Karam | Karam | 2
 */

/**
 * Get all entries for a named list, sorted by sortOrder.
 * @param {{ listName: string }} data
 * @returns {{ success: boolean, data: Object[] }}
 */
function getList(data) {
  var listName = String(data.listName || '').toLowerCase().trim();
  if (!listName) return { success: false, error: 'listName is required.' };

  var rows = sheetToObjects(getSheet(TABS.LISTS));
  var filtered = rows.filter(function (r) {
    return String(r.listName || '').toLowerCase().trim() === listName;
  });
  filtered.sort(function (a, b) {
    return Number(a.sortOrder || 0) - Number(b.sortOrder || 0);
  });
  return { success: true, data: filtered };
}

/**
 * Get all project coordinators (name + email) from the Users tab.
 * Returns coordinatorName if set, otherwise falls back to name.
 * @returns {{ success: boolean, data: Array<{ email: string, name: string }> }}
 */
function getCoordinators() {
  var rows = sheetToObjects(getSheet(TABS.USERS));
  var coordinators = rows
    .filter(function (r) {
      var role = String(r.role || '').toLowerCase().trim();
      return role === 'project' || role === 'project coordinator' || role === 'project coord' || role === 'pc' || role === 'coordinator';
    })
    .map(function (r) {
      return {
        email: String(r.email || '').trim(),
        name:  String(r.coordinatorName || r.name || '').trim(),
      };
    })
    .filter(function (r) { return r.email; }); // drop rows with no email

  return { success: true, data: coordinators };
}
