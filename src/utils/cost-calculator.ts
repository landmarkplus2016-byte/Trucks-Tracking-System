import type { Site, CostBreakdown, CoordinatorBreakdown } from '../types';

/**
 * Calculates how much each site in a trip costs.
 * Total trip cost is split equally across all sites.
 *
 * @param totalCost  - sum of labor + park + truck + hotel costs
 * @param totalSites - number of sites in the trip
 * @returns cost per site (rounded to 2 decimal places)
 */
export function splitCostPerSite(totalCost: number, totalSites: number): number {
  if (totalSites === 0) return 0;
  return Math.round((totalCost / totalSites) * 100) / 100;
}

/**
 * Calculates the total cost charged to a single coordinator,
 * based on how many sites belong to them.
 *
 * @param costPerSite      - pre-calculated cost per site
 * @param coordinatorSites - number of sites belonging to this coordinator
 * @returns coordinator's total cost (rounded to 2 decimal places)
 */
export function getCoordinatorTotal(costPerSite: number, coordinatorSites: number): number {
  return Math.round(costPerSite * coordinatorSites * 100) / 100;
}

/**
 * Builds a full CostBreakdown for a trip, grouping sites by coordinator.
 *
 * @param tripId    - the trip's unique identifier
 * @param sites     - array of Site records belonging to this trip
 * @param laborCost - trip labor cost
 * @param parkCost  - trip parking cost
 * @param truckCost - trip truck cost
 * @param hotelCost - trip hotel cost
 * @returns CostBreakdown object with per-coordinator details
 */
export function buildCostBreakdown(
  tripId: string,
  sites: Site[],
  laborCost: number,
  parkCost: number,
  truckCost: number,
  hotelCost: number,
): CostBreakdown {
  const totalCost = laborCost + parkCost + truckCost + hotelCost;
  const totalSites = sites.length;
  const costPerSite = splitCostPerSite(totalCost, totalSites);

  // Group sites by coordinator email
  const byCoordinator = new Map<string, Site[]>();
  for (const site of sites) {
    const key = site.coordinatorEmail;
    if (!byCoordinator.has(key)) {
      byCoordinator.set(key, []);
    }
    byCoordinator.get(key)!.push(site);
  }

  const coordinatorBreakdowns: CoordinatorBreakdown[] = [];
  byCoordinator.forEach((coordinatorSites, email) => {
    coordinatorBreakdowns.push({
      coordinatorEmail: email,
      siteCount: coordinatorSites.length,
      totalCost: getCoordinatorTotal(costPerSite, coordinatorSites.length),
      sites: coordinatorSites,
    });
  });

  return {
    tripId,
    totalCost,
    totalSites,
    costPerSite,
    coordinatorBreakdowns,
  };
}
