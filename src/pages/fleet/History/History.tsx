import React, { useState } from 'react';
import styles from './History.module.css';
import { Card } from '../../../components/common/Card';
import { SiteList } from '../../../components/fleet/SiteList';
import { CostSummary } from '../../../components/fleet/CostSummary';
import { useTrips, useSitesByTrip } from '../../../hooks/useTrips';
import { useAuth } from '../../../hooks/useAuth';
import { formatDate } from '../../../utils/date-formatter';
import { buildCostBreakdown } from '../../../utils/cost-calculator';
import { TRIP_STATUS } from '../../../constants';

export function FleetHistory() {
  const { user } = useAuth();
  const { trips, loading, error } = useTrips(user?.email);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function toggleExpand(tripId: string) {
    setExpandedId(prev => (prev === tripId ? null : tripId));
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Trip History</h1>

      {error ? <div className={styles.error}>{error}</div> : null}

      {loading ? (
        <p className={styles.loading}>Loading history…</p>
      ) : trips.length === 0 ? (
        <p className={styles.empty}>No trips recorded yet.</p>
      ) : (
        <div className={styles.list}>
          {trips.map(trip => (
            <TripHistoryRow
              key={trip.tripId}
              trip={trip}
              expanded={expandedId === trip.tripId}
              onToggle={() => toggleExpand(trip.tripId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Trip row with expandable detail ──────────────────────────────────────────

interface TripHistoryRowProps {
  trip: import('../../../types').Trip;
  expanded: boolean;
  onToggle: () => void;
}

function TripHistoryRow({ trip, expanded, onToggle }: TripHistoryRowProps) {
  const { sites, loading } = useSitesByTrip(expanded ? trip.tripId : '');

  const breakdown = sites.length > 0
    ? buildCostBreakdown(trip.tripId, sites, trip.laborCost, trip.parkCost, trip.truckCost, trip.hotelCost)
    : null;

  return (
    <Card noPadding>
      <button className={styles.rowHeader} onClick={onToggle} aria-expanded={expanded}>
        <div className={styles.rowMeta}>
          <span className={styles.rowDate}>{formatDate(trip.date)}</span>
          <span className={styles.rowRoute}>{trip.route}</span>
          <span className={styles.rowDriver}>Driver: {trip.driver}</span>
        </div>
        <div className={styles.rowRight}>
          <span className={styles.rowCost}>${trip.totalCost.toFixed(2)}</span>
          <span className={`${styles.badge} ${styles[`badge_${trip.status.toLowerCase()}`]}`}>
            {trip.status.replace('_', ' ')}
          </span>
          <span className={styles.chevron}>{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded ? (
        <div className={styles.detail}>
          {loading ? (
            <p className={styles.loading}>Loading details…</p>
          ) : (
            <>
              <div className={styles.costInfo}>
                <div className={styles.costRow}>
                  <span>Labor</span><span>${trip.laborCost.toFixed(2)}</span>
                </div>
                <div className={styles.costRow}>
                  <span>Parking</span><span>${trip.parkCost.toFixed(2)}</span>
                </div>
                <div className={styles.costRow}>
                  <span>Truck</span><span>${trip.truckCost.toFixed(2)}</span>
                </div>
                <div className={styles.costRow}>
                  <span>Hotel</span><span>${trip.hotelCost.toFixed(2)}</span>
                </div>
              </div>
              {breakdown ? <CostSummary breakdown={breakdown} /> : null}
              <SiteList sites={sites} />
            </>
          )}
        </div>
      ) : null}
    </Card>
  );
}
