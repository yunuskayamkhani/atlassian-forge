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

export function useCommits(mappedRepositoryIds: string[]): CommitsState {
  const { filters } = useFilters();
  const [status, setStatus] = useState<CommitsState['status']>('idle');
  const [commits, setCommits] = useState<Commit[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [retryable, setRetryable] = useState(false);
  const [nonce, setNonce] = useState(0);

  const { workspaceId, repositoryId, prStatus } = filters;
  const window = useMemo(
    () => dateWindow(filters),
    [filters.dateRange, filters.customFrom, filters.customTo]
  );

  useEffect(() => {
    if (!workspaceId) {
      setStatus('idle');
      setCommits([]);
      return;
    }

    const repositoryIds =
      repositoryId === 'ALL'
        ? Array.from(new Set(mappedRepositoryIds))
        : [repositoryId];
    if (repositoryIds.length === 0) {
      setStatus('needs-repo');
      setCommits([]);
      setMessage(null);
      return;
    }

    let cancelled = false;
    setStatus('loading');
    setMessage(null);

    void (async () => {
      const results = [];
      for (const id of repositoryIds) {
        results.push(await fetchCommits(workspaceId, id, prStatus, window.from));
      }
      if (cancelled) {
        return;
      }

      const failure = results.find((result) => !result.ok);
      if (failure && !failure.ok) {
        setCommits([]);
        setStatus('error');
        setMessage(failure.message);
        setRetryable(failure.retryable);
        return;
      }

      setCommits(results.flatMap((result) => (result.ok ? result.data : [])));
      setStatus('loaded');
      setMessage(null);
    })();

    return () => {
      cancelled = true;
    };
  }, [workspaceId, repositoryId, mappedRepositoryIds, prStatus, window.from, window.to, nonce]);

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
