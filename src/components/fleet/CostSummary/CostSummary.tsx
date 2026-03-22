import React from 'react';
import styles from './CostSummary.module.css';
import type { CostBreakdown } from '../../../types';

interface CostSummaryProps {
  breakdown: CostBreakdown;
}

export function CostSummary({ breakdown }: CostSummaryProps) {
  const { totalCost, totalSites, costPerSite, coordinatorBreakdowns } = breakdown;

  return (
    <div className={styles.wrapper}>
      <div className={styles.totals}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Total Trip Cost</span>
          <span className={styles.statValue}>${totalCost.toFixed(2)}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Sites</span>
          <span className={styles.statValue}>{totalSites}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Cost / Site</span>
          <span className={styles.statValue}>${costPerSite.toFixed(2)}</span>
        </div>
      </div>

      <h3 className={styles.subheading}>By Coordinator</h3>
      <ul className={styles.coordinatorList}>
        {coordinatorBreakdowns.map(c => (
          <li key={c.coordinatorEmail} className={styles.coordinatorRow}>
            <div className={styles.coordInfo}>
              <span className={styles.coordEmail}>{c.coordinatorEmail}</span>
              <span className={styles.coordSites}>{c.siteCount} site{c.siteCount !== 1 ? 's' : ''}</span>
            </div>
            <span className={styles.coordCost}>${c.totalCost.toFixed(2)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
