import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Dashboard.module.css';
import { Card } from '../../../components/common/Card';
import { useAuth } from '../../../hooks/useAuth';
import { useSitesByCoordinator } from '../../../hooks/useTrips';
import { useTrips } from '../../../hooks/useTrips';
import { ROUTES, JC_STATUS } from '../../../constants';
import { formatDate } from '../../../utils/date-formatter';

export function ProjectDashboard() {
  const { user } = useAuth();
  const { sites, loading: sitesLoading } = useSitesByCoordinator(user?.email ?? '');
  const { trips, loading: tripsLoading } = useTrips();

  const pendingSites = sites.filter(s => s.jcStatus === JC_STATUS.PENDING);
  const enteredSites = sites.filter(s => s.jcStatus === JC_STATUS.ENTERED);

  // Build a map of tripId → trip for quick lookup
  const tripMap = new Map(trips.map(t => [t.tripId, t]));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Dashboard</h1>
        <p className={styles.subtitle}>Welcome, {user?.name}</p>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statNum}>{sites.length}</span>
          <span className={styles.statLabel}>Total Sites</span>
        </div>
        <div className={`${styles.statCard} ${pendingSites.length > 0 ? styles.statCardAlert : ''}`}>
          <span className={styles.statNum}>{pendingSites.length}</span>
          <span className={styles.statLabel}>Pending JC</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNum}>{enteredSites.length}</span>
          <span className={styles.statLabel}>JC Entered</span>
        </div>
      </div>

      {pendingSites.length > 0 ? (
        <Card title="Action Required — Pending Job Codes" noPadding>
          <div className={styles.alertBanner}>
            You have {pendingSites.length} site{pendingSites.length !== 1 ? 's' : ''} waiting for a Job Code.{' '}
            <Link to={ROUTES.PROJECT_PENDING_JC} className={styles.alertLink}>
              Enter Job Codes →
            </Link>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Site #</th>
                <th className={styles.th}>Trip Date</th>
                <th className={styles.th}>Route</th>
                <th className={styles.th}>Cost Share</th>
              </tr>
            </thead>
            <tbody>
              {pendingSites.slice(0, 5).map(site => {
                const trip = tripMap.get(site.tripId);
                return (
                  <tr key={site.siteId} className={styles.tr}>
                    <td className={styles.td}>{site.siteNumber}</td>
                    <td className={styles.td}>{trip ? formatDate(trip.date) : '—'}</td>
                    <td className={styles.td}>{trip?.route ?? '—'}</td>
                    <td className={styles.td}>${site.costShare.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {pendingSites.length > 5 ? (
            <p className={styles.moreLink}>
              <Link to={ROUTES.PROJECT_PENDING_JC}>See all {pendingSites.length} pending sites →</Link>
            </p>
          ) : null}
        </Card>
      ) : null}

      <Card title="Recent Activity">
        {sitesLoading || tripsLoading ? (
          <p className={styles.loading}>Loading…</p>
        ) : sites.length === 0 ? (
          <p className={styles.empty}>No trips assigned to you yet.</p>
        ) : (
          <p className={styles.activitySummary}>
            Your most recent trip was on{' '}
            <strong>
              {(() => {
                const latestTripId = sites[0]?.tripId;
                const t = latestTripId ? tripMap.get(latestTripId) : undefined;
                return t ? formatDate(t.date) : '—';
              })()}
            </strong>
            .{' '}
            <Link to={ROUTES.PROJECT_HISTORY}>View full history →</Link>
          </p>
        )}
      </Card>
    </div>
  );
}
