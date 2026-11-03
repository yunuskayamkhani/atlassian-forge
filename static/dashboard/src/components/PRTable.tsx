import { EmptyState } from './EmptyState';
import { SectionCard } from './SectionCard';
import { useDashboardData } from '../state/DashboardData';
import { useJiraStatuses } from '../state/useJiraStatuses';
import { displayPrBranches } from '../util/prBranches';
import { openLink } from '../util/openLink';
import type { JiraStatus, PullRequest } from '../types/models';

function formatDate(value: string): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
}

function StatusBadge({ state }: { state: PullRequest['state'] }) {
  return <span className={`pr-status pr-status-${state.toLowerCase()}`}>{state}</span>;
}

function JiraKeys({ keys, statuses }: { keys: string[]; statuses: Record<string, JiraStatus> }) {
  if (keys.length === 0) {
    return <span className="muted">—</span>;
  }

  return (
    <span className="jira-keys">
      {keys.map((key) => {
        const status = statuses[key];
        return (
          <span key={key} className="jira-key-group">
            <button
              type="button"
              className="jira-key"
              onClick={() => void openLink(`/browse/${key}`)}
              title={`Open ${key} in Jira`}
            >
              {key}
            </button>
            {status ? (
              <span className={`jira-status jira-cat-${status.category}`} title={`Jira status: ${status.name}`}>
                {status.name}
              </span>
            ) : null}
          </span>
        );
      })}
    </span>
  );
}

export function PRTable() {
  const { status, pullRequests, message, retryable, reload } = useDashboardData().pullRequests;
  const jiraStatuses = useJiraStatuses(pullRequests.flatMap((pr) => pr.jiraKeys));

  return (
    <SectionCard
      id="pull-requests"
      title="Pull Requests"
      description="Open, merged, and declined pull requests with reviewers, branches, and Jira links."
    >
      {status === 'needs-repo' ? (
        <EmptyState
          title="Select a repository"
          message="Choose a repository in the filter bar to load its pull requests."
        />
      ) : null}

      {status === 'loading' ? (
        <div className="skeleton section-skeleton" aria-label="Loading pull requests" />
      ) : null}

      {status === 'error' ? (
        <div className="banner banner-warning" role="status">
          <span>{message ?? 'Unable to load pull requests.'}</span>
          {retryable ? (
            <button type="button" className="refresh-button" onClick={reload}>
              Retry
            </button>
          ) : null}
        </div>
      ) : null}

      {status === 'loaded' && pullRequests.length === 0 ? (
        <EmptyState
          title="No pull requests"
          message="No pull requests match the selected repository and status filter."
        />
      ) : null}

      {status === 'loaded' && pullRequests.length > 0 ? (
        <div className="table-wrap">
          <table>
            <caption className="sr-only">Pull requests</caption>
            <thead>
              <tr>
                <th>PR</th>
                <th>Title</th>
                <th>Author</th>
                <th>Status</th>
                <th>Reviewers</th>
                <th>Source</th>
                <th>Destination</th>
                <th>Jira</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {pullRequests.map((pr) => {
                const branches = displayPrBranches(pr.sourceBranch, pr.targetBranch);
                return (
                <tr key={pr.id}>
                  <td>
                    {pr.webUrl ? (
                      <button type="button" className="link-button" onClick={() => void openLink(pr.webUrl)}>
                        #{pr.id}
                      </button>
                    ) : (
                      <span>#{pr.id}</span>
                    )}
                  </td>
                  <td>{pr.title}</td>
                  <td>{pr.author || '—'}</td>
                  <td>
                    <StatusBadge state={pr.state} />
                  </td>
                  <td>{pr.reviewers.length > 0 ? pr.reviewers.join(', ') : <span className="muted">—</span>}</td>
                  <td>
                    <code>{branches.source}</code>
                  </td>
                  <td>
                    <code>{branches.destination}</code>
                  </td>
                  <td>
                    <JiraKeys keys={pr.jiraKeys} statuses={jiraStatuses} />
                  </td>
                  <td>{formatDate(pr.updatedOn)}</td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </SectionCard>
  );
}
