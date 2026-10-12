import { useEffect, useState } from 'react';
import { searchUsers } from '../api/access';
import type { AppUser } from '../types/models';

export function UserPicker({
  selected,
  onChange,
  label,
  hint
}: {
  selected: AppUser[];
  onChange: (users: AppUser[]) => void;
  label: string;
  hint?: string;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AppUser[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      setMessage(null);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        const result = await searchUsers(term);
        if (cancelled) {
          return;
        }
        if (!result.ok) {
          setResults([]);
          setMessage(result.message);
          return;
        }
        setMessage(null);
        setResults(result.data.filter((user) => !selected.some((item) => item.accountId === user.accountId)));
      })();
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, selected]);

  return (
    <div className="user-picker">
      <label className="filter-field">
        <span>{label}</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name or email"
          aria-label={label}
        />
      </label>
      {hint ? <p className="muted">{hint}</p> : null}
      {message ? <p className="connect-error">{message}</p> : null}
      {results.length > 0 ? (
        <ul className="user-results">
          {results.map((user) => (
            <li key={user.accountId}>
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  onChange([...selected, user]);
                  setQuery('');
                  setResults([]);
                }}
              >
                Add {user.displayName}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {selected.length > 0 ? (
        <ul className="user-chips">
          {selected.map((user) => (
            <li key={user.accountId}>
              <span>{user.displayName}</span>
              <button
                type="button"
                className="text-button"
                onClick={() => onChange(selected.filter((item) => item.accountId !== user.accountId))}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
