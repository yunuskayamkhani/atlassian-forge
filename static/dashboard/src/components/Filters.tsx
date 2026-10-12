import { useFilters } from '../state/FilterContext';
import type { DateRangePreset, PrStatusFilter } from '../types/filters';
import type { ProjectMapping, Repository } from '../types/models';
import { clientSprintLabel } from '../util/clientSprint';

function formatUpdated(value: string | null): string {
  if (!value) {
    return 'Not yet loaded';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Not yet loaded';
  }

  return date.toLocaleString();
}

export function Filters({
  lastUpdated,
  isRefreshing,
  onRefresh,
  mappings = [],
  repositories = []
}: {
  lastUpdated: string | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  mappings?: ProjectMapping[];
  repositories?: Repository[];
}) {
  const { filters, updateFilters } = useFilters();
  const enabled = mappings.filter((mapping) => mapping.enabled);
  const selectedMapping = enabled.find((mapping) => mapping.projectId === filters.projectId);
  const sprintLabel = clientSprintLabel(selectedMapping);

  return (
    <section className="filter-bar" aria-label="Dashboard filters">
      <div className="filter-row">
        <label className="filter-field">
          <span>Jira project</span>
          <select
            value={filters.projectId ?? ''}
            onChange={(event) => {
              const mapping = enabled.find((item) => item.projectId === event.target.value);
              updateFilters({
                projectId: mapping?.projectId ?? null,
                workspaceId: mapping?.workspaceId ?? null,
                repositoryId:
                  mapping && mapping.repositories.length === 1 ? mapping.repositories[0].id : 'ALL'
              });
            }}
            aria-label="Jira project"
          >
            <option value="">Select project</option>
            {enabled.map((mapping) => (
              <option key={mapping.projectId} value={mapping.projectId}>
                {mapping.projectKey} — {mapping.projectName}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-field">
          <span>Repository</span>
          <select
            value={filters.repositoryId}
            onChange={(event) => updateFilters({ repositoryId: event.target.value })}
            aria-label="Repository"
            disabled={!filters.projectId}
          >
            <option value="ALL">All</option>
            {repositories.map((repository) => (
              <option key={repository.id} value={repository.id}>
                {repository.name}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-field">
          <span>Date range</span>
          <select
            value={filters.dateRange}
            onChange={(event) => updateFilters({ dateRange: event.target.value as DateRangePreset })}
            aria-label="Date range"
          >
            <option value="7d">7d</option>
            <option value="30d">30d</option>
            <option value="90d">90d</option>
            <option value="custom">Custom</option>
          </select>
        </label>

        {filters.dateRange === 'custom' ? (
          <>
            <label className="filter-field">
              <span>From</span>
              <input
                type="date"
                value={filters.customFrom ?? ''}
                onChange={(event) => updateFilters({ customFrom: event.target.value })}
                aria-label="Custom start date"
              />
            </label>
            <label className="filter-field">
              <span>To</span>
              <input
                type="date"
                value={filters.customTo ?? ''}
                onChange={(event) => updateFilters({ customTo: event.target.value })}
                aria-label="Custom end date"
              />
            </label>
          </>
        ) : null}

        <label className="filter-field">
          <span>PR status</span>
          <select
            value={filters.prStatus}
            onChange={(event) => updateFilters({ prStatus: event.target.value as PrStatusFilter })}
            aria-label="Pull request status"
          >
            <option value="ALL">All</option>
            <option value="OPEN">Open</option>
            <option value="MERGED">Merged</option>
            <option value="DECLINED">Declined</option>
            <option value="SUPERSEDED">Superseded</option>
          </select>
        </label>

        <button type="button" className="refresh-button" onClick={onRefresh} disabled={isRefreshing}>
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {sprintLabel ? <p className="sprint-banner">{sprintLabel}</p> : null}
      <p className="last-updated">Last updated: {formatUpdated(lastUpdated)}</p>
    </section>
  );
}
