import { EmptyState } from './EmptyState';
import { SectionCard } from './SectionCard';
import { useDashboardData } from '../state/DashboardData';
import { pipelineSummary } from '../util/pipelineStats';
import { openLink } from '../util/openLink';

function formatDate(value: string): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) {
    return '—';
  }
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder === 0 ? `${minutes}m` : `${minutes}m ${remainder}s`;
}

export function PipelineTable() {
  const { status, runs, message, retryable, reload } = useDashboardData().pipelines;
  const summary = pipelineSummary(runs);

  return (
    <SectionCard
      id="pipeline-health"
      title="Pipeline Health"
      description="Build success, failures, duration, and the branch or commit that triggered each run."
    >
      <div className="metric-row">
        <article className="mini-metric">
          <h3>Success %</h3>
          <p>{summary.successPercent === null ? '—' : `${summary.successPercent}%`}</p>
        </article>
        <article className="mini-metric">
          <h3>Failed %</h3>
          <p>{summary.failedPercent === null ? '—' : `${summary.failedPercent}%`}</p>
        </article>
      </div>

      {status === 'needs-repo' ? (
        <EmptyState title="Select a repository" message="Choose a repository to load pipeline runs." />
      ) : null}
      {status === 'loading' ? <div className="skeleton section-skeleton" aria-label="Loading pipelines" /> : null}
      {status === 'error' || status === 'partial' ? (
        <div className="banner banner-warning" role="status">
          <span>{message ?? 'Unable to load pipelines.'}</span>
          {retryable ? (
            <button type="button" className="refresh-button" onClick={reload}>
              Retry
            </button>
          ) : null}
        </div>
      ) : null}
      {(status === 'loaded' || status === 'partial') && runs.length === 0 ? (
        <EmptyState
          title="No pipeline runs"
          message="No Bitbucket pipeline runs were found in the selected date range."
        />
      ) : null}
      {(status === 'loaded' || status === 'partial') && runs.length > 0 ? (
        <div className="table-wrap">
          <table>
            <caption className="sr-only">Recent pipeline runs</caption>
            <thead>
              <tr>
                <th>Build</th>
                <th>Repository</th>
                <th>Branch</th>
                <th>Status</th>
                <th>Trigger</th>
                <th>Duration</th>
                <th>Started</th>
              </tr>
            </thead>
            <tbody>
              {runs.slice(0, 15).map((run) => (
                <tr key={`${run.repositoryName ?? ''}:${run.uuid}`}>
                  <td>
                    {run.webUrl ? (
                      <button type="button" className="link-button" onClick={() => void openLink(run.webUrl)}>
                        {run.buildNumber === null ? run.uuid : `#${run.buildNumber}`}
                      </button>
                    ) : run.buildNumber === null ? (
                      run.uuid
                    ) : (
                      `#${run.buildNumber}`
                    )}
                  </td>
                  <td>{run.repositoryName ?? '—'}</td>
                  <td>{run.branch || (run.commitHash ? run.commitHash.slice(0, 7) : '—')}</td>
                  <td>{run.status.replace(/_/g, ' ')}</td>
                  <td>{run.trigger || '—'}</td>
                  <td>{formatDuration(run.buildSeconds)}</td>
                  <td>{formatDate(run.createdOn)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </SectionCard>
  );
}
