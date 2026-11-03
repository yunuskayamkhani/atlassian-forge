import { createContext, useContext, type ReactNode } from 'react';
import { usePullRequests, type PullRequestState } from './usePullRequests';
import { useCommits, type CommitsState } from './useCommits';

type DashboardData = {
  pullRequests: PullRequestState;
  commits: CommitsState;
};

const DashboardDataContext = createContext<DashboardData | null>(null);

export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const pullRequests = usePullRequests();
  const commits = useCommits();

  return (
    <DashboardDataContext.Provider value={{ pullRequests, commits }}>
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
