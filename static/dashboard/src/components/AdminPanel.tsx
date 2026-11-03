import { useEffect, useState } from 'react';
import { UserPicker } from './UserPicker';
import type { AppUser } from '../types/models';

export function AdminPanel({
  admins,
  onSave
}: {
  admins: AppUser[];
  onSave: (admins: AppUser[]) => Promise<boolean>;
}) {
  const [selected, setSelected] = useState(admins);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelected(admins);
  }, [admins]);

  return (
    <section className="connect-card" aria-labelledby="admins-title">
      <h2 id="admins-title">Dashboard admins</h2>
      <p>
        People you add here get full access: connect Bitbucket, map projects, and choose boards and sprints.
        Everyone else only sees the dashboard for mappings they are allowed to view.
      </p>
      {admins.length === 0 ? (
        <p className="banner banner-warning">
          No dashboard admins are saved yet. Add yourself and the people who should manage this app. Until you
          save this list, any Jira site admin can open these controls.
        </p>
      ) : null}
      <div className="connect-form">
        <UserPicker
          selected={selected}
          onChange={setSelected}
          label="Add administrator"
          hint="Search Jira users, then save. Viewers will not see this panel."
        />
        <button
          type="button"
          className="refresh-button"
          disabled={saving || selected.length === 0}
          onClick={() => {
            setSaving(true);
            void onSave(selected).finally(() => setSaving(false));
          }}
        >
          {saving ? 'Saving…' : 'Save admins'}
        </button>
      </div>
    </section>
  );
}
