import { useCallback, useEffect, useState } from 'react';
import { auditApi, errorMessage } from '../services/api';
import { Spinner, EmptyState, ErrorAlert } from '../components/Status';

const EVENT_COLORS = {
  MEMBER_CREATED: 'bg-sky-50 text-sky-700',
  BOOK_ADDED: 'bg-violet-50 text-violet-700',
  BOOK_ISSUED: 'bg-amber-50 text-amber-700',
  BOOK_RETURNED: 'bg-emerald-50 text-emerald-700',
  FINE_CALCULATED: 'bg-rose-50 text-rose-700',
  OVERDUE_DETECTED: 'bg-orange-50 text-orange-700',
};

export default function Audit() {
  const [events, setEvents] = useState([]);
  const [eventType, setEventType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    auditApi
      .list({ eventType, limit: 200 })
      .then((res) => setEvents(res.data.data))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [eventType]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div data-testid="page-audit">
      <h2 className="mb-1 text-2xl font-bold text-brand-900">Audit History</h2>
      <p className="mb-6 text-sm text-slate-500">
        Persistent activity log of issuances, returns, fines and overdue events.
      </p>
      <ErrorAlert message={error} />

      <div className="card">
        <div className="mb-4">
          <select
            className="input max-w-xs"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            data-testid="select-audit-filter"
          >
            <option value="">All events</option>
            {Object.keys(EVENT_COLORS).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        {loading ? (
          <Spinner />
        ) : events.length === 0 ? (
          <EmptyState message="No audit events yet." />
        ) : (
          <ul className="divide-y divide-slate-100" data-testid="audit-list">
            {events.map((e) => (
              <li key={e._id} className="py-3" data-testid="audit-item">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      EVENT_COLORS[e.eventType] || 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {e.eventType}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(e.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-700">{e.message}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
