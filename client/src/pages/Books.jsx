import { useCallback, useEffect, useState } from 'react';
import { bookApi, errorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Spinner, EmptyState, ErrorAlert } from '../components/Status';
import useDebouncedValue from '../hooks/useDebouncedValue';

const initialForm = { isbn: '', title: '', author: '', totalCopies: 1 };

export default function Books() {
  const { notify } = useToast();
  const [books, setBooks] = useState([]);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  // Debounce so each keystroke does not fire a search request.
  const debouncedQuery = useDebouncedValue(query, 300);

  const load = useCallback(() => {
    setLoading(true);
    bookApi
      .list({ q: debouncedQuery })
      .then((res) => setBooks(res.data.data))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  useEffect(() => {
    load();
  }, [load]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm({ ...form, [name]: name === 'totalCopies' ? Number(value) : value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.isbn.trim() || !form.title.trim() || !form.author.trim()) {
      setFormError('ISBN, title and author are required.');
      return;
    }
    if (!Number.isInteger(form.totalCopies) || form.totalCopies < 1) {
      setFormError('Total copies must be a whole number of at least 1.');
      return;
    }
    setFormError('');
    setSaving(true);
    try {
      await bookApi.create(form);
      notify(`Book "${form.title}" added to the catalog.`);
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
    <div data-testid="page-books">
      <h2 className="mb-1 text-2xl font-bold text-brand-900">Book Catalog</h2>
      <p className="mb-6 text-sm text-slate-500">
        Add books and search the catalog by title, author or ISBN.
      </p>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-1">
          <h3 className="mb-4 font-semibold text-brand-900">Add Book</h3>
          <ErrorAlert message={formError} />
          <form onSubmit={handleSubmit} data-testid="book-form" className="space-y-3">
            <div>
              <label className="label" htmlFor="isbn">ISBN</label>
              <input
                id="isbn"
                name="isbn"
                className="input"
                placeholder="9780134685991"
                value={form.isbn}
                onChange={handleChange}
                data-testid="input-book-isbn"
              />
            </div>
            <div>
              <label className="label" htmlFor="title">Title</label>
              <input
                id="title"
                name="title"
                className="input"
                placeholder="The Pragmatic Programmer"
                value={form.title}
                onChange={handleChange}
                data-testid="input-book-title"
              />
            </div>
            <div>
              <label className="label" htmlFor="author">Author</label>
              <input
                id="author"
                name="author"
                className="input"
                placeholder="Hunt and Thomas"
                value={form.author}
                onChange={handleChange}
                data-testid="input-book-author"
              />
            </div>
            <div>
              <label className="label" htmlFor="totalCopies">Total Copies</label>
              <input
                id="totalCopies"
                name="totalCopies"
                type="number"
                min="1"
                className="input"
                value={form.totalCopies}
                onChange={handleChange}
                data-testid="input-book-copies"
              />
            </div>
            <button type="submit" className="btn w-full" disabled={saving} data-testid="btn-add-book">
              {saving ? 'Saving…' : 'Add Book'}
            </button>
          </form>
        </div>

        <div className="card lg:col-span-2">
          <div className="mb-4">
            <input
              className="input max-w-sm"
              placeholder="Search title, author or ISBN…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              data-testid="input-book-search"
            />
          </div>
          {loading ? (
            <Spinner />
          ) : books.length === 0 ? (
            <EmptyState message="No books found. Add one using the form." />
          ) : (
            <div className="overflow-x-auto" data-testid="books-table">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="py-2 pr-4">ISBN</th>
                    <th className="py-2 pr-4">Title</th>
                    <th className="py-2 pr-4">Author</th>
                    <th className="py-2 pr-4">Total</th>
                    <th className="py-2">Available</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((b) => (
                    <tr key={b._id} className="border-b border-slate-100" data-testid="book-row">
                      <td className="py-2 pr-4 font-mono text-xs">{b.isbn}</td>
                      <td className="py-2 pr-4 font-medium" data-testid="book-title-cell">
                        {b.title}
                      </td>
                      <td className="py-2 pr-4">{b.author}</td>
                      <td className="py-2 pr-4">{b.totalCopies}</td>
                      <td className="py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            b.availableCopies > 0
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                          data-testid="book-available"
                        >
                          {b.availableCopies}
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
    </div>
  );
}
