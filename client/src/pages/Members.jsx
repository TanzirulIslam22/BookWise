import { useCallback, useEffect, useState } from 'react';
import { memberApi, errorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Spinner, EmptyState, ErrorAlert } from '../components/Status';
import useDebouncedValue from '../hooks/useDebouncedValue';

const initialForm = { memberId: '', name: '', email: '', role: 'Student' };

export default function Members() {
  const { notify } = useToast();
  const [members, setMembers] = useState([]);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  // Wait until typing pauses before hitting the API (avoids per-keystroke
  // requests and table flicker).
  const debouncedQuery = useDebouncedValue(query, 300);

  const load = useCallback(() => {
    setLoading(true);
    memberApi
      .list({ q: debouncedQuery, role })
      .then((res) => setMembers(res.data.data))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [debouncedQuery, role]);

  useEffect(() => {
    load();
  }, [load]);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.memberId.trim() || !form.name.trim()) {
      setFormError('Member ID and name are required.');
      return;
    }
    setFormError('');
    setSaving(true);
    try {
      await memberApi.create(form);
      notify(`Member ${form.name} registered successfully.`);
      setForm(initialForm);
      load();
    } catch (err) {
      const msg = errorMessage(err);
      setFormError(msg);
      notify(msg, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div data-testid="page-members">
      <h2 className="mb-1 text-2xl font-bold text-brand-900">Member Management</h2>
      <p className="mb-6 text-sm text-slate-500">
        Register students, faculty and librarians. Duplicate member IDs are rejected.
      </p>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-1">
          <h3 className="mb-4 font-semibold text-brand-900">Register Member</h3>
          <ErrorAlert message={formError} />
          <form onSubmit={handleSubmit} data-testid="member-form" className="space-y-3">
            <div>
              <label className="label" htmlFor="memberId">Member ID</label>
              <input
                id="memberId"
                name="memberId"
                className="input"
                placeholder="CSE-2203001"
                value={form.memberId}
                onChange={handleChange}
                data-testid="input-member-id"
              />
            </div>
            <div>
              <label className="label" htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                className="input"
                placeholder="Tanvir Ahmed"
                value={form.name}
                onChange={handleChange}
                data-testid="input-member-name"
              />
            </div>
            <div>
              <label className="label" htmlFor="email">Email (optional)</label>
              <input
                id="email"
                name="email"
                type="email"
                className="input"
                placeholder="tanvir@ruet.ac.bd"
                value={form.email}
                onChange={handleChange}
                data-testid="input-member-email"
              />
            </div>
            <div>
              <label className="label" htmlFor="role">Role</label>
              <select
                id="role"
                name="role"
                className="input"
                value={form.role}
                onChange={handleChange}
                data-testid="select-member-role"
              >
                <option value="Student">Student</option>
                <option value="Faculty">Faculty</option>
                <option value="Librarian">Librarian</option>
              </select>
            </div>
            <button type="submit" className="btn w-full" disabled={saving} data-testid="btn-add-member">
              {saving ? 'Savingâ€¦' : 'Add Member'}
            </button>
          </form>
        </div>

        <div className="card lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <input
              className="input max-w-xs"
              placeholder="Search name, ID or emailâ€¦"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              data-testid="input-member-search"
            />
            <select
              className="input max-w-[10rem]"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              data-testid="select-filter-role"
            >
              <option value="">All roles</option>
              <option value="Student">Student</option>
              <option value="Faculty">Faculty</option>
              <option value="Librarian">Librarian</option>
            </select>
          </div>
          {loading ? (
            <Spinner />
          ) : members.length === 0 ? (
            <EmptyState message="No members found. Register one using the form." />
          ) : (
            <div className="overflow-x-auto" data-testid="members-table">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="py-2 pr-4">Member ID</th>
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Role</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2">Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m._id} className="border-b border-slate-100" data-testid="member-row">
                      <td className="py-2 pr-4 font-medium" data-testid="member-id-cell">
                        {m.memberId}
                      </td>
                      <td className="py-2 pr-4">{m.name}</td>
                      <td className="py-2 pr-4">
                        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">
                          {m.role}
                        </span>
                      </td>
                      <td className="py-2 pr-4">{m.email || 'â€”'}</td>
                      <td className="py-2 text-slate-500">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
