import { EmptyState } from './EmptyState';
import { SectionCard } from './SectionCard';

export function PipelineTable() {
  return (
    <SectionCard
      id="pipeline-health"
      title="Pipeline Health"
      description="Build success, failures, duration, and the branch or commit that triggered each run."
    >
      <div className="metric-row">
        <article className="mini-metric">
          <h3>Success %</h3>
          <p>—</p>
        </article>
        <article className="mini-metric">
          <h3>Failed %</h3>
          <p>—</p>
        </article>
      </div>
      <EmptyState
        title="No pipeline runs"
        message="Pipeline health will appear once Bitbucket Pipelines data is available."
      />
    </SectionCard>
  );
}
