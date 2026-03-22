import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './NewTrip.module.css';
import { TripForm } from '../../../components/fleet/TripForm';
import { useTrips } from '../../../hooks/useTrips';
import { useAuth } from '../../../hooks/useAuth';
import { getProjectCoordinators } from '../../../services/sheets.service';
import { ROUTES } from '../../../constants';
import type { CreateTripPayload, User } from '../../../types';

export function NewTrip() {
  const { user } = useAuth();
  const { createTrip } = useTrips();
  const navigate = useNavigate();
  const [coordinators, setCoordinators] = useState<User[]>([]);
  const [coordinatorsLoading, setCoordinatorsLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    getProjectCoordinators().then(res => {
      if (res.success && res.data) setCoordinators(res.data);
      setCoordinatorsLoading(false);
    });
  }, []);

  async function handleSubmit(payload: CreateTripPayload) {
    await createTrip(payload);
    setSuccessMsg('Trip submitted! Email notifications have been sent to all coordinators.');
    setTimeout(() => navigate(ROUTES.FLEET_DASHBOARD), 2000);
  }

  if (!user) return null;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>New Trip</h1>
        <p className={styles.subtitle}>Fill in the trip details and add all sites.</p>
      </div>

      {successMsg ? (
        <div className={styles.successBanner} role="status">
          {successMsg}
        </div>
      ) : null}

      {coordinatorsLoading ? (
        <p className={styles.loading}>Loading coordinator list…</p>
      ) : (
        <TripForm
          onSubmit={handleSubmit}
          createdBy={user.email}
          coordinatorEmails={coordinators.map(c => c.email)}
        />
      )}
    </div>
  );
}
