import { useEffect, useState } from 'react';
import { fetchPullRequests } from '../api/pullRequests';
import { useFilters } from './FilterContext';
import type { PullRequest } from '../types/models';

export type PullRequestState = {
  status: 'idle' | 'needs-repo' | 'loading' | 'loaded' | 'error';
  pullRequests: PullRequest[];
  message: string | null;
  retryable: boolean;
  reload: () => void;
};

export function usePullRequests(): PullRequestState {
  const { filters } = useFilters();
  const [status, setStatus] = useState<PullRequestState['status']>('idle');
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [retryable, setRetryable] = useState(false);
  const [nonce, setNonce] = useState(0);

  const { workspaceId, repositoryId, prStatus } = filters;

  useEffect(() => {
    if (!workspaceId) {
      setStatus('idle');
      setPullRequests([]);
      return;
    }

    if (repositoryId === 'ALL') {
      setStatus('needs-repo');
      setPullRequests([]);
      setMessage(null);
      return;
    }

    let cancelled = false;
    setStatus('loading');
    setMessage(null);

    void (async () => {
      const result = await fetchPullRequests(workspaceId, repositoryId, prStatus);
      if (cancelled) {
        return;
      }

      if (!result.ok) {
        setPullRequests([]);
        setStatus('error');
        setMessage(result.message);
        setRetryable(result.retryable);
        return;
      }

      setPullRequests(result.data);
      setStatus('loaded');
      setMessage(null);
    })();

    return () => {
      cancelled = true;
    };
  }, [workspaceId, repositoryId, prStatus, nonce]);

  return {
    status,
    pullRequests,
    message,
    retryable,
    reload: () => setNonce((value) => value + 1)
  };
}
