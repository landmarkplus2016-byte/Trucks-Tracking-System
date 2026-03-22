import { useState, useEffect, useCallback, useRef } from 'react';
import type { Notification } from '../types';
import {
  getUnreadNotifications,
  markAsRead as markAsReadService,
  markAllAsRead as markAllAsReadService,
} from '../services/notify.service';
import { NOTIFICATION_POLL_INTERVAL } from '../constants';

// ─── useNotifications ─────────────────────────────────────────────────────────
// Polls the Apps Script for unread notifications for the current user.
// Exposes unread count, list, and mark-as-read helpers.

export function useNotifications(userEmail: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!userEmail) return;
    setLoading(true);
    const res = await getUnreadNotifications(userEmail);
    if (res.success && res.data) {
      setNotifications(res.data);
    }
    setLoading(false);
  }, [userEmail]);

  // Poll on mount and on the defined interval
  useEffect(() => {
    fetchNotifications();
    if (userEmail) {
      intervalRef.current = setInterval(fetchNotifications, NOTIFICATION_POLL_INTERVAL);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchNotifications, userEmail]);

  /** Mark a single notification as read. */
  const markAsRead = useCallback(async (notifId: string): Promise<void> => {
    await markAsReadService(notifId);
    setNotifications(prev => prev.filter(n => n.notifId !== notifId));
  }, []);

  /** Mark all notifications as read. */
  const markAllAsRead = useCallback(async (): Promise<void> => {
    if (!userEmail) return;
    await markAllAsReadService(userEmail);
    setNotifications([]);
  }, [userEmail]);

  return {
    notifications,
    unreadCount: notifications.length,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}
