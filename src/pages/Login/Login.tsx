import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useAuth } from '../../hooks/useAuth';
import { ROLES, ROUTES } from '../../constants';

export function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const user = await login(email.trim(), password);
      if (user.role === ROLES.FLEET) {
        navigate(ROUTES.FLEET_DASHBOARD, { replace: true });
      } else {
        navigate(ROUTES.PROJECT_DASHBOARD, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.logoArea}>
          <TruckIcon />
          <h1 className={styles.appName}>Trucks Tracking System</h1>
          <p className={styles.tagline}>Fleet & Project Coordinator Portal</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {error ? (
            <div className={styles.errorBanner} role="alert">
              {error}
            </div>
          ) : null}

          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          <Button type="submit" variant="primary" size="lg" loading={loading} fullWidth>
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}

function TruckIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="1" y="7" width="13" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
      <path
        d="M14 9h4l3 4v4h-7V9Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="6" cy="19" r="2" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="19" r="2" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
