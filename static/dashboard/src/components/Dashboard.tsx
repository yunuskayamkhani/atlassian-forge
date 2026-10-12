import { Filters } from './Filters';
import { KPIGrid, type KpiMetrics } from './KPIGrid';
import { SectionNav } from './SectionNav';
import { useDashboardData } from '../state/DashboardData';
import { CommitChart } from './CommitChart';
import { DeploymentTable } from './DeploymentTable';
import { DeveloperTable } from './DeveloperTable';
import { PipelineTable } from './PipelineTable';
import { PRTable } from './PRTable';
import { SourceStatus } from './SourceStatus';
import { EmptyState } from './EmptyState';
import { AdminPanel } from './AdminPanel';
import { MappingPanel } from './MappingPanel';
import type { DataSourceStatus } from '../types/status';
import type { AppUser, JiraProject, ProjectMapping, Repository, Workspace } from '../types/models';

export function Dashboard({
  isAdmin,
  admins,
  mappings,
  jiraProjects,
  workspaces,
  repositories,
  lastUpdated,
  isRefreshing,
  errorMessage,
  retryable,
  repositoryStatus,
  onRefresh,
  onDisconnect,
  onSaveMapping,
  onSaveAdmins,
  onDeleteMapping,
  onLoadRepositories
}: {
  isAdmin: boolean;
  admins: AppUser[];
  mappings: ProjectMapping[];
  jiraProjects: JiraProject[];
  workspaces: Workspace[];
  repositories: Repository[];
  lastUpdated: string | null;
  isRefreshing: boolean;
  errorMessage: string | null;
  retryable: boolean;
  repositoryStatus: DataSourceStatus['state'];
  onRefresh: () => void;
  onDisconnect: () => void;
  onSaveMapping: (mapping: Omit<ProjectMapping, 'id'> & { id?: string }) => Promise<boolean>;
  onSaveAdmins: (admins: AppUser[]) => Promise<boolean>;
  onDeleteMapping: (id: string) => Promise<void>;
  onLoadRepositories: (workspaceId: string) => Promise<Repository[]>;
}) {
  const { pullRequests, commits } = useDashboardData();

  const toSourceState = (
    status: 'idle' | 'needs-repo' | 'loading' | 'loaded' | 'error'
  ): DataSourceStatus['state'] => {
    if (status === 'loaded') {
      return 'loaded';
    }
    if (status === 'error') {
      return 'unavailable';
    }
    return 'pending';
  };

  const prsLoaded = pullRequests.status === 'loaded';
  const commitsLoaded = commits.status === 'loaded';

  const metrics: KpiMetrics = {
    repositories: repositoryStatus === 'loaded' ? repositories.length : undefined,
    commits: commitsLoaded ? commits.commits.length : undefined,
    'open-prs': prsLoaded
      ? pullRequests.pullRequests.filter((pr) => pr.state === 'OPEN').length
      : undefined,
    'merged-prs': prsLoaded
      ? pullRequests.pullRequests.filter((pr) => pr.state === 'MERGED').length
      : undefined,
    'review-prs': prsLoaded
      ? pullRequests.pullRequests.filter((pr) => pr.state === 'OPEN' && pr.reviewers.length === 0).length
      : undefined
  };

  const sources: DataSourceStatus[] = [
    { id: 'repositories', label: 'Repositories', state: repositoryStatus },
    { id: 'commits', label: 'Commits', state: toSourceState(commits.status) },
    { id: 'pull-requests', label: 'Pull Requests', state: toSourceState(pullRequests.status) },
    { id: 'pipelines', label: 'Pipelines', state: 'pending' },
    { id: 'deployments', label: 'Deployments', state: 'pending' }
  ];

  return (
    <div className="app-shell">
      <header className="hero">
        <p className="eyebrow">BITBUCKET ENGINEERING</p>
        <h1>Engineering dashboard</h1>
        <p className="hero-copy">
          Bitbucket analytics for Jira projects you can browse and that an administrator has enabled.
        </p>
        {isAdmin ? (
          <button type="button" className="text-button" onClick={onDisconnect}>
            Disconnect Bitbucket
          </button>
        ) : null}
      </header>

      {isAdmin ? (
        <>
          <AdminPanel admins={admins} onSave={onSaveAdmins} />
          <MappingPanel
            mappings={mappings}
            jiraProjects={jiraProjects}
            workspaces={workspaces}
            onLoadRepositories={onLoadRepositories}
            onSave={onSaveMapping}
            onDelete={onDeleteMapping}
          />
        </>
      ) : null}

      <Filters
        mappings={mappings}
        repositories={repositories}
        lastUpdated={lastUpdated}
        isRefreshing={isRefreshing}
        onRefresh={onRefresh}
      />

      {errorMessage ? (
        <div className="banner banner-warning" role="status">
          <span>{errorMessage}</span>
          {retryable ? (
            <button type="button" className="refresh-button" onClick={onRefresh}>
              Retry
            </button>
          ) : null}
        </div>
      ) : null}

      {mappings.filter((mapping) => mapping.enabled).length === 0 ? (
        <EmptyState
          title="No projects enabled"
          message={
            isAdmin
              ? 'Map a Jira project to a Bitbucket repository above, and leave it enabled for viewers.'
              : 'No enabled Jira projects are available for you. Ask an administrator to map a project you can browse.'
          }
        />
      ) : null}

      <SourceStatus sources={sources} />
      <KPIGrid metrics={metrics} />
      <SectionNav />

      <main className="dashboard-grid">
        <PRTable />
        <CommitChart />
        <PipelineTable />
        <DeploymentTable />
        <DeveloperTable />
      </main>
    </div>
  );
}
