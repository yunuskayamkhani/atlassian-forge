import { useEffect, useMemo, useState } from 'react';
import { fetchCommits } from '../api/commits';
import { useFilters } from './FilterContext';
import { dateWindow, filterByWindow } from '../util/commitStats';
import type { Commit } from '../types/models';

export type CommitsState = {
  status: 'idle' | 'needs-repo' | 'loading' | 'loaded' | 'error';
  commits: Commit[];
  totalFetched: number;
  message: string | null;
  retryable: boolean;
  reload: () => void;
};

export function useCommits(): CommitsState {
  const { filters } = useFilters();
  const [status, setStatus] = useState<CommitsState['status']>('idle');
  const [commits, setCommits] = useState<Commit[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [retryable, setRetryable] = useState(false);
  const [nonce, setNonce] = useState(0);

  const { workspaceId, repositoryId } = filters;

  useEffect(() => {
    if (!workspaceId) {
      setStatus('idle');
      setCommits([]);
      return;
    }

    if (repositoryId === 'ALL') {
      setStatus('needs-repo');
      setCommits([]);
      setMessage(null);
      return;
    }

    let cancelled = false;
    setStatus('loading');
    setMessage(null);

    void (async () => {
      const result = await fetchCommits(workspaceId, repositoryId);
      if (cancelled) {
        return;
      }

      if (!result.ok) {
        setCommits([]);
        setStatus('error');
        setMessage(result.message);
        setRetryable(result.retryable);
        return;
      }

      setCommits(result.data);
      setStatus('loaded');
      setMessage(null);
    })();

    return () => {
      cancelled = true;
    };
  }, [workspaceId, repositoryId, nonce]);

  const filtered = useMemo(
    () => filterByWindow(commits, dateWindow(filters)),
    [commits, filters.dateRange, filters.customFrom, filters.customTo]
  );

  return {
    status,
    commits: filtered,
    totalFetched: commits.length,
    message,
    retryable,
    reload: () => setNonce((value) => value + 1)
  };
}
