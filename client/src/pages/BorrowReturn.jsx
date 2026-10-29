import { useCallback, useEffect, useRef, useState } from 'react';
import { memberApi, bookApi, borrowingApi, errorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Spinner, EmptyState, ErrorAlert } from '../components/Status';
import { formatDate, isOverdue } from '../utils/formatDate';

export default function BorrowReturn() {
  const { notify } = useToast();
  const [members, setMembers] = useState([]);
  const [books, setBooks] = useState([]);
  const [records, setRecords] = useState([]);
  const [returned, setReturned] = useState([]);
  const [memberId, setMemberId] = useState('');
  const [bookId, setBookId] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const initializedRef = useRef(false);

  // Full-page spinner only on the FIRST load. Later refreshes keep the page
  // visible (and the forms usable) and just show a subtle "Refreshing…" hint.
  const load = useCallback(() => {
    if (initializedRef.current) setRefreshing(true);
    else setLoading(true);
    Promise.all([
      memberApi.list(),
      bookApi.list(),
      borrowingApi.list({ status: 'active' }),
      borrowingApi.list({ status: 'returned' }),
    ])
      .then(([m, b, r, ret]) => {
        setMembers(m.data.data);
        setBooks(b.data.data);
        setRecords(r.data.data);
        setReturned(ret.data.data);
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => {
        initializedRef.current = true;
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleIssue(event) {
    event.preventDefault();
    if (!memberId || !bookId) {
      setFormError('Select both a member and a book.');
      return;
    }
    setFormError('');
    setIssuing(true);
    try {
      const res = await borrowingApi.issue({ memberId, bookId });
      notify(res.data.message);
      setMemberId('');
      setBookId('');
      load();
    } catch (err) {
      const msg = errorMessage(err);
      setFormError(msg);
      notify(msg, 'error');
    } finally {
      setIssuing(false);
    }
  }

  async function handleReturn(recordId) {
    try {
      const res = await borrowingApi.returnBook(recordId);
      notify(res.data.message);
      load();
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  }

  if (loading) return <Spinner />;

  const now = Date.now();
  const recentReturns = returned.slice(0, 10);

  return (
    <div data-testid="page-borrow">
      <div className="mb-1 flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-bold text-brand-900">Issue &amp; Return Books</h2>
        {refreshing ? (
          <span className="text-xs text-slate-400" data-testid="refreshing-hint">
            Refreshing…
          </span>
        ) : null}
      </div>
      <p className="mb-6 text-sm text-slate-500">
        Issue an available book to a member, then process returns here.
      </p>
      <ErrorAlert message={error} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-1">
          <h3 className="mb-4 font-semibold text-brand-900">Issue a Book</h3>
          <ErrorAlert message={formError} />
          <form onSubmit={handleIssue} data-testid="issue-form" className="space-y-3">
            <div>
              <label className="label" htmlFor="memberSelect">Member</label>
              <select
                id="memberSelect"
                className="input"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                data-testid="select-issue-member"
              >
                <option value="">Choose a member…</option>
                {members.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.memberId} — {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="bookSelect">Book</label>
              <select
                id="bookSelect"
                className="input"
                value={bookId}
                onChange={(e) => setBookId(e.target.value)}
                data-testid="select-issue-book"
              >
                <option value="">Choose a book…</option>
                {books.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.title} — {b.availableCopies} available
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="btn w-full"
              disabled={issuing}
              data-testid="btn-issue-book"
            >
              {issuing ? 'Issuing…' : 'Issue Book'}
            </button>
            <p className="text-xs text-slate-400">
              Students may borrow up to 3 books, faculty up to 5. Loan period: 14 days.
            </p>
          </form>
        </div>

        <div className="card lg:col-span-2">
          <h3 className="mb-4 font-semibold text-brand-900">Active Borrowing Records</h3>
          {records.length === 0 ? (
            <EmptyState message="No active borrows. Issue a book to get started." />
          ) : (
            <div className="overflow-x-auto" data-testid="borrow-table">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="py-2 pr-4">Member</th>
                    <th className="py-2 pr-4">Book</th>
                    <th className="py-2 pr-4">Borrowed</th>
                    <th className="py-2 pr-4">Due Date</th>
                    <th className="py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r._id} className="border-b border-slate-100" data-testid="borrow-row">
                      <td className="py-2 pr-4" data-testid="borrow-member">
                        {r.memberId?.name || r.memberId}
                      </td>
                      <td className="py-2 pr-4" data-testid="borrow-book">
                        {r.bookId?.title || r.bookId}
                      </td>
                      <td className="py-2 pr-4">{formatDate(r.borrowedAt)}</td>
                      <td className="py-2 pr-4" data-testid="due-date-cell">
                        <span className="flex flex-wrap items-center gap-2">
                          {formatDate(r.dueDate)}
                          {isOverdue(r.dueDate, now) ? (
                            <span
                              className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700"
                              data-testid="overdue-badge"
                            >
                              Overdue
                            </span>
                          ) : null}
                        </span>
                      </td>
                      <td className="py-2">
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => handleReturn(r._id)}
                          data-testid="btn-return-book"
                        >
                          Return
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="card mt-6">
        <h3 className="mb-4 font-semibold text-brand-900">Recently Returned</h3>
        {recentReturns.length === 0 ? (
          <EmptyState message="No returned books yet." />
        ) : (
          <div className="overflow-x-auto" data-testid="returned-table">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-2 pr-4">Member</th>
                  <th className="py-2 pr-4">Book</th>
                  <th className="py-2 pr-4">Returned</th>
                  <th className="py-2">Fine (BDT)</th>
                </tr>
              </thead>
              <tbody>
                {recentReturns.map((r) => (
                  <tr key={r._id} className="border-b border-slate-100" data-testid="returned-row">
                    <td className="py-2 pr-4">{r.memberId?.name || r.memberId}</td>
                    <td className="py-2 pr-4">{r.bookId?.title || r.bookId}</td>
                    <td className="py-2 pr-4">{formatDate(r.returnedAt)}</td>
                    <td className="py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          r.fineAmount > 0
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {r.fineAmount}
                      </span>
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
