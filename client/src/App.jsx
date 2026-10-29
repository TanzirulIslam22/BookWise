import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Books from './pages/Books';
import BorrowReturn from './pages/BorrowReturn';
import Fines from './pages/Fines';
import Audit from './pages/Audit';
import { ToastProvider } from './context/ToastContext';

/** Redirects to /login unless this browser tab has signed in. */
function RequireAuth({ children }) {
  const authed = sessionStorage.getItem('librarianAuthed') === '1';
  const location = useLocation();
  if (!authed) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="/members" element={<Members />} />
          <Route path="/books" element={<Books />} />
          <Route path="/borrow" element={<BorrowReturn />} />
          <Route path="/fines" element={<Fines />} />
          <Route path="/audit" element={<Audit />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
}
