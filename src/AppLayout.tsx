import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import styles from './AppLayout.module.css';
import { NotificationBell } from './components/common/NotificationBell';
import { useAuth } from './hooks/useAuth';
import { useNotifications } from './hooks/useNotifications';
import { ROUTES } from './constants';

interface AppLayoutProps {
  role: 'fleet' | 'project';
}

export function AppLayout({ role }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(user?.email);
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate(ROUTES.LOGIN, { replace: true });
  }

  const fleetNav = [
    { label: 'Dashboard', to: ROUTES.FLEET_DASHBOARD },
    { label: 'New Trip', to: ROUTES.FLEET_NEW_TRIP },
    { label: 'History', to: ROUTES.FLEET_HISTORY },
  ];

  const projectNav = [
    { label: 'Dashboard', to: ROUTES.PROJECT_DASHBOARD },
    { label: 'Pending JC', to: ROUTES.PROJECT_PENDING_JC },
    { label: 'History', to: ROUTES.PROJECT_HISTORY },
  ];

  const navItems = role === 'fleet' ? fleetNav : projectNav;

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <TruckIcon />
            <span className={styles.brandName}>TTS</span>
          </div>

          <nav className={styles.nav} aria-label="Main navigation">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className={styles.headerRight}>
            <NotificationBell
              unreadCount={unreadCount}
              notifications={notifications}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
            />
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.name}</span>
              <span className={styles.userRole}>{user?.role}</span>
            </div>
            <button className={styles.logoutBtn} onClick={handleLogout}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function TruckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="1" y="7" width="13" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M14 9h4l3 4v4h-7V9Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="6" cy="19" r="2" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="19" r="2" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
