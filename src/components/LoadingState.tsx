export function LoadingState({ label = 'Загрузка данных…' }: { label?: string }) {
  return (
    <div className="state-panel" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="state-panel state-empty">
      <span className="state-mark" aria-hidden="true">—</span>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="state-panel state-error" role="alert">
      <span className="state-mark" aria-hidden="true">!</span>
      <h2>Не удалось загрузить данные</h2>
      <p>{message}</p>
      {onRetry && <button className="button button-secondary" onClick={onRetry}>Повторить</button>}
    </div>
  );
}
