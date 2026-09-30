/* eslint-disable react-hooks/set-state-in-effect */
// =============================================================
// FILE: frontend/src/pages/AdminUsers.jsx
// =============================================================
// Purpose:
//   User list. Suspend / reactivate. Filter by role and status.
// =============================================================

import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';

const ROLES = ['buyer', 'seller', 'admin'];

export default function AdminUsers() {
  const [params, setParams] = useSearchParams();
  const role = params.get('role') || '';
  const status = params.get('status') || '';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const q = { limit: 50 };
      if (role) q.role = role;
      if (status) q.status = status;
      const r = await api.get('/admin/users', { params: q });
      setItems(r.data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [role, status]);

  function setFilter(next) {
    const p = new URLSearchParams(params);
    if (next.role !== undefined) {
      if (next.role) p.set('role', next.role); else p.delete('role');
    }
    if (next.status !== undefined) {
      if (next.status) p.set('status', next.status); else p.delete('status');
    }
    setParams(p);
  }

  async function setStatus_(id, next) {
    const reason = next === 'suspended' ? (prompt('Reason for suspension?') || '') : '';
    setBusyId(id);
    try {
      await api.patch(`/admin/users/${id}/status`, { status: next, reason });
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
      <h1 className="mt-2 text-3xl font-extrabold text-zinc-900">Users</h1>

      <div className="mt-6 flex flex-wrap gap-2">
        <Chip active={!role && !status} onClick={() => setFilter({ role: '', status: '' })}>All</Chip>
        {ROLES.map((r) => (
          <Chip key={r} active={role === r} onClick={() => setFilter({ role: r })}>{r}</Chip>
        ))}
        <Chip active={status === 'suspended'} onClick={() => setFilter({ status: 'suspended' })}>Suspended</Chip>
      </div>

      {loading && <p className="mt-8 text-sm text-zinc-500">Loading…</p>}
      {error && (
        <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
      )}

      {items.length > 0 && (
        <div className="mt-8 overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left font-semibold px-5 py-3">Name</th>
                <th className="text-left font-semibold px-5 py-3">Email</th>
                <th className="text-left font-semibold px-5 py-3">Role</th>
                <th className="text-left font-semibold px-5 py-3">Status</th>
                <th className="text-right font-semibold px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u._id} className="border-t border-zinc-100">
                  <td className="px-5 py-4 font-medium text-zinc-900">{u.name}</td>
                  <td className="px-5 py-4 text-zinc-600">{u.email}</td>
                  <td className="px-5 py-4">
                    <span className="text-xs font-semibold uppercase tracking-wider rounded px-2 py-1 bg-zinc-100 text-zinc-700">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-semibold uppercase tracking-wider rounded px-2 py-1 ${
                      u.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    {u.status === 'active' ? (
                      <button
                        onClick={() => setStatus_(u._id, 'suspended')}
                        disabled={busyId === u._id}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 uppercase tracking-wider disabled:opacity-50"
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => setStatus_(u._id, 'active')}
                        disabled={busyId === u._id}
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 uppercase tracking-wider disabled:opacity-50"
                      >
                        Reactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
// END OF FILE: frontend/src/pages/AdminUsers.jsx
// =============================================================