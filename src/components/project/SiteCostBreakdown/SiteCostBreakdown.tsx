import React from 'react';
import styles from './SiteCostBreakdown.module.css';
import type { Site, Trip } from '../../../types';
import { formatDate } from '../../../utils/date-formatter';
import { JCEntry } from '../JCEntry';

interface SiteCostBreakdownProps {
  trip: Trip;
  sites: Site[];                         // only the coordinator's sites for this trip
  onSaveJobCode: (siteId: string, jobCode: string) => Promise<void>;
  showJCEntry?: boolean;
}

export function SiteCostBreakdown({
  trip,
  sites,
  onSaveJobCode,
  showJCEntry = false,
}: SiteCostBreakdownProps) {
  const myTotal = sites.reduce((sum, s) => sum + s.costShare, 0);

  return (
    <div className={styles.wrapper}>
      <div className={styles.tripMeta}>
        <span className={styles.date}>{formatDate(trip.date)}</span>
        <span className={styles.route}>{trip.route}</span>
        <span className={styles.driver}>Driver: {trip.driver}</span>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Site #</th>
            <th className={styles.th}>Job Code</th>
            <th className={styles.th}>Cost Share</th>
          </tr>
        </thead>
        <tbody>
          {sites.map(site => (
            <tr key={site.siteId} className={styles.tr}>
              <td className={styles.td}>{site.siteNumber}</td>
              <td className={styles.td}>
                {showJCEntry ? (
                  <JCEntry site={site} onSave={onSaveJobCode} />
                ) : (
                  <span className={styles.jcCode}>{site.jobCode || '—'}</span>
                )}
              </td>
              <td className={styles.td}>${site.costShare.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className={styles.footLabel} colSpan={2}>Your total for this trip</td>
            <td className={styles.footTotal}>${myTotal.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
