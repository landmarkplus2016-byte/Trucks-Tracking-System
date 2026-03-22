import React from 'react';
import styles from './History.module.css';
import { Card } from '../../../components/common/Card';
import { SiteCostBreakdown } from '../../../components/project/SiteCostBreakdown';
import { useSitesByCoordinator } from '../../../hooks/useTrips';
import { useTrips } from '../../../hooks/useTrips';
import { useAuth } from '../../../hooks/useAuth';

export function ProjectHistory() {
  const { user } = useAuth();
  const { sites, loading: sitesLoading, updateJobCode } = useSitesByCoordinator(user?.email ?? '');
  const { trips, loading: tripsLoading } = useTrips();

  const tripMap = new Map(trips.map(t => [t.tripId, t]));

  // Group all sites by tripId
  const sitesByTrip = new Map<string, typeof sites>();
  for (const site of sites) {
    if (!sitesByTrip.has(site.tripId)) sitesByTrip.set(site.tripId, []);
    sitesByTrip.get(site.tripId)!.push(site);
  }

  const loading = sitesLoading || tripsLoading;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>My Trip History</h1>

      {loading ? (
        <p className={styles.loading}>Loading history…</p>
      ) : sitesByTrip.size === 0 ? (
        <p className={styles.empty}>No trips in your history yet.</p>
      ) : (
        <div className={styles.list}>
          {Array.from(sitesByTrip.entries()).map(([tripId, tripSites]) => {
            const trip = tripMap.get(tripId);
            if (!trip) return null;
            return (
              <Card key={tripId} title={`Trip — ${trip.date} | ${trip.route}`}>
                <SiteCostBreakdown
                  trip={trip}
                  sites={tripSites}
                  onSaveJobCode={updateJobCode}
                  showJCEntry
                />
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
