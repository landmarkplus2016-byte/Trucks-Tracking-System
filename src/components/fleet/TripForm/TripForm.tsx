import React, { useState } from 'react';
import styles from './TripForm.module.css';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';
import { Card } from '../../common/Card';
import type { CreateTripPayload, NewSiteEntry } from '../../../types';
import { todayISO } from '../../../utils/date-formatter';

interface TripFormProps {
  /** Called when the form is submitted with valid data. */
  onSubmit: (payload: CreateTripPayload) => Promise<void>;
  /** Email of the currently logged-in fleet coordinator. */
  createdBy: string;
  /** List of project coordinator emails for the site dropdowns. */
  coordinatorEmails: string[];
}

const emptySite = (): NewSiteEntry => ({ siteNumber: '', coordinatorEmail: '' });

export function TripForm({ onSubmit, createdBy, coordinatorEmails }: TripFormProps) {
  const [date, setDate] = useState(todayISO());
  const [whRep, setWhRep] = useState('');
  const [driver, setDriver] = useState('');
  const [route, setRoute] = useState('');
  const [laborCost, setLaborCost] = useState('');
  const [parkCost, setParkCost] = useState('');
  const [truckCost, setTruckCost] = useState('');
  const [hotelCost, setHotelCost] = useState('');
  const [sites, setSites] = useState<NewSiteEntry[]>([emptySite()]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function updateSite(index: number, field: keyof NewSiteEntry, value: string) {
    setSites(prev => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }

  function addSite() {
    setSites(prev => [...prev, emptySite()]);
  }

  function removeSite(index: number) {
    setSites(prev => prev.filter((_, i) => i !== index));
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!date) newErrors.date = 'Date is required.';
    if (!whRep.trim()) newErrors.whRep = 'WH Rep is required.';
    if (!driver.trim()) newErrors.driver = 'Driver is required.';
    if (!route.trim()) newErrors.route = 'Route is required.';
    if (!laborCost || isNaN(Number(laborCost))) newErrors.laborCost = 'Valid labor cost required.';
    if (!parkCost || isNaN(Number(parkCost))) newErrors.parkCost = 'Valid park cost required.';
    if (!truckCost || isNaN(Number(truckCost))) newErrors.truckCost = 'Valid truck cost required.';
    if (!hotelCost || isNaN(Number(hotelCost))) newErrors.hotelCost = 'Valid hotel cost required.';
    sites.forEach((s, i) => {
      if (!s.siteNumber.trim()) newErrors[`site-${i}-number`] = 'Site number required.';
      if (!s.coordinatorEmail) newErrors[`site-${i}-email`] = 'Coordinator required.';
    });
    if (sites.length === 0) newErrors.sites = 'Add at least one site.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    await onSubmit({
      date,
      whRep: whRep.trim(),
      driver: driver.trim(),
      route: route.trim(),
      laborCost: Number(laborCost),
      parkCost: Number(parkCost),
      truckCost: Number(truckCost),
      hotelCost: Number(hotelCost),
      sites,
      createdBy,
    });
    setSubmitting(false);
  }

  const totalCost =
    (Number(laborCost) || 0) +
    (Number(parkCost) || 0) +
    (Number(truckCost) || 0) +
    (Number(hotelCost) || 0);

  return (
    <form onSubmit={handleSubmit} noValidate className={styles.form}>
      <Card title="Trip Details">
        <div className={styles.grid}>
          <Input
            label="Trip Date"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            error={errors.date}
            required
          />
          <Input
            label="WH Representative"
            type="text"
            value={whRep}
            onChange={e => setWhRep(e.target.value)}
            placeholder="e.g. John Smith"
            error={errors.whRep}
            required
          />
          <Input
            label="Driver"
            type="text"
            value={driver}
            onChange={e => setDriver(e.target.value)}
            placeholder="e.g. Mike Johnson"
            error={errors.driver}
            required
          />
          <Input
            label="Route"
            type="text"
            value={route}
            onChange={e => setRoute(e.target.value)}
            placeholder="e.g. Route 7 — North Loop"
            error={errors.route}
            required
          />
        </div>
      </Card>

      <Card title="Costs">
        <div className={styles.grid}>
          <Input
            label="Labor Cost ($)"
            type="number"
            min="0"
            step="0.01"
            value={laborCost}
            onChange={e => setLaborCost(e.target.value)}
            error={errors.laborCost}
            required
          />
          <Input
            label="Parking Cost ($)"
            type="number"
            min="0"
            step="0.01"
            value={parkCost}
            onChange={e => setParkCost(e.target.value)}
            error={errors.parkCost}
            required
          />
          <Input
            label="Truck Cost ($)"
            type="number"
            min="0"
            step="0.01"
            value={truckCost}
            onChange={e => setTruckCost(e.target.value)}
            error={errors.truckCost}
            required
          />
          <Input
            label="Hotel Cost ($)"
            type="number"
            min="0"
            step="0.01"
            value={hotelCost}
            onChange={e => setHotelCost(e.target.value)}
            error={errors.hotelCost}
            required
          />
        </div>
        {totalCost > 0 ? (
          <p className={styles.totalPreview}>
            Total trip cost: <strong>${totalCost.toFixed(2)}</strong>
            {sites.length > 0 ? (
              <> — ${(totalCost / sites.length).toFixed(2)} per site ({sites.length} site{sites.length !== 1 ? 's' : ''})</>
            ) : null}
          </p>
        ) : null}
      </Card>

      <Card title="Sites">
        {errors.sites ? <p className={styles.siteError}>{errors.sites}</p> : null}
        <ul className={styles.siteList}>
          {sites.map((site, idx) => (
            <li key={idx} className={styles.siteRow}>
              <span className={styles.siteIndex}>#{idx + 1}</span>
              <Input
                label="Site Number"
                type="text"
                value={site.siteNumber}
                onChange={e => updateSite(idx, 'siteNumber', e.target.value)}
                placeholder="e.g. 1042"
                error={errors[`site-${idx}-number`]}
                required
              />
              <div className={styles.selectWrapper}>
                <label className={styles.selectLabel}>
                  Coordinator *
                </label>
                <select
                  className={`${styles.select} ${errors[`site-${idx}-email`] ? styles.selectError : ''}`}
                  value={site.coordinatorEmail}
                  onChange={e => updateSite(idx, 'coordinatorEmail', e.target.value)}
                  required
                >
                  <option value="">Select coordinator…</option>
                  {coordinatorEmails.map(email => (
                    <option key={email} value={email}>{email}</option>
                  ))}
                </select>
                {errors[`site-${idx}-email`] ? (
                  <span className={styles.selectErrorText}>{errors[`site-${idx}-email`]}</span>
                ) : null}
              </div>
              {sites.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSite(idx)}
                  aria-label={`Remove site ${idx + 1}`}
                >
                  Remove
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
        <Button type="button" variant="secondary" size="sm" onClick={addSite}>
          + Add Site
        </Button>
      </Card>

      <div className={styles.actions}>
        <Button type="submit" variant="primary" size="lg" loading={submitting} fullWidth>
          Submit Trip
        </Button>
      </div>
    </form>
  );
}
