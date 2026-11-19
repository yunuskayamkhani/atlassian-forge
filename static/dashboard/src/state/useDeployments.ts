import { useEffect, useMemo, useState } from 'react';
import { fetchDeployments } from '../api/deployments';
import { useFilters } from './FilterContext';
import { dateWindow } from '../util/commitStats';
import { filterDeploymentsByWindow } from '../util/deploymentStats';
import type { Deployment, Repository } from '../types/models';

export type DeploymentsState = {
  status: 'idle' | 'needs-repo' | 'loading' | 'loaded' | 'partial' | 'error';
  deployments: Deployment[];
  message: string | null;
  retryable: boolean;
  reload: () => void;
};

export function useDeployments(repositories: Repository[]): DeploymentsState {
  const { filters } = useFilters();
  const [status, setStatus] = useState<DeploymentsState['status']>('idle');
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [retryable, setRetryable] = useState(false);
  const [nonce, setNonce] = useState(0);
  const { workspaceId, repositoryId, environment } = filters;
  const window = useMemo(
    () => dateWindow(filters),
    [filters.dateRange, filters.customFrom, filters.customTo]
  );

  useEffect(() => {
    if (!workspaceId) {
      setStatus('idle');
      setDeployments([]);
      return;
    }

    const selectedRepositories =
      repositoryId === 'ALL'
        ? Array.from(new Map(repositories.map((repository) => [repository.id, repository])).values())
        : repositories.filter((repository) => repository.id === repositoryId);
    if (selectedRepositories.length === 0) {
      setStatus('needs-repo');
      setDeployments([]);
      setMessage(null);
      return;
    }

    let cancelled = false;
    setStatus('loading');
    setMessage(null);

    void (async () => {
      const results = await Promise.all(
        selectedRepositories.map(async (repository) => ({
          repository,
          result: await fetchDeployments(workspaceId, repository.id)
        }))
      );
      if (cancelled) {
        return;
      }

      const failure = results.find(({ result }) => !result.ok)?.result;
      const successfulResults = results.filter(({ result }) => result.ok);
      if (failure && !failure.ok && successfulResults.length === 0) {
        setDeployments([]);
        setStatus('error');
        setMessage(failure.message);
        setRetryable(failure.retryable);
        return;
      }

      const loadedDeployments = successfulResults.flatMap(({ repository, result }) =>
        result.ok
          ? result.data.map((deployment) => ({
              ...deployment,
              repositoryName: repository.fullName
            }))
          : []
      );
      loadedDeployments.sort((a, b) => {
        const aTime = Date.parse(a.createdOn);
        const bTime = Date.parse(b.createdOn);
        return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
      });
      setDeployments(loadedDeployments);
      setStatus(failure && !failure.ok ? 'partial' : 'loaded');
      setMessage(
        failure && !failure.ok
          ? `Some repositories could not be loaded: ${failure.message} Showing deployments from accessible repositories.`
          : null
      );
      setRetryable(results.some(({ result }) => !result.ok && result.retryable));
    })();

    return () => {
      cancelled = true;
    };
  }, [workspaceId, repositoryId, repositories, nonce]);

  const filtered = filterDeploymentsByWindow(deployments, window).filter(
    (deployment) =>
      environment === 'ALL' ||
      deployment.environment.toLocaleLowerCase() === environment.toLocaleLowerCase()
  );

  return {
    status,
    deployments: filtered,
    message,
    retryable,
    reload: () => setNonce((value) => value + 1)
  };
}
