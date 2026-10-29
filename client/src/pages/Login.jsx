import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authApi, errorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';

/**
 * Login gate for the single librarian/admin operator.
 * Credentials are verified by the backend (ADMIN_USERNAME / ADMIN_PASSWORD);
 * on success a session flag is stored for this browser tab only.
 */
export default function Login() {
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await authApi.login({ username: username.trim(), password });
      sessionStorage.setItem('librarianAuthed', '1');
      sessionStorage.setItem('librarianUser', res.data.data.username);
      notify(res.data.message);
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err) {
      const msg = errorMessage(err);
      setError(msg);
      notify(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-900 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center text-white">
          <h1 className="text-2xl font-bold" data-testid="app-title">
            Smart Library
          </h1>
          <p className="mt-1 text-sm text-brand-100">Fine Management System</p>
        </div>
        <div className="card" data-testid="page-login">
          <h2 className="mb-1 text-lg font-semibold text-brand-900">Librarian Login</h2>
          <p className="mb-4 text-xs text-slate-500">
            Sign in to manage members, books, issues, returns and fines.
          </p>
          {error ? (
            <div
              className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              data-testid="error-alert"
              role="alert"
            >
              {error}
            </div>
          ) : null}
          <form onSubmit={handleSubmit} data-testid="login-form" className="space-y-3">
            <div>
              <label className="label" htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                className="input"
                autoComplete="username"
                placeholder="librarian"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                data-testid="input-username"
              />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                className="input"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="input-password"
              />
            </div>
            <button
              type="submit"
              className="btn w-full"
              disabled={submitting}
              data-testid="btn-login"
            >
              {submitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
        <p className="mt-4 text-center text-xs text-brand-100">
          Single-operator access gate — credentials come from the server environment.
        </p>
      </div>
    </div>
  );
}
