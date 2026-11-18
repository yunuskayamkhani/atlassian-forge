import { useEffect, useState } from 'react';
import { fetchPullRequests } from '../api/pullRequests';
import { useFilters } from './FilterContext';
import type { PullRequest } from '../types/models';

export type PullRequestState = {
  status: 'idle' | 'needs-repo' | 'loading' | 'loaded' | 'partial' | 'error';
  pullRequests: PullRequest[];
  message: string | null;
  retryable: boolean;
  reload: () => void;
};

function sortByPullRequestNumberDescending(pullRequests: PullRequest[]): PullRequest[] {
  return [...pullRequests].sort((a, b) => {
    const numberDifference = Number(b.id) - Number(a.id);
    if (Number.isFinite(numberDifference) && numberDifference !== 0) {
      return numberDifference;
    }

    return Date.parse(b.updatedOn || '') - Date.parse(a.updatedOn || '');
  });
}

export function usePullRequests(mappedRepositoryIds: string[]): PullRequestState {
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

    const repositoryIds =
      repositoryId === 'ALL'
        ? Array.from(new Set(mappedRepositoryIds))
        : [repositoryId];
    if (repositoryIds.length === 0) {
      setStatus('needs-repo');
      setPullRequests([]);
      setMessage(null);
      return;
    }

    let cancelled = false;
    setStatus('loading');
    setMessage(null);

    void (async () => {
      const results = await Promise.all(
        repositoryIds.map((id) => fetchPullRequests(workspaceId, id, prStatus))
      );
      if (cancelled) {
        return;
      }

      const failure = results.find((result) => !result.ok);
      const successfulResults = results.filter((result) => result.ok);
      if (failure && !failure.ok) {
        if (successfulResults.length === 0) {
          setPullRequests([]);
          setStatus('error');
          setMessage(failure.message);
          setRetryable(failure.retryable);
          return;
        }

        setPullRequests(sortByPullRequestNumberDescending(successfulResults.flatMap((result) => result.data)));
        setStatus('partial');
        setMessage(
          `Some repositories could not be loaded: ${failure.message} Showing pull requests from repositories that were accessible.`
        );
        setRetryable(results.some((result) => !result.ok && result.retryable));
        return;
      }

      setPullRequests(sortByPullRequestNumberDescending(successfulResults.flatMap((result) => result.data)));
      setStatus('loaded');
      setMessage(null);
      setRetryable(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [workspaceId, repositoryId, mappedRepositoryIds, prStatus, nonce]);

  return {
    status,
    pullRequests,
    message,
    retryable,
    reload: () => setNonce((value) => value + 1)
  };
}
