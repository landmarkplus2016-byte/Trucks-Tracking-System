import React from 'react';
import styles from './SiteList.module.css';
import type { Site } from '../../../types';
import { JC_STATUS } from '../../../constants';

interface SiteListProps {
  sites: Site[];
}

export function SiteList({ sites }: SiteListProps) {
  if (sites.length === 0) {
    return <p className={styles.empty}>No sites for this trip.</p>;
  }

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th className={styles.th}>Site #</th>
          <th className={styles.th}>Coordinator</th>
          <th className={styles.th}>Job Code</th>
          <th className={styles.th}>JC Status</th>
          <th className={styles.th}>Cost Share</th>
        </tr>
      </thead>
      <tbody>
        {sites.map(site => (
          <tr key={site.siteId} className={styles.tr}>
            <td className={styles.td}>{site.siteNumber}</td>
            <td className={styles.td}>{site.coordinatorEmail}</td>
            <td className={styles.td}>
              {site.jobCode || <span className={styles.noJc}>—</span>}
            </td>
            <td className={styles.td}>
              <span
                className={`${styles.badge} ${
                  site.jcStatus === JC_STATUS.ENTERED ? styles.badgeEntered : styles.badgePending
                }`}
              >
                {site.jcStatus === JC_STATUS.ENTERED ? 'Entered' : 'Pending'}
              </span>
            </td>
            <td className={styles.td}>${site.costShare.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
