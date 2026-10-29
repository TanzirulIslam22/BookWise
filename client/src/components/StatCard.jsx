export default function StatCard({ label, value, hint }) {
  const testId = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return (
    <div className="card" data-testid="stat-card">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-brand-900" data-testid={`stat-${testId}`}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}
