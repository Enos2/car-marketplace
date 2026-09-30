/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
// =============================================================
// FILE: frontend/src/pages/AdminReports.jsx
// =============================================================
// Purpose:
//   Buyer-submitted reports on vehicles or users.
// =============================================================

import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';

const FILTERS = ['open', 'reviewing', 'resolved', 'dismissed'];

export default function AdminReports() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || 'open';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const q = { limit: 50 };
      if (status) q.status = status;
      const r = await api.get('/admin/reports', { params: q });
      setItems(r.data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [status]);

  function setFilter(s) {
    const p = new URLSearchParams(params);
    if (s) p.set('status', s); else p.delete('status');
    setParams(p);
  }

  async function resolve(id, next) {
    const notes = prompt(`Notes for marking ${next}? (optional)`) || '';
    setBusyId(id);
    try {
      await api.patch(`/admin/reports/${id}`, { status: next, notes });
      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <Link to="/admin" className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 uppercase tracking-wider">
        ← Admin
      </Link>
      <h1 className="mt-2 text-3xl font-extrabold text-zinc-900">Reports</h1>

      <div className="mt-6 flex flex-wrap gap-2">
        <Chip active={!status} onClick={() => setFilter('')}>All</Chip>
        {FILTERS.map((s) => (
          <Chip key={s} active={status === s} onClick={() => setFilter(s)}>{s}</Chip>
        ))}
      </div>

      {loading && <p className="mt-8 text-sm text-zinc-500">Loading…</p>}
      {error && (
        <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
      )}

      {!loading && items.length === 0 && (
        <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
          Nothing here.
        </div>
      )}

      <ul className="mt-8 space-y-3">
        {items.map((r) => (
          <li key={r._id} className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold uppercase tracking-wider rounded px-2 py-1 bg-zinc-100 text-zinc-700">
                    {r.targetType}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider rounded px-2 py-1 bg-amber-100 text-amber-800">
                    {r.reason}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">
                    {String(r.targetId).slice(-8)}
                  </span>
                </div>
                {r.details && (
                  <p className="mt-3 text-sm text-zinc-700 whitespace-pre-line">{r.details}</p>
                )}
                <p className="mt-2 text-xs text-zinc-400">
                  {new Date(r.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {r.status !== 'resolved' && (
                  <button
                    onClick={() => resolve(r._id, 'resolved')}
                    disabled={busyId === r._id}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 uppercase tracking-wider disabled:opacity-50"
                  >
                    Resolve
                  </button>
                )}
                {r.status !== 'dismissed' && (
                  <button
                    onClick={() => resolve(r._id, 'dismissed')}
                    disabled={busyId === r._id}
                    className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 uppercase tracking-wider disabled:opacity-50"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Chip({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
        active ? 'bg-brand-500 text-white' : 'border border-zinc-200 text-zinc-700 hover:border-zinc-400'
      }`}
    >
      {children}
    </button>
  );
}

// =============================================================
// END OF FILE: frontend/src/pages/AdminReports.jsx
// =============================================================