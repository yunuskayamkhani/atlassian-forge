import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { usePullRequests, type PullRequestState } from './usePullRequests';
import { useCommits, type CommitsState } from './useCommits';
import { usePipelines, type PipelinesState } from './usePipelines';
import { useDeployments, type DeploymentsState } from './useDeployments';
import type { Repository } from '../types/models';

type DashboardData = {
  pullRequests: PullRequestState;
  commits: CommitsState;
  pipelines: PipelinesState;
  deployments: DeploymentsState;
};

const DashboardDataContext = createContext<DashboardData | null>(null);

export function DashboardDataProvider({
  children,
  repositories
}: {
  children: ReactNode;
  repositories: Repository[];
}) {
  const repositoryIds = useMemo(() => repositories.map((repository) => repository.id), [repositories]);
  const pullRequests = usePullRequests(repositoryIds);
  const commits = useCommits(repositoryIds);
  const pipelines = usePipelines(repositories);
  const deployments = useDeployments(repositories);

  return (
    <DashboardDataContext.Provider value={{ pullRequests, commits, pipelines, deployments }}>
      {children}
    </DashboardDataContext.Provider>
  );
}

export function useDashboardData(): DashboardData {
  const context = useContext(DashboardDataContext);
  if (!context) {
    throw new Error('useDashboardData must be used within DashboardDataProvider');
  }
  return context;
}
