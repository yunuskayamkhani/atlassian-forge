import { useMemo } from 'react';
import { BarList } from './BarList';
import { EmptyState } from './EmptyState';
import { SectionCard } from './SectionCard';
import { useDashboardData } from '../state/DashboardData';
import { commitsByAuthor, commitsByDay } from '../util/commitStats';
import { openLink } from '../util/openLink';

function formatDate(value: string): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
}

export function CommitChart() {
  const { status, commits, message, retryable, reload } = useDashboardData().commits;

  const byDay = useMemo(() => commitsByDay(commits), [commits]);
  const byAuthor = useMemo(() => commitsByAuthor(commits), [commits]);
  const contributors = byAuthor.length;
  const activeDays = byDay.length;
  const recent = commits.slice(0, 15);

  return (
    <SectionCard
      id="commit-activity"
      title="Commit Activity"
      description="Commits over time, by developer, and a contributor summary for the selected range."
    >
      {status === 'needs-repo' ? (
        <EmptyState
          title="Select a repository"
          message="Choose a repository in the filter bar to load its commit activity."
        />
      ) : null}

      {status === 'loading' ? (
        <div className="skeleton section-skeleton" aria-label="Loading commits" />
      ) : null}

      {status === 'error' ? (
        <div className="banner banner-warning" role="status">
          <span>{message ?? 'Unable to load commits.'}</span>
          {retryable ? (
            <button type="button" className="refresh-button" onClick={reload}>
              Retry
            </button>
          ) : null}
        </div>
      ) : null}

      {status === 'loaded' ? (
        <>
          <div className="chart-row">
            <div className="chart-panel">
              <h3>Commits over time</h3>
              <BarList items={byDay} emptyLabel="No commits in the selected range." />
            </div>
            <div className="chart-panel">
              <h3>Commits by developer</h3>
              <BarList items={byAuthor} emptyLabel="No commits in the selected range." />
            </div>
            <div className="chart-panel">
              <h3>Summary</h3>
              <div className="metric-row">
                <div className="mini-metric">
                  <h3>Commits</h3>
                  <p>{commits.length}</p>
                </div>
                <div className="mini-metric">
                  <h3>Contributors</h3>
                  <p>{contributors}</p>
                </div>
                <div className="mini-metric">
                  <h3>Active days</h3>
                  <p>{activeDays}</p>
                </div>
              </div>
            </div>
          </div>

          <h3 className="table-heading">Recent commits</h3>
          {recent.length === 0 ? (
            <EmptyState
              title="No recent commits"
              message="No commits fall within the selected date range."
            />
          ) : (
            <div className="table-wrap">
              <table>
                <caption className="sr-only">Recent commits</caption>
                <thead>
                  <tr>
                    <th>Commit</th>
                    <th>Message</th>
                    <th>Author</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((commit) => (
                    <tr key={commit.hash}>
                      <td>
                        {commit.webUrl ? (
                          <button
                            type="button"
                            className="link-button"
                            onClick={() => void openLink(commit.webUrl)}
                          >
                            <code>{commit.shortHash}</code>
                          </button>
                        ) : (
                          <code>{commit.shortHash}</code>
                        )}
                      </td>
                      <td>{commit.message || '—'}</td>
                      <td>{commit.author}</td>
                      <td>{formatDate(commit.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}
    </SectionCard>
  );
}
