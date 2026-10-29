import { useEffect, useState } from 'react';
import { fineApi, errorMessage } from '../services/api';
import { Spinner, EmptyState, ErrorAlert } from '../components/Status';
import { formatDate } from '../utils/formatDate';

const POLICIES = [
  { role: 'Student', rule: '10 BDT per overdue day' },
  { role: 'Student (heavy)', rule: 'After day 7: 20 BDT per extra day' },
  { role: 'Faculty', rule: '0 BDT — always free' },
];

export default function Fines() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fineApi
      .overdue()
      .then((res) => setRows(res.data.data))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const total = rows.reduce((sum, r) => sum + r.fineAmount, 0);

  return (
    <div data-testid="page-fines">
      <h2 className="mb-1 text-2xl font-bold text-brand-900">Fine Management</h2>
      <p className="mb-6 text-sm text-slate-500">
        Live overdue fines in BDT. Fines are charged only when an overdue book is returned.
      </p>
      <ErrorAlert message={error} />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {POLICIES.map((p) => (
          <div className="card" key={p.role}>
            <p className="text-sm font-semibold text-brand-900">{p.role}</p>
            <p className="mt-1 text-sm text-slate-500">{p.rule}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-brand-900">Overdue Records</h3>
          <p className="text-sm text-slate-500" data-testid="fine-total">
            Total live fine: <span className="font-bold text-rose-600">{total} BDT</span>
          </p>
        </div>
        {loading ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <EmptyState message="No overdue books. All good!" />
        ) : (
          <div className="overflow-x-auto" data-testid="overdue-table">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-2 pr-4">Member</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Due Date</th>
                  <th className="py-2 pr-4">Overdue Days</th>
                  <th className="py-2">Fine (BDT)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.borrowRecordId} className="border-b border-slate-100" data-testid="overdue-row">
                    <td className="py-2 pr-4 font-medium">{r.memberName}</td>
                    <td className="py-2 pr-4">{r.role}</td>
                    <td className="py-2 pr-4">{formatDate(r.dueDate)}</td>
                    <td className="py-2 pr-4" data-testid="overdue-days">{r.overdueDays}</td>
                    <td className="py-2 font-bold text-rose-600" data-testid="overdue-fine">
                      {r.fineAmount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
