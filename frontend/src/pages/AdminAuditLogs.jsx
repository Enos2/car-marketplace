// =============================================================
// FILE: frontend/src/pages/AdminAuditLogs.jsx
// =============================================================

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function AdminAuditLogs() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.get('/admin/audit-logs', { params: { limit: 100 } })
      .then((r) => { if (!cancelled) setItems(r.data.data || []); })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <Link to="/admin" className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 uppercase tracking-wider">
        ← Admin
      </Link>
      <h1 className="mt-2 text-3xl font-extrabold text-zinc-900">Audit log</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Every privileged action, in order.
      </p>

      {loading && <p className="mt-8 text-sm text-zinc-500">Loading…</p>}
      {error && (
        <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
      )}

      {items.length > 0 && (
        <div className="mt-8 overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left font-semibold px-5 py-3">When</th>
                <th className="text-left font-semibold px-5 py-3">Actor</th>
                <th className="text-left font-semibold px-5 py-3">Action</th>
                <th className="text-left font-semibold px-5 py-3">Target</th>
              </tr>
            </thead>
            <tbody>
              {items.map((l) => (
                <tr key={l._id} className="border-t border-zinc-100">
                  <td className="px-5 py-3 text-xs text-zinc-500 whitespace-nowrap">
                    {new Date(l.createdAt).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-zinc-700">
                    {l.actor?.name || '—'}
                    <span className="text-xs text-zinc-400 block">{l.actor?.email}</span>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-zinc-900">{l.action}</td>
                  <td className="px-5 py-3 text-zinc-500 text-xs">
                    {l.targetType}
                    {l.targetId ? ` · ${String(l.targetId).slice(-6)}` : ''}
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

// =============================================================
// END OF FILE: frontend/src/pages/AdminAuditLogs.jsx
// =============================================================