import { useEffect, useState } from 'react';
import { statsApi, errorMessage } from '../services/api';
import StatCard from '../components/StatCard';
import { Spinner, ErrorAlert } from '../components/Status';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    statsApi
      .overview()
      .then((res) => {
        if (active) setStats(res.data.data);
      })
      .catch((err) => {
        if (active) setError(errorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <Spinner />;

  return (
    <div data-testid="page-dashboard">
      <h2 className="mb-1 text-2xl font-bold text-brand-900">Dashboard</h2>
      <p className="mb-6 text-sm text-slate-500">Library overview at a glance.</p>
      <ErrorAlert message={error} />
      {stats ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Members" value={stats.totalMembers} />
          <StatCard label="Book Titles" value={stats.totalBooks} hint={`${stats.totalCopies} copies total`} />
          <StatCard label="Available Copies" value={stats.availableCopies} />
          <StatCard label="Active Borrows" value={stats.activeBorrows} />
          <StatCard label="Overdue Books" value={stats.overdueCount} />
          <StatCard
            label="Overdue Fine Estimate"
            value={`${stats.overdueFineEstimate} BDT`}
            hint="Live estimate for overdue books"
          />
          <StatCard label="Fines Collected" value={`${stats.totalFinesCollected} BDT`} />
        </div>
      ) : null}
    </div>
  );
}
