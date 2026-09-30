/* eslint-disable react-hooks/set-state-in-effect */
// =============================================================
// FILE: frontend/src/pages/SellerInquiries.jsx
// =============================================================

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const STATUSES = ['new', 'contacted', 'in-progress', 'closed'];

export default function SellerInquiries() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const r = await api.get('/inquiries', { params: { limit: 50 } });
      setItems(r.data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function setStatus(id, status) {
    try {
      await api.patch(`/inquiries/${id}`, { status });
      setItems((list) => list.map((i) => i._id === id ? { ...i, status } : i));
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link to="/seller" className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 uppercase tracking-wider">
        ← Dashboard
      </Link>
      <h1 className="mt-2 text-3xl font-extrabold text-zinc-900">Inquiries</h1>
      <p className="mt-1 text-sm text-zinc-500">Messages from buyers about your listings.</p>

      {loading && <p className="mt-8 text-sm text-zinc-500">Loading…</p>}
      {error && (
        <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
      )}
      {!loading && items.length === 0 && (
        <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
          No inquiries yet.
        </div>
      )}

      <ul className="mt-8 space-y-4">
        {items.map((i) => (
          <li key={i._id} className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-zinc-900">{i.name}</p>
                <p className="text-xs text-zinc-500">{i.email}{i.phone ? ` · ${i.phone}` : ''}</p>
                <p className="mt-2 text-xs text-zinc-500">
                  About:{' '}
                  {i.vehicle
                    ? `${i.vehicle.year} ${i.vehicle.make} ${i.vehicle.model}`
                    : 'a listing'}
                </p>
              </div>
              <select
                value={i.status}
                onChange={(e) => setStatus(i._id, e.target.value)}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wider focus:outline-none focus:border-brand-500"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <p className="mt-3 text-sm text-zinc-700 whitespace-pre-line">{i.message}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

// =============================================================
// END OF FILE: frontend/src/pages/SellerInquiries.jsx
// =============================================================