import React, { useState } from 'react';
import styles from './NotificationBell.module.css';
import type { Notification } from '../../../types';
import { formatDateTime } from '../../../utils/date-formatter';

interface NotificationBellProps {
  unreadCount: number;
  notifications: Notification[];
  onMarkAsRead: (notifId: string) => void;
  onMarkAllAsRead: () => void;
}

export function NotificationBell({
  unreadCount,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.wrapper}>
      <button
        className={styles.bellButton}
        onClick={() => setOpen(prev => !prev)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
      >
        <BellIcon />
        {unreadCount > 0 ? (
          <span className={styles.badge} aria-hidden="true">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className={styles.dropdown} role="dialog" aria-label="Notifications">
          <div className={styles.dropdownHeader}>
            <span className={styles.dropdownTitle}>Notifications</span>
            {notifications.length > 0 ? (
              <button className={styles.markAllBtn} onClick={onMarkAllAsRead}>
                Mark all read
              </button>
            ) : null}
          </div>
          <ul className={styles.list} role="list">
            {notifications.length === 0 ? (
              <li className={styles.empty}>No unread notifications</li>
            ) : (
              notifications.map(n => (
                <li key={n.notifId} className={styles.item}>
                  <p className={styles.message}>{n.message}</p>
                  <div className={styles.itemMeta}>
                    <time className={styles.time}>{formatDateTime(n.createdAt)}</time>
                    <button
                      className={styles.dismissBtn}
                      onClick={() => onMarkAsRead(n.notifId)}
                    >
                      Dismiss
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.73 21a2 2 0 0 1-3.46 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
