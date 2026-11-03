import type { DataSourceStatus } from '../types/status';

const STATUS_MARK: Record<DataSourceStatus['state'], string> = {
  loaded: '✓ loaded',
  unavailable: '⚠ unavailable',
  pending: '… pending'
};

export function SourceStatus({ sources }: { sources: DataSourceStatus[] }) {
  return (
    <ul className="source-status" aria-label="Data source status">
      {sources.map((source) => (
        <li key={source.id} data-state={source.state}>
          <span>{source.label}</span>
          <span>{STATUS_MARK[source.state]}</span>
        </li>
      ))}
    </ul>
  );
}
