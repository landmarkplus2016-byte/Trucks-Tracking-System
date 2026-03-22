/**
 * components/cost-summary.js
 * ──────────────────────────
 * Renders a cost breakdown table into a target element.
 */

/**
 * Render a cost breakdown table.
 * @param {HTMLElement} containerEl - Element to render into
 * @param {import('../types/schemas.js').CostBreakdown} breakdown
 */
function renderCostSummary(containerEl, breakdown) {
  if (!containerEl || !breakdown) return;

  const coordRows = breakdown.byCoordinator.map(c => `
    <tr>
      <td>${escapeHtml(c.coordinatorEmail)}</td>
      <td class="num">${c.siteCount}</td>
      <td class="num">${formatCurrency(c.totalCost)}</td>
    </tr>
  `).join('');

  containerEl.innerHTML = `
    <div class="table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th>Cost Component</th>
            <th class="num">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Labor Cost</td>   <td class="num">${formatCurrency(breakdown.laborCost  ?? 0)}</td></tr>
          <tr><td>Parking Cost</td> <td class="num">${formatCurrency(breakdown.parkCost   ?? 0)}</td></tr>
          <tr><td>Truck Cost</td>   <td class="num">${formatCurrency(breakdown.truckCost  ?? 0)}</td></tr>
          <tr><td>Hotel Cost</td>   <td class="num">${formatCurrency(breakdown.hotelCost  ?? 0)}</td></tr>
        </tbody>
        <tfoot>
          <tr><td>Total Trip Cost</td><td class="num">${formatCurrency(breakdown.totalCost)}</td></tr>
        </tfoot>
      </table>
    </div>

    <div class="mt-6">
      <div class="section-title">Cost per Site</div>
      <p class="text-sm text-secondary mb-4">
        ${formatCurrency(breakdown.totalCost)} ÷ ${breakdown.siteCount} sites
        = <strong>${formatCurrency(breakdown.costPerSite)}</strong> per site
      </p>

      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Coordinator</th>
              <th class="num">Sites</th>
              <th class="num">Total Cost</th>
            </tr>
          </thead>
          <tbody>${coordRows}</tbody>
        </table>
      </div>
    </div>
  `;
}
