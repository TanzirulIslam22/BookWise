export function Spinner() {
  return (
    <div className="flex items-center justify-center py-10" data-testid="loading">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
      <span className="ml-3 text-sm text-slate-500">Loading…</span>
    </div>
  );
}

export function EmptyState({ message = 'Nothing here yet.' }) {
  return (
    <div
      className="rounded-lg border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500"
      data-testid="empty-state"
    >
      {message}
    </div>
  );
}

export function ErrorAlert({ message }) {
  if (!message) return null;
  return (
    <div
      className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
      data-testid="error-alert"
      role="alert"
    >
      {message}
    </div>
  );
}
