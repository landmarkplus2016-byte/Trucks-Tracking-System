import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES, ROLES } from './constants';
import { useAuth } from './hooks/useAuth';

// Pages
import { Login } from './pages/Login';
import { FleetDashboard } from './pages/fleet/Dashboard';
import { NewTrip } from './pages/fleet/NewTrip';
import { FleetHistory } from './pages/fleet/History';
import { ProjectDashboard } from './pages/project/Dashboard';
import { PendingJC } from './pages/project/PendingJC';
import { ProjectHistory } from './pages/project/History';

// Layout wrapper (defined below)
import { AppLayout } from './AppLayout';

// ─── Route Guards ─────────────────────────────────────────────────────────────

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to={ROUTES.LOGIN} replace />;
}

function RequireRole({ role, children }: { role: string; children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to={ROUTES.LOGIN} replace />;
  if (user.role !== role) {
    const redirect = user.role === ROLES.FLEET ? ROUTES.FLEET_DASHBOARD : ROUTES.PROJECT_DASHBOARD;
    return <Navigate to={redirect} replace />;
  }
  return <>{children}</>;
}

// ─── Router ───────────────────────────────────────────────────────────────────

export function AppRouter() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path={ROUTES.LOGIN} element={<Login />} />

      {/* Root redirect */}
      <Route
        path="/"
        element={
          isAuthenticated
            ? <Navigate to={user?.role === ROLES.FLEET ? ROUTES.FLEET_DASHBOARD : ROUTES.PROJECT_DASHBOARD} replace />
            : <Navigate to={ROUTES.LOGIN} replace />
        }
      />

      {/* Fleet routes */}
      <Route
        path="/fleet/*"
        element={
          <RequireAuth>
            <RequireRole role={ROLES.FLEET}>
              <AppLayout role={ROLES.FLEET} />
            </RequireRole>
          </RequireAuth>
        }
      >
        <Route path="dashboard" element={<FleetDashboard />} />
        <Route path="new-trip" element={<NewTrip />} />
        <Route path="history" element={<FleetHistory />} />
        <Route path="history/:tripId" element={<FleetHistory />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Project routes */}
      <Route
        path="/project/*"
        element={
          <RequireAuth>
            <RequireRole role={ROLES.PROJECT}>
              <AppLayout role={ROLES.PROJECT} />
            </RequireRole>
          </RequireAuth>
        }
      >
        <Route path="dashboard" element={<ProjectDashboard />} />
        <Route path="pending-jc" element={<PendingJC />} />
        <Route path="history" element={<ProjectHistory />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Catch-all */}
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? '/' : ROUTES.LOGIN} replace />}
      />
    </Routes>
  );
}
