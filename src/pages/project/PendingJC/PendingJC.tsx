import React from 'react';
import styles from './PendingJC.module.css';
import { Card } from '../../../components/common/Card';
import { SiteCostBreakdown } from '../../../components/project/SiteCostBreakdown';
import { useSitesByCoordinator } from '../../../hooks/useTrips';
import { useTrips } from '../../../hooks/useTrips';
import { useAuth } from '../../../hooks/useAuth';
import { JC_STATUS } from '../../../constants';

export function PendingJC() {
  const { user } = useAuth();
  const { sites, loading, updateJobCode } = useSitesByCoordinator(user?.email ?? '');
  const { trips } = useTrips();

  const pendingSites = sites.filter(s => s.jcStatus === JC_STATUS.PENDING);

  // Group pending sites by tripId
  const sitesByTrip = new Map<string, typeof pendingSites>();
  for (const site of pendingSites) {
    if (!sitesByTrip.has(site.tripId)) sitesByTrip.set(site.tripId, []);
    sitesByTrip.get(site.tripId)!.push(site);
  }

  const tripMap = new Map(trips.map(t => [t.tripId, t]));

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Pending Job Codes</h1>

      {loading ? (
        <p className={styles.loading}>Loading pending sites…</p>
      ) : pendingSites.length === 0 ? (
        <div className={styles.allDone}>
          <span className={styles.doneIcon} aria-hidden="true">✓</span>
          <p>All caught up! No pending Job Codes.</p>
        </div>
      ) : (
        <div className={styles.tripList}>
          {Array.from(sitesByTrip.entries()).map(([tripId, tripSites]) => {
            const trip = tripMap.get(tripId);
            if (!trip) return null;
            return (
              <Card key={tripId} title={`Trip — ${trip.date}`}>
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
