export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="error-state" role="alert">
      <strong>Unable to load the dashboard</strong>
      <p>{message}</p>
      <button type="button" className="refresh-button" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}
