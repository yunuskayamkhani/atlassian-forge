import { EmptyState } from './EmptyState';
import { SectionCard } from './SectionCard';
import { useDashboardData } from '../state/DashboardData';
import { openLink } from '../util/openLink';

function formatDate(value: string): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

export function DeploymentTable() {
  const { status, deployments, message, retryable, reload } = useDashboardData().deployments;

  return (
    <SectionCard
      id="deployments"
      title="Deployments"
      description="Environment, status, commit, repository, timing, and deployment links."
    >
      {status === 'needs-repo' ? (
        <EmptyState title="Select a repository" message="Choose a repository to load deployments." />
      ) : null}
      {status === 'loading' ? <div className="skeleton section-skeleton" aria-label="Loading deployments" /> : null}
      {status === 'error' || status === 'partial' ? (
        <div className="banner banner-warning" role="status">
          <span>{message ?? 'Unable to load deployments.'}</span>
          {retryable ? (
            <button type="button" className="refresh-button" onClick={reload}>
              Retry
            </button>
          ) : null}
        </div>
      ) : null}
      {(status === 'loaded' || status === 'partial') && deployments.length === 0 ? (
        <EmptyState
          title="No deployments"
          message="No Bitbucket deployment records were found in this date range. A pipeline must record a deployment environment for its runs to appear here."
        />
      ) : null}
      {(status === 'loaded' || status === 'partial') && deployments.length > 0 ? (
        <div className="table-wrap">
          <table>
            <caption className="sr-only">Recent Bitbucket deployments</caption>
            <thead>
              <tr>
                <th>Environment</th>
                <th>Status</th>
                <th>Commit</th>
                <th>Repository</th>
                <th>Recorded</th>
                <th>Deployment</th>
              </tr>
            </thead>
            <tbody>
              {deployments.slice(0, 15).map((deployment) => (
                <tr key={`${deployment.repositoryName ?? ''}:${deployment.uuid}`}>
                  <td>{deployment.environment || '—'}</td>
                  <td>{deployment.status.replace(/_/g, ' ')}</td>
                  <td>{deployment.commitHash ? deployment.commitHash.slice(0, 7) : '—'}</td>
                  <td>{deployment.repositoryName ?? '—'}</td>
                  <td>{formatDate(deployment.createdOn)}</td>
                  <td>
                    {deployment.webUrl ? (
                      <button
                        type="button"
                        className="link-button"
                        onClick={() => void openLink(deployment.webUrl)}
                      >
                        View
                      </button>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </SectionCard>
  );
}
