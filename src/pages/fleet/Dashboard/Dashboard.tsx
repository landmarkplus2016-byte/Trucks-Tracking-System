import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Dashboard.module.css';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { useTrips } from '../../../hooks/useTrips';
import { useAuth } from '../../../hooks/useAuth';
import { ROUTES, TRIP_STATUS } from '../../../constants';
import { formatDate } from '../../../utils/date-formatter';

export function FleetDashboard() {
  const { user } = useAuth();
  const { trips, loading, error, deleteTrip } = useTrips(user?.email);

  const pendingTrips = trips.filter(t => t.status === TRIP_STATUS.PENDING_JC);
  const completedTrips = trips.filter(t => t.status === TRIP_STATUS.COMPLETE);

  async function handleDelete(tripId: string) {
    if (!window.confirm('Delete this trip? This cannot be undone.')) return;
    await deleteTrip(tripId);
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Fleet Dashboard</h1>
          <p className={styles.subtitle}>Welcome, {user?.name}</p>
        </div>
        <Button as={Link} to={ROUTES.FLEET_NEW_TRIP} variant="primary">
          + New Trip
        </Button>
      </div>

      {error ? <div className={styles.error}>{error}</div> : null}

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statNum}>{trips.length}</span>
          <span className={styles.statLabel}>Total Trips</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNum}>{pendingTrips.length}</span>
          <span className={styles.statLabel}>Pending JC</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNum}>{completedTrips.length}</span>
          <span className={styles.statLabel}>Completed</span>
        </div>
      </div>

      <Card title="Recent Trips" noPadding>
        {loading ? (
          <p className={styles.loadingText}>Loading trips…</p>
        ) : trips.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No trips yet.</p>
            <Link to={ROUTES.FLEET_NEW_TRIP}>Create your first trip →</Link>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Date</th>
                <th className={styles.th}>Route</th>
                <th className={styles.th}>Driver</th>
                <th className={styles.th}>Total Cost</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {trips.map(trip => (
                <tr key={trip.tripId} className={styles.tr}>
                  <td className={styles.td}>{formatDate(trip.date)}</td>
                  <td className={styles.td}>{trip.route}</td>
                  <td className={styles.td}>{trip.driver}</td>
                  <td className={styles.td}>${trip.totalCost.toFixed(2)}</td>
                  <td className={styles.td}>
                    <span className={`${styles.badge} ${styles[`badge_${trip.status.toLowerCase()}`]}`}>
                      {trip.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <div className={styles.actions}>
                      <Link to={`${ROUTES.FLEET_HISTORY}/${trip.tripId}`} className={styles.actionLink}>
                        View
                      </Link>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(trip.tripId)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
