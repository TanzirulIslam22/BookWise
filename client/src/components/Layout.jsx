import { NavLink, Outlet, useNavigate } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard', testId: 'nav-dashboard' },
  { to: '/members', label: 'Members', testId: 'nav-members' },
  { to: '/books', label: 'Book Catalog', testId: 'nav-books' },
  { to: '/borrow', label: 'Issue / Return', testId: 'nav-borrow' },
  { to: '/fines', label: 'Fines', testId: 'nav-fines' },
  { to: '/audit', label: 'Audit History', testId: 'nav-audit' },
];

export default function Layout() {
  const navigate = useNavigate();
  const user = sessionStorage.getItem('librarianUser') || 'librarian';

  function handleLogout() {
    sessionStorage.removeItem('librarianAuthed');
    sessionStorage.removeItem('librarianUser');
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen lg:flex">
      <aside className="bg-brand-900 text-white lg:min-h-screen lg:w-60 lg:shrink-0 lg:flex lg:flex-col">
        <div className="p-5">
          <h1 className="text-lg font-bold" data-testid="app-title">
            Smart Library
          </h1>
          <p className="mt-1 text-xs text-brand-100">Fine Management System</p>
        </div>
        <nav className="flex flex-wrap gap-1 px-3 pb-4 lg:flex-col">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              data-testid={link.testId}
              end={link.to === '/'}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm transition ${
                  isActive ? 'bg-brand-600 font-medium text-white' : 'text-brand-100 hover:bg-brand-700'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto border-t border-brand-700 p-4">
          <p className="text-xs text-brand-100">
            Signed in as <span className="font-semibold text-white">{user}</span>
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 w-full rounded-lg border border-brand-600 px-3 py-1.5 text-xs text-brand-100 transition hover:bg-brand-700"
            data-testid="btn-logout"
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
