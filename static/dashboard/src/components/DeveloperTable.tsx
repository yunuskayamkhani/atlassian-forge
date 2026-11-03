import { EmptyState } from './EmptyState';
import { SectionCard } from './SectionCard';

export function DeveloperTable() {
  return (
    <SectionCard
      id="developer-activity"
      title="Developer Activity"
      description="Commits, pull requests opened, pull requests merged, and reviews. This is activity, not performance."
    >
      <div className="table-wrap">
        <table>
          <caption className="sr-only">Developer activity</caption>
          <thead>
            <tr>
              <th>Developer</th>
              <th>Commits</th>
              <th>PRs opened</th>
              <th>PRs merged</th>
              <th>Reviews</th>
            </tr>
          </thead>
        </table>
      </div>
      <EmptyState
        title="No developer activity"
        message="Activity totals will appear after commits and pull requests are loaded."
      />
    </SectionCard>
  );
}
