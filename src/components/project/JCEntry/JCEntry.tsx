import React, { useState } from 'react';
import styles from './JCEntry.module.css';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';
import type { Site } from '../../../types';

interface JCEntryProps {
  site: Site;
  onSave: (siteId: string, jobCode: string) => Promise<void>;
}

export function JCEntry({ site, onSave }: JCEntryProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(site.jobCode || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (!value.trim()) {
      setError('Job code cannot be empty.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave(site.siteId, value.trim());
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setValue(site.jobCode || '');
    setEditing(false);
    setError('');
  }

  if (!editing) {
    return (
      <div className={styles.display}>
        <span className={styles.jcValue}>
          {site.jobCode || <span className={styles.empty}>No JC entered</span>}
        </span>
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
          {site.jobCode ? 'Edit' : 'Enter JC'}
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.editor}>
      <Input
        label="Job Code"
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        error={error}
        autoFocus
        placeholder="e.g. JC-2025-001"
      />
      <div className={styles.actions}>
        <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>
          Save
        </Button>
        <Button variant="ghost" size="sm" onClick={handleCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
