const KPI_CARDS = [
  { id: 'repositories', label: 'Repositories', hint: 'Repositories in the selected workspace.', ready: 'In the selected workspace' },
  { id: 'commits', label: 'Commits', hint: 'Commits in the selected date range.', ready: 'In the selected range' },
  { id: 'open-prs', label: 'Open PRs', hint: 'Pull requests currently open.', ready: 'Currently open' },
  { id: 'merged-prs', label: 'Merged PRs', hint: 'Pull requests merged (loaded set).', ready: 'In the loaded set' },
  { id: 'review-prs', label: 'PRs needing review', hint: 'Open pull requests with no reviewers assigned.', ready: 'Open, no reviewers' },
  { id: 'pipeline-success', label: 'Pipeline success %', hint: 'Successful pipelines divided by completed pipelines.', ready: 'In the selected range' },
  { id: 'failed-pipelines', label: 'Failed pipelines', hint: 'Pipeline runs that finished in a failed state.', ready: 'In the selected range' },
  { id: 'deployments', label: 'Deployments', hint: 'Deployments recorded in the selected date range.', ready: 'In the selected range' }
];

export type KpiMetrics = Partial<Record<string, number>>;

export function KPIGrid({ metrics = {} }: { metrics?: KpiMetrics }) {
  return (
    <section className="kpi-grid" aria-label="Summary metrics">
      {KPI_CARDS.map((card) => {
        const metric = metrics[card.id];
        const hasValue = metric !== undefined;
        const isPercent = card.id === 'pipeline-success';
        const value = hasValue ? `${metric}${isPercent ? '%' : ''}` : '—';
        const note = hasValue ? card.ready : 'Waiting for Bitbucket data';

        return (
          <article key={card.id} className="kpi-card">
            <h2>
              {card.label}
              <span className="metric-tip" title={card.hint} aria-label={card.hint}>
                i
              </span>
            </h2>
            <p className="kpi-value" aria-live="polite">
              {value}
            </p>
            <p className="kpi-note">{note}</p>
          </article>
        );
      })}
    </section>
  );
}
