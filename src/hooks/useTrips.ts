import { useState, useEffect, useCallback } from 'react';
import type { Trip, Site, CreateTripPayload, UpdateTripPayload, UpdateJobCodePayload } from '../types';
import {
  getTrips,
  createTrip as createTripService,
  updateTrip as updateTripService,
  deleteTrip as deleteTripService,
  getSitesByTrip,
  getSitesByCoordinator,
  updateJobCode as updateJobCodeService,
} from '../services/sheets.service';
import { sendTripNotification } from '../services/notify.service';

// ─── useTrips ─────────────────────────────────────────────────────────────────
// Handles fetching and mutating trip data.
// Components must use this hook — they must NOT call services directly.

export function useTrips(filterByEmail?: string) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await getTrips(filterByEmail);
    if (response.success && response.data) {
      setTrips(response.data);
    } else {
      setError(response.error ?? 'Failed to load trips.');
    }
    setLoading(false);
  }, [filterByEmail]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  /** Create a new trip, then send email notifications. */
  const createTrip = useCallback(async (payload: CreateTripPayload): Promise<Trip> => {
    setLoading(true);
    setError(null);
    const response = await createTripService(payload);
    if (!response.success || !response.data) {
      setError(response.error ?? 'Failed to create trip.');
      setLoading(false);
      throw new Error(response.error ?? 'Failed to create trip.');
    }
    const newTrip = response.data;
    // Trigger email notification (fire-and-forget — don't block the UI)
    sendTripNotification(newTrip.tripId).catch(() => {/* notification failure is non-fatal */});
    await fetchTrips();
    setLoading(false);
    return newTrip;
  }, [fetchTrips]);

  /** Update an existing trip. */
  const updateTrip = useCallback(async (payload: UpdateTripPayload): Promise<void> => {
    setLoading(true);
    setError(null);
    const response = await updateTripService(payload);
    if (!response.success) {
      setError(response.error ?? 'Failed to update trip.');
      setLoading(false);
      throw new Error(response.error ?? 'Failed to update trip.');
    }
    await fetchTrips();
    setLoading(false);
  }, [fetchTrips]);

  /** Delete a trip. */
  const deleteTrip = useCallback(async (tripId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    const response = await deleteTripService(tripId);
    if (!response.success) {
      setError(response.error ?? 'Failed to delete trip.');
      setLoading(false);
      throw new Error(response.error ?? 'Failed to delete trip.');
    }
    setTrips(prev => prev.filter(t => t.tripId !== tripId));
    setLoading(false);
  }, []);

  return { trips, loading, error, fetchTrips, createTrip, updateTrip, deleteTrip };
}

// ─── useSites ─────────────────────────────────────────────────────────────────

export function useSitesByTrip(tripId: string) {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId) return;
    setLoading(true);
    getSitesByTrip(tripId).then(res => {
      if (res.success && res.data) setSites(res.data);
      else setError(res.error ?? 'Failed to load sites.');
      setLoading(false);
    });
  }, [tripId]);

  return { sites, loading, error };
}

export function useSitesByCoordinator(coordinatorEmail: string) {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSites = useCallback(async () => {
    if (!coordinatorEmail) return;
    setLoading(true);
    const res = await getSitesByCoordinator(coordinatorEmail);
    if (res.success && res.data) setSites(res.data);
    else setError(res.error ?? 'Failed to load sites.');
    setLoading(false);
  }, [coordinatorEmail]);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  const updateJobCode = useCallback(async (payload: UpdateJobCodePayload): Promise<void> => {
    const res = await updateJobCodeService(payload);
    if (!res.success) throw new Error(res.error ?? 'Failed to update job code.');
    await fetchSites();
  }, [fetchSites]);

  return { sites, loading, error, updateJobCode, refetch: fetchSites };
}
