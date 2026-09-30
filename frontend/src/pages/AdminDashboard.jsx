// =============================================================
// FILE: frontend/src/pages/AdminDashboard.jsx
// =============================================================
// Purpose:
//   Admin overview. Stats + links to queues.
// =============================================================

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Reveal from '../components/Reveal';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/admin/dashboard')
      .then((r) => { if (!cancelled) setStats(r.data.data); })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <Reveal>
        <h1 className="text-3xl font-extrabold text-zinc-900">Admin</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Moderation, users, reports, and audit.
        </p>
      </Reveal>

      {error && (
        <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading && <p className="mt-8 text-sm text-zinc-500">Loading…</p>}

      {stats && (
        <>
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="Pending review" value={stats.pending} href="/admin/listings?status=pending" accent />
            <Stat label="Published" value={stats.published} href="/admin/listings?status=published" />
            <Stat label="Sold" value={stats.sold} href="/admin/listings?status=sold" />
            <Stat label="Featured" value={stats.featured} href="/admin/listings?featured=true" />
            <Stat label="Active users" value={stats.users} href="/admin/users" />
            <Stat label="Open reports" value={stats.openReports} href="/admin/reports" accent={stats.openReports > 0} />
            <Stat label="New enquiries" value={stats.newInquiries} />
          </div>

          <div className="mt-10 grid md:grid-cols-4 gap-4">
            <Tile to="/admin/listings" title="Listings" desc="Moderate, approve, reject, feature" />
            <Tile to="/admin/viewings" title="Viewings" desc="Receipt review tracking" />
            <Tile to="/admin/users" title="Users" desc="Suspend, restrict, verify" />
            <Tile to="/admin/reports" title="Reports" desc="Buyer-submitted flags" />
            <Tile to="/admin/audit-logs" title="Audit log" desc="Every privileged action" />
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, href, accent }) {
  const inner = (
    <div className={`rounded-xl border bg-white p-5 transition-colors hover:border-zinc-400 ${
      accent ? 'border-brand-500' : 'border-zinc-200'
    }`}>
      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{label}</p>
      <p className={`mt-2 text-2xl font-extrabold ${accent ? 'text-brand-500' : 'text-zinc-900'}`}>
        {typeof value === 'number' ? value.toLocaleString('en-KE') : value}
      </p>
    </div>
  );
  return href ? <Link to={href}>{inner}</Link> : inner;
}

function Tile({ to, title, desc }) {
  return (
    <Link to={to} className="rounded-xl border border-zinc-200 bg-white p-5 hover:border-brand-500 transition-colors">
      <p className="font-bold text-zinc-900">{title}</p>
      <p className="mt-1 text-sm text-zinc-500">{desc}</p>
    </Link>
  );
}

// =============================================================
// END OF FILE: frontend/src/pages/AdminDashboard.jsx
// =============================================================