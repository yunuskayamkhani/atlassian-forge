import { useEffect, useMemo, useState } from 'react';
import { fetchPipelines } from '../api/pipelines';
import { useFilters } from './FilterContext';
import { dateWindow } from '../util/commitStats';
import { filterPipelinesByWindow } from '../util/pipelineStats';
import type { PipelineRun, Repository } from '../types/models';

export type PipelinesState = {
  status: 'idle' | 'needs-repo' | 'loading' | 'loaded' | 'partial' | 'error';
  runs: PipelineRun[];
  message: string | null;
  retryable: boolean;
  reload: () => void;
};

export function usePipelines(repositories: Repository[]): PipelinesState {
  const { filters } = useFilters();
  const [status, setStatus] = useState<PipelinesState['status']>('idle');
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [retryable, setRetryable] = useState(false);
  const [nonce, setNonce] = useState(0);
  const { workspaceId, repositoryId } = filters;
  const window = useMemo(
    () => dateWindow(filters),
    [filters.dateRange, filters.customFrom, filters.customTo]
  );

  useEffect(() => {
    if (!workspaceId) {
      setStatus('idle');
      setRuns([]);
      return;
    }

    const selectedRepositories =
      repositoryId === 'ALL'
        ? Array.from(new Map(repositories.map((repository) => [repository.id, repository])).values())
        : repositories.filter((repository) => repository.id === repositoryId);
    if (selectedRepositories.length === 0) {
      setStatus('needs-repo');
      setRuns([]);
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
          result: await fetchPipelines(workspaceId, repository.id)
        }))
      );
      if (cancelled) {
        return;
      }

      const failure = results.find(({ result }) => !result.ok)?.result;
      const successfulResults = results.filter(({ result }) => result.ok);
      if (failure && !failure.ok && successfulResults.length === 0) {
        setRuns([]);
        setStatus('error');
        setMessage(failure.message);
        setRetryable(failure.retryable);
        return;
      }

      const loadedRuns = successfulResults.flatMap(({ repository, result }) =>
        result.ok
          ? result.data.map((run) => ({ ...run, repositoryName: repository.fullName }))
          : []
      );
      loadedRuns.sort((a, b) => {
        const aTime = Date.parse(a.createdOn);
        const bTime = Date.parse(b.createdOn);
        return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
      });
      setRuns(loadedRuns);
      setStatus(failure && !failure.ok ? 'partial' : 'loaded');
      setMessage(
        failure && !failure.ok
          ? `Some repositories could not be loaded: ${failure.message} Showing pipelines from accessible repositories.`
          : null
      );
      setRetryable(results.some(({ result }) => !result.ok && result.retryable));
    })();

    return () => {
      cancelled = true;
    };
  }, [workspaceId, repositoryId, repositories, nonce]);

  return {
    status,
    runs: filterPipelinesByWindow(runs, window),
    message,
    retryable,
    reload: () => setNonce((value) => value + 1)
  };
}
