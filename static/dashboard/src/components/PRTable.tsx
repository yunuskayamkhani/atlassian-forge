import { EmptyState } from './EmptyState';
import { SectionCard } from './SectionCard';
import { useDashboardData } from '../state/DashboardData';
import { useJiraStatuses } from '../state/useJiraStatuses';
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

function JiraKeys({ keys }: { keys: string[] }) {
  if (keys.length === 0) {
    return <span className="muted">—</span>;
  }

  return (
    <span className="jira-keys">
      {keys.map((key) => (
        <button
          key={key}
          type="button"
          className="jira-key"
          onClick={() => void openLink(`/browse/${key}`)}
          title={`Open ${key} in Jira`}
        >
          {key}
        </button>
      ))}
    </span>
  );
}

function JiraStatuses({ keys, statuses }: { keys: string[]; statuses: Record<string, JiraStatus> }) {
  if (keys.length === 0) {
    return <span className="muted">—</span>;
  }

  return (
    <span className="jira-statuses">
      {keys.map((key) => {
        const status = statuses[key];
        return status ? (
          <span
            key={key}
            className={`jira-status jira-cat-${status.category}`}
            title={`Jira status for ${key}: ${status.name}`}
          >
            {status.name}
          </span>
        ) : (
          <span key={key} className="muted" title={`Jira status unavailable for ${key}`}>
            —
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
      description="Open, merged, and declined pull requests with Jira ticket numbers, Jira statuses, approved reviewers, and update dates."
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

      {status === 'error' || status === 'partial' ? (
        <div className="banner banner-warning" role="status">
          <span>{message ?? 'Unable to load pull requests.'}</span>
          {retryable ? (
            <button type="button" className="refresh-button" onClick={reload}>
              Retry
            </button>
          ) : null}
        </div>
      ) : null}

      {(status === 'loaded' || status === 'partial') && pullRequests.length === 0 ? (
        <EmptyState
          title="No pull requests"
          message={
            status === 'partial'
              ? 'No pull requests were found in the repositories that were accessible.'
              : 'No pull requests match the selected repository and status filter.'
          }
        />
      ) : null}

      {(status === 'loaded' || status === 'partial') && pullRequests.length > 0 ? (
        <div className="table-wrap">
          <table>
            <caption className="sr-only">Pull requests</caption>
            <thead>
              <tr>
                <th>PR Number</th>
                <th>Jira Ticket Number</th>
                <th>Jira Status</th>
                <th>PR Message</th>
                <th>Developer</th>
                <th>Status</th>
                <th>Reviewers</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {pullRequests.map((pr) => {
                const reviewerNames =
                  pr.state === 'DECLINED' && pr.declinedBy
                    ? Array.from(new Set([...pr.approvedReviewers, pr.declinedBy]))
                    : pr.approvedReviewers;
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
                  <td>
                    <JiraKeys keys={pr.jiraKeys} />
                  </td>
                  <td>
                    <JiraStatuses keys={pr.jiraKeys} statuses={jiraStatuses} />
                  </td>
                  <td>{pr.title}</td>
                  <td>{pr.author || '—'}</td>
                  <td>
                    <StatusBadge state={pr.state} />
                  </td>
                  <td>
                    {reviewerNames.length > 0 ? (
                      reviewerNames.join(', ')
                    ) : (
                      <span className="muted">—</span>
                    )}
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
