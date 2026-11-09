/* eslint-disable react-hooks/set-state-in-effect */
// =============================================================
// FILE: frontend/src/pages/SavedSearches.jsx
// =============================================================

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function SavedSearches() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const r = await api.get('/saved-searches');
      setItems(r.data.data || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function remove(id) {
    if (!confirm('Delete this saved search?')) return;
    try {
      await api.delete(`/saved-searches/${id}`);
      await load();
    } catch (e) { alert(e.message); }
  }

  function buildQuery(filters) {
    const p = new URLSearchParams();
    Object.entries(filters || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') p.set(k, v);
    });
    return p.toString();
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-4xl font-extrabold text-zinc-900">Saved searches</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Re-run any of your saved filter sets in one click.
      </p>

      {error && (
        <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
      )}

      {!loading && items.length === 0 && (
        <div className="mt-10 rounded-lg border border-zinc-200 bg-white p-12 text-center">
          <p className="text-sm text-zinc-500">No saved searches yet.</p>
          <Link to="/vehicles" className="mt-4 inline-block text-sm font-semibold text-brand-500 hover:text-brand-hover">
            Start browsing →
          </Link>
        </div>
      )}

      {items.length > 0 && (
        <ul className="mt-8 space-y-3">
          {items.map((s) => (
            <li key={s._id} className="rounded-xl border border-zinc-200 bg-white p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold text-zinc-900">{s.name}</p>
                <p className="mt-1 text-xs text-zinc-500 font-mono truncate">
                  {Object.entries(s.filters || {}).map(([k, v]) => `${k}=${v}`).join(' · ') || 'No filters'}
                </p>
              </div>
              <div className="flex gap-4">
                <Link
                  to={`/vehicles?${buildQuery(s.filters)}`}
                  className="text-xs font-semibold text-brand-500 hover:text-brand-hover uppercase tracking-wider"
                >
                  Run
                </Link>
                <button
                  onClick={() => remove(s._id)}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 uppercase tracking-wider"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// =============================================================
// END OF FILE: frontend/src/pages/SavedSearches.jsx
// =============================================================