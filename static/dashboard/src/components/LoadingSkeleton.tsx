export function LoadingSkeleton() {
  return (
    <div className="app-shell" aria-busy="true" aria-label="Loading dashboard">
      <div className="skeleton hero-skeleton" />
      <div className="skeleton filter-skeleton" />
      <div className="kpi-grid">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="skeleton kpi-skeleton" />
        ))}
      </div>
      <div className="skeleton section-skeleton" />
      <div className="skeleton section-skeleton" />
    </div>
  );
}
